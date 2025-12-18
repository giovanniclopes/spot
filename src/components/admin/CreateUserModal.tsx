import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Não autenticado");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          department,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar usuário");
      }

      const data = await response.json();
      setTempPassword(data.temp_password);
      toast.success("Usuário criado com sucesso!");
      setEmail("");
      setFullName("");
      setDepartment("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Senha copiada para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Usuário Criado com Sucesso</DialogTitle>
              <DialogDescription>
                Anote a senha temporária para repassar ao usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1">Senha Temporária</p>
                    <p className="text-lg font-mono">{tempPassword}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-warning/10 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  ⚠️ Esta senha será exibida apenas uma vez. Certifique-se de anotá-la antes de fechar este modal.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                handleClose();
                onSuccess();
              }}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="João Silva"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="TI, RH, Vendas..."
                  required
                  disabled={loading}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

