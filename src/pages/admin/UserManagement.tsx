import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { BackButton } from "@/components/layout/BackButton";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import { Plus, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function UserManagement() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (hasRole("admin")) {
      loadUsers();
    }
  }, [hasRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers((data as Profile[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole("admin")) {
    return (
      <div className="min-h-screen bg-gradient-canvas">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Acesso negado. Apenas administradores podem acessar esta página.
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-canvas">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-canvas">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
        <BackButton to="/dashboard" />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestão de Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie usuários, roles e permissões do sistema
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Usuário
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {user.full_name || "Sem nome"}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Departamento: </span>
                    <span className="text-muted-foreground">
                      {user.department || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Role: </span>
                    <span className="text-muted-foreground capitalize">
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Termos aceitos: </span>
                    <span
                      className={
                        user.terms_accepted ? "text-success" : "text-warning"
                      }
                    >
                      {user.terms_accepted ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}

        <CreateUserModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadUsers();
            setCreateModalOpen(false);
          }}
        />
        </div>
      </div>
    </ProtectedRoute>
  );
}
