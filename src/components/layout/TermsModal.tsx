import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TermsModal() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ terms_accepted: true })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Termos aceitos com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao aceitar termos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Termos de Uso e Privacidade</DialogTitle>
          </div>
          <DialogDescription>
            Antes de continuar, leia e aceite os termos de uso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">Visibilidade de Dados</p>
            <p className="text-muted-foreground">
              Ao usar o sistema Spot, você concorda que seu{" "}
              <strong>nome completo</strong> e <strong>foto de perfil</strong>
              ficarão visíveis na Timeline de agendamentos para todos os
              colaboradores da organização.
            </p>
            <p className="text-muted-foreground mt-4">
              Esta visibilidade é necessária para facilitar a identificação dos
              organizadores das reuniões e melhorar a comunicação entre os
              times.
            </p>
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              Seus dados pessoais são tratados de acordo com a LGPD. Para mais
              informações, entre em contato com o RH.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAccept} disabled={loading}>
            {loading ? "Processando..." : "De acordo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
