import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types/database";
import { toast } from "sonner";

interface RoomFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room?: Room | null;
}

const FACILITIES_OPTIONS = ["TV", "HDMI", "AC", "Projetor", "Sistema de Som", "Quadro Branco"];

export function RoomFormModal({ open, onClose, onSuccess, room }: RoomFormModalProps) {
  const [name, setName] = useState("");
  const [floor, setFloor] = useState<number>(0);
  const [capacity, setCapacity] = useState(1);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [status, setStatus] = useState<"ativo" | "manutencao">("ativo");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setName(room.name);
      setFloor(room.floor);
      setCapacity(room.capacity);
      setFacilities(room.facilities || []);
      setStatus(room.status);
    } else {
      resetForm();
    }
  }, [room, open]);

  const resetForm = () => {
    setName("");
    setFloor(0);
    setCapacity(1);
    setFacilities([]);
    setStatus("ativo");
    setImageFile(null);
  };

  const handleFacilityToggle = (facility: string) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = room?.image_url || null;

      if (imageFile) {
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

        if (imageFile.size > MAX_FILE_SIZE) {
          toast.error("A imagem deve ter no máximo 5MB");
          setLoading(false);
          return;
        }

        if (!ALLOWED_TYPES.includes(imageFile.type)) {
          toast.error("Apenas imagens JPG, PNG ou WEBP são permitidas");
          setLoading(false);
          return;
        }

        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `room-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("room-images")
          .upload(filePath, imageFile, {
            contentType: imageFile.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("room-images").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      if (room) {
        const { error } = await supabase
          .from("rooms")
          .update({
            name,
            floor,
            capacity,
            facilities,
            status,
            image_url: imageUrl,
          })
          .eq("id", room.id);

        if (error) throw error;
        toast.success("Sala atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("rooms").insert({
          name,
          floor,
          capacity,
          facilities,
          status,
          image_url: imageUrl,
        });

        if (error) throw error;
        toast.success("Sala criada com sucesso!");
      }

      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar sala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{room ? "Editar Sala" : "Nova Sala"}</DialogTitle>
          <DialogDescription>
            {room ? "Atualize as informações da sala" : "Preencha os dados para criar uma nova sala"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Sala *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sala de Reunião A"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Andar *</Label>
              <Select value={String(floor)} onValueChange={(v) => setFloor(parseInt(v))}>
                <SelectTrigger id="floor" disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Térreo</SelectItem>
                  <SelectItem value="1">1º Andar</SelectItem>
                  <SelectItem value="2">2º Andar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recursos Disponíveis</Label>
            <div className="grid grid-cols-2 gap-2">
              {FACILITIES_OPTIONS.map((facility) => (
                <div key={facility} className="flex items-center space-x-2">
                  <Switch
                    checked={facilities.includes(facility)}
                    onCheckedChange={() => handleFacilityToggle(facility)}
                    disabled={loading}
                  />
                  <Label className="font-normal">{facility}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "ativo" | "manutencao")}>
              <SelectTrigger id="status" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativa</SelectItem>
                <SelectItem value="manutencao">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Foto da Sala</Label>
            <Input
              id="image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : room ? "Atualizar" : "Criar Sala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

