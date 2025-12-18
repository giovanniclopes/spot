import { ExtendBookingModal } from "@/components/bookings/ExtendBookingModal";
import { BackButton } from "@/components/layout/BackButton";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Booking } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Calendar, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, room:rooms(*)")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setBookings((data as Booking[]) || []);
    } catch {
      toast.error("Erro ao carregar reservas");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;

    setCancelling(true);
    setShowCancelConfirm(false);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelado" })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast.success("Reserva cancelada com sucesso");
      setSelectedBooking(null);
      loadBookings();
    } catch {
      toast.error("Erro ao cancelar reserva");
    } finally {
      setCancelling(false);
    }
  };

  const futureBookings = bookings.filter(
    (b) => b.status === "confirmado" && new Date(b.start_time) >= new Date()
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "confirmado" && new Date(b.start_time) < new Date()
  );
  const cancelledBookings = bookings.filter((b) => b.status === "cancelado");

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
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <BackButton to="/dashboard" />
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Minhas Reservas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas reservas de salas de reunião
          </p>
        </div>

        {futureBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Próximas Reservas</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {futureBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.title}</CardTitle>
                    <CardDescription>
                      {booking.room?.name} •{" "}
                      {booking.room?.floor === 0
                        ? "Térreo"
                        : `${booking.room?.floor}º Andar`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(
                            new Date(booking.start_time),
                            "dd 'de' MMMM 'de' yyyy",
                            {
                              locale: ptBR,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.start_time), "HH:mm")} -{" "}
                          {format(new Date(booking.end_time), "HH:mm")}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {booking.attendees_count} participante
                        {booking.attendees_count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Reservas Ativas</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-90 hover:opacity-100"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.title}</CardTitle>
                    <CardDescription>
                      {booking.room?.name} •{" "}
                      {booking.room?.floor === 0
                        ? "Térreo"
                        : `${booking.room?.floor}º Andar`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(
                            new Date(booking.start_time),
                            "dd 'de' MMMM 'de' yyyy",
                            {
                              locale: ptBR,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.start_time), "HH:mm")} -{" "}
                          {format(new Date(booking.end_time), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {cancelledBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reservas Canceladas</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cancelledBookings.map((booking) => (
                <Card key={booking.id} className="opacity-50">
                  <CardHeader>
                    <CardTitle className="text-lg line-through">
                      {booking.title}
                    </CardTitle>
                    <CardDescription>
                      {booking.room?.name} • Cancelada
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Você ainda não possui reservas
              </p>
            </CardContent>
          </Card>
        )}

        {selectedBooking && (
          <>
            <Dialog open={true} onOpenChange={() => setSelectedBooking(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedBooking.title}</DialogTitle>
                  <DialogDescription>Detalhes da reserva</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Sala</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.room?.name} •{" "}
                      {selectedBooking.room?.floor === 0
                        ? "Térreo"
                        : `${selectedBooking.room?.floor}º Andar`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data e Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(selectedBooking.start_time),
                        "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}{" "}
                      - {format(new Date(selectedBooking.end_time), "HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Participantes</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.attendees_count} pessoa
                      {selectedBooking.attendees_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {selectedBooking.description && (
                    <div>
                      <p className="text-sm font-medium">Descrição</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.description}
                      </p>
                    </div>
                  )}
                  {selectedBooking.status !== "cancelado" && (
                    <div className="pt-4 space-y-2">
                      {new Date(selectedBooking.end_time) > new Date() && (
                        <Button
                          onClick={() => setShowExtendModal(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Prolongar Reunião
                        </Button>
                      )}
                      <Button
                        onClick={handleCancelClick}
                        disabled={cancelling}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar Reserva
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {showExtendModal && (
              <ExtendBookingModal
                booking={selectedBooking}
                open={showExtendModal}
                onClose={() => setShowExtendModal(false)}
                onSuccess={() => {
                  setShowExtendModal(false);
                  setSelectedBooking(null);
                  loadBookings();
                }}
              />
            )}

            <Dialog
              open={showCancelConfirm}
              onOpenChange={setShowCancelConfirm}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Confirmar Cancelamento
                  </DialogTitle>
                  <DialogDescription>
                    Esta ação não pode ser desfeita. Tem certeza que deseja
                    cancelar esta reserva?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <div>
                    <p className="text-sm font-medium">Reserva</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking?.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data e Horário</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking &&
                        format(
                          new Date(selectedBooking.start_time),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}{" "}
                      -{" "}
                      {selectedBooking &&
                        format(new Date(selectedBooking.end_time), "HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCancelConfirm}
                    disabled={cancelling}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {cancelling ? "Cancelando..." : "Sim, Cancelar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
