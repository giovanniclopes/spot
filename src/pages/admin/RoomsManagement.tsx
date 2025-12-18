import { RoomBlockModal } from "@/components/admin/RoomBlockModal";
import { RoomFormModal } from "@/components/admin/RoomFormModal";
import { BackButton } from "@/components/layout/BackButton";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types/database";
import { Building2, Edit, Plus, Trash2, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function RoomsManagement() {
  const { hasRole } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ativo" | "manutencao"
  >("all");

  useEffect(() => {
    if (hasRole("admin")) {
      loadRooms();
    }
  }, [hasRole, filterStatus]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("rooms")
        .select("*")
        .order("floor")
        .order("name");

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRooms((data as Room[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar salas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Tem certeza que deseja excluir a sala "${room.name}"?`))
      return;

    try {
      const { error } = await supabase.from("rooms").delete().eq("id", room.id);
      if (error) throw error;
      toast.success("Sala excluída com sucesso!");
      loadRooms();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir sala");
    }
  };

  if (!hasRole("admin")) {
    return (
      <div className="min-h-screen bg-gradient-canvas">
        <div className="container mx-auto px-4 pt-24 pb-12">
        <Card>
          <CardContent className="py-12 text-center">
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
        <div className="container mx-auto px-4 pt-24 pb-12">
          <BackButton to="/dashboard" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
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
              <h1 className="text-heading-1 font-semibold mb-2">
                Gestão de Salas
              </h1>
              <p className="text-caption text-muted-foreground">
                Gerencie as salas de reunião disponíveis
              </p>
            </div>
          <Button
            onClick={() => {
              setSelectedRoom(null);
              setFormModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Sala
          </Button>
        </div>

        <div className="mb-4 flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === "ativo" ? "default" : "outline"}
            onClick={() => setFilterStatus("ativo")}
          >
            Ativas
          </Button>
          <Button
            variant={filterStatus === "manutencao" ? "default" : "outline"}
            onClick={() => setFilterStatus("manutencao")}
          >
            Em Manutenção
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              {room.image_url && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{room.name}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      room.status === "ativo"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {room.status === "ativo" ? "Ativa" : "Manutenção"}
                  </span>
                </CardTitle>
                <CardDescription>
                  {room.floor === 0 ? "Térreo" : `${room.floor}º Andar`} •{" "}
                  {room.capacity} pessoas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {room.facilities && room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.facilities.map((facility) => (
                        <span
                          key={facility}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoom(room);
                        setFormModalOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoom(room);
                        setBlockModalOpen(true);
                      }}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Bloquear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(room)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma sala encontrada</p>
            </CardContent>
          </Card>
        )}

        <RoomFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setSelectedRoom(null);
          }}
          onSuccess={() => {
            loadRooms();
            setFormModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
        />

        <RoomBlockModal
          open={blockModalOpen}
          onClose={() => {
            setBlockModalOpen(false);
            setSelectedRoom(null);
          }}
          onSuccess={() => {
            loadRooms();
            setBlockModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
        />
        </div>
      </div>
    </ProtectedRoute>
  );
}
