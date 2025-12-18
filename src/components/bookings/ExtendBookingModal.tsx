import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { generateTimeSlots, END_TIME } from "@/lib/timeline";
import { validateRoomAvailability } from "@/lib/bookingValidation";
import { toast } from "sonner";
import type { Booking } from "@/types/database";
import { Clock } from "lucide-react";

interface ExtendBookingModalProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExtendBookingModal({
  booking,
  open,
  onClose,
  onSuccess,
}: ExtendBookingModalProps) {
  const [selectedEndSlot, setSelectedEndSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<
    { index: number; time: string; display: string }[]
  >([]);

  const slots = generateTimeSlots();
  const currentEndTime = new Date(booking.end_time);
  const currentEndTimeStr = format(currentEndTime, "HH:mm");

  useEffect(() => {
    if (open) {
      loadAvailableSlots();
    }
  }, [open, booking]);

  const loadAvailableSlots = () => {
    const endTimeLimit = parse(END_TIME, "HH:mm", new Date());
    const currentEnd = parse(currentEndTimeStr, "HH:mm", new Date());

    const available = slots.filter((slot) => {
      const slotTime = parse(slot.time, "HH:mm", new Date());
      return slotTime > currentEnd && slotTime <= endTimeLimit;
    });

    setAvailableSlots(available);

    if (available.length > 0) {
      setSelectedEndSlot(available[0].index);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEndSlot === null) return;

    setLoading(true);

    try {
      const startTime = new Date(booking.start_time);
      const selectedSlot = slots[selectedEndSlot];
      const newEndTime = parse(selectedSlot.time, "HH:mm", startTime);

      if (newEndTime <= currentEndTime) {
        toast.error("O novo horário deve ser posterior ao horário atual.");
        setLoading(false);
        return;
      }

      const availabilityValidation = await validateRoomAvailability(
        booking.room_id,
        startTime,
        newEndTime,
        booking.id
      );

      if (!availabilityValidation.valid) {
        toast.error(
          availabilityValidation.error ||
            "Não há disponibilidade neste período."
        );
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ end_time: newEndTime.toISOString() })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      toast.success("Reserva prolongada com sucesso!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao prolongar reserva");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prolongar Reunião</DialogTitle>
          <DialogDescription>
            Estenda o horário de término da sua reserva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sala</p>
              <p className="text-sm">
                {booking.room?.name} •{" "}
                {booking.room?.floor === 0
                  ? "Térreo"
                  : `${booking.room?.floor}º Andar`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Horário Atual
              </p>
              <p className="text-sm">
                {format(new Date(booking.start_time), "HH:mm")} -{" "}
                {format(currentEndTime, "HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data</p>
              <p className="text-sm">
                {format(
                  new Date(booking.start_time),
                  "dd 'de' MMMM 'de' yyyy",
                  {
                    locale: ptBR,
                  }
                )}
              </p>
            </div>
          </div>

          {availableSlots.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="newEndTime">
                Novo Horário de Término *
              </Label>
              <Select
                value={
                  selectedEndSlot !== null ? String(selectedEndSlot) : undefined
                }
                onValueChange={(v) => setSelectedEndSlot(parseInt(v))}
              >
                <SelectTrigger id="newEndTime" disabled={loading}>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot.index} value={String(slot.index)}>
                      {slot.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A disponibilidade da sala será verificada antes de confirmar
              </p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Não há horários disponíveis para prolongar esta reserva. O
                horário limite do sistema é 19:00.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || availableSlots.length === 0}
            >
              <Clock className="h-4 w-4 mr-2" />
              {loading ? "Prolongando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

