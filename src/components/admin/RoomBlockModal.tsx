import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Room } from "@/types/database";
import { toast } from "sonner";

interface RoomBlockModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room: Room | null;
}

export function RoomBlockModal({ open, onClose, onSuccess, room }: RoomBlockModalProps) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room) return;

    setLoading(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        toast.error("A data/hora de término deve ser após a data/hora de início");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("room_blocks").insert({
        room_id: room.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        reason: reason || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Sala bloqueada com sucesso!");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setReason("");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao bloquear sala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquear Sala</DialogTitle>
          <DialogDescription>
            Bloquear {room?.name} para manutenção ou outro motivo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Início *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Término *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Término *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Manutenção do ar condicionado"
              disabled={loading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Bloqueando..." : "Confirmar Bloqueio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

