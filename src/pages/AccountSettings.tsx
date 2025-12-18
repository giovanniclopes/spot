import { BackButton } from "@/components/layout/BackButton";
import { Navbar } from "@/components/layout/Navbar";
import { AvatarUploadModal } from "@/components/profile/AvatarUploadModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { deleteAvatar, uploadAvatar } from "@/lib/avatarStorage";
import { supabase } from "@/lib/supabase";
import { Camera, KeyRound, Trash2, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AccountSettings() {
  const { profile, refreshProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  const handleAvatarUpload = async (file: Blob) => {
    if (!profile?.id) return;

    try {
      await uploadAvatar(profile.id, file);
      await refreshProfile();
    } catch (error: any) {
      throw error;
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile?.id) return;

    setDeletingAvatar(true);
    try {
      await deleteAvatar(profile.id);
      await refreshProfile();
      toast.success("Foto de perfil removida com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover foto");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
      <BackButton to="/dashboard" />
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Configurações da Conta</h1>
        <p className="text-muted-foreground">
          Gerencie suas configurações pessoais e segurança
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <CardTitle>Foto de Perfil</CardTitle>
          </div>
          <CardDescription>
            Personalize sua conta com uma foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-gray-100 shadow-lg">
              <AvatarImage
                src={profile?.avatar_url || undefined}
                alt={profile?.full_name || "User"}
              />
              <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-primary to-brand-secondary text-white">
                {getInitials(profile?.full_name || profile?.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-3 flex-1">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  {profile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
                {profile?.department && (
                  <p className="text-xs text-gray-500">{profile.department}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Alterar Foto
                </Button>

                {profile?.avatar_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarDelete}
                    disabled={deletingAvatar}
                    className="gap-2 text-error hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingAvatar ? "Removendo..." : "Remover Foto"}
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPEG, PNG, WEBP (máx. 2MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>
            Altere sua senha temporária ou atual para uma nova senha segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AvatarUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleAvatarUpload}
      />
      </div>
    </div>
  );
}
