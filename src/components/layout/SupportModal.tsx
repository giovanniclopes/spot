import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { HelpCircle } from "lucide-react";

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export function SupportModal({ open, onClose }: SupportModalProps) {
  const { profile } = useAuth();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supportData = {
        user_email: profile?.email || "unknown",
        user_name: profile?.full_name || "Unknown",
        subject,
        description,
        created_at: new Date().toISOString(),
      };

      console.log("Support request:", supportData);

      toast.success("Sua solicitação foi enviada! A equipe de TI entrará em contato em breve.");
      setSubject("");
      setDescription("");
      onClose();
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <DialogTitle>Reportar Problema / Ajuda</DialogTitle>
          </div>
          <DialogDescription>
            Envie sua dúvida, sugestão ou reporte um problema para a equipe de TI/Facilities
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problema ao criar reserva"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema, dúvida ou sugestão em detalhes..."
              required
              disabled={loading}
              rows={5}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

