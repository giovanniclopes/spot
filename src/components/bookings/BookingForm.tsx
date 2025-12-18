import { useState, useEffect } from "react";
import { parse } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getTimeFromSlotIndex, generateTimeSlots } from "@/lib/timeline";
import {
  validateBookingDuration,
  validateBookingAdvance,
  validateRoomCapacity,
  validateRoomAvailability,
} from "@/lib/bookingValidation";
import { toast } from "sonner";
import type { Room } from "@/types/database";

interface BookingFormProps {
  roomId: string;
  date: Date;
  startSlot: number;
  endSlot: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingForm({ roomId, date, startSlot, endSlot, onClose, onSuccess }: BookingFormProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [selectedStartSlot, setSelectedStartSlot] = useState(startSlot);
  const [selectedEndSlot, setSelectedEndSlot] = useState(endSlot);
  const [loading, setLoading] = useState(false);

  const slots = generateTimeSlots();

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    const { data, error } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    if (error) {
      toast.error("Erro ao carregar informações da sala");
      return;
    }
    setRoom(data as Room);
    if (data) {
      setAttendeesCount(Math.min(1, data.capacity));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room) return;

    setLoading(true);

    try {
      const startTimeStr = getTimeFromSlotIndex(selectedStartSlot);
      const endTimeStr = getTimeFromSlotIndex(selectedEndSlot);

      const startTime = parse(startTimeStr, "HH:mm", date);
      const endTime = parse(endTimeStr, "HH:mm", date);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const durationValidation = await validateBookingDuration(startTime, endTime);
      if (!durationValidation.valid) {
        toast.error(durationValidation.error);
        setLoading(false);
        return;
      }

      const advanceValidation = await validateBookingAdvance(startTime);
      if (!advanceValidation.valid) {
        toast.error(advanceValidation.error);
        setLoading(false);
        return;
      }

      const capacityValidation = validateRoomCapacity(attendeesCount, room.capacity);
      if (!capacityValidation.valid) {
        toast.error(capacityValidation.error);
        setLoading(false);
        return;
      }

      const availabilityValidation = await validateRoomAvailability(roomId, startTime, endTime);
      if (!availabilityValidation.valid) {
        toast.error(availabilityValidation.error);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("bookings").insert({
        room_id: roomId,
        user_id: user.id,
        title,
        description: description || null,
        attendees_count: attendeesCount,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "confirmado",
      });

      if (insertError) throw insertError;

      toast.success("Reserva criada com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar reserva");
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Reserva</DialogTitle>
          <DialogDescription>
            Reservar {room.name} - {room.floor === 0 ? "Térreo" : `${room.floor}º Andar`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título / Assunto *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião de Planejamento"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre a reunião"
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário Início *</Label>
              <Select
                value={String(selectedStartSlot)}
                onValueChange={(v) => {
                  const slot = parseInt(v);
                  setSelectedStartSlot(slot);
                  if (slot >= selectedEndSlot) {
                    setSelectedEndSlot(Math.min(slot + 1, slots.length - 1));
                  }
                }}
              >
                <SelectTrigger id="startTime" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot.index} value={String(slot.index)}>
                      {slot.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Horário Término *</Label>
              <Select
                value={String(selectedEndSlot)}
                onValueChange={(v) => setSelectedEndSlot(parseInt(v))}
              >
                <SelectTrigger id="endTime" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slots
                    .filter((slot) => slot.index > selectedStartSlot)
                    .map((slot) => (
                      <SelectItem key={slot.index} value={String(slot.index)}>
                        {slot.display}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees">Quantidade de Participantes *</Label>
            <Input
              id="attendees"
              type="number"
              min="1"
              max={room.capacity}
              value={attendeesCount}
              onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Capacidade máxima: {room.capacity} pessoas
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

