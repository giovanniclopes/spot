import { StatCard } from "@/components/dashboard/StatCard";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { CardInteractive } from "@/components/ui/card-interactive";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const { profile } = useAuth();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    todayBookings: 0,
    monthBookings: 0,
  });

  const loadStats = useCallback(async () => {
    if (!profile) return;

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const { data: upcoming } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "confirmado")
      .gte("start_time", new Date().toISOString())
      .limit(10);

    const { data: today } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "confirmado")
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString());

    const { data: month } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "confirmado")
      .gte("start_time", monthStart.toISOString())
      .lte("start_time", monthEnd.toISOString());

    setStats({
      upcomingBookings: upcoming?.length || 0,
      todayBookings: today?.length || 0,
      monthBookings: month?.length || 0,
    });
  }, [profile]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <section
          className="mb-8 sm:mb-12 p-6 sm:p-8 rounded-2xl text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #0F6CBD 0%, #005A9E 100%)",
          }}
        >
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">
              {getGreeting()}, {profile?.full_name?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-base sm:text-lg opacity-90 mb-6">
              Hoje é{" "}
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/timeline")}
              className="bg-white text-blue-700 hover:bg-white/90 font-semibold"
            >
              Nova Reserva
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard
            icon={Calendar}
            value={stats.upcomingBookings}
            label="Próximas Reservas"
            color="blue"
          />
          <StatCard
            icon={Clock}
            value={stats.todayBookings}
            label="Reservas Hoje"
            color="green"
          />
          <StatCard
            icon={CheckCircle}
            value={stats.monthBookings}
            label="Reservas este Mês"
            color="purple"
          />
          <StatCard
            icon={Users}
            value={profile?.department || "-"}
            label="Seu Departamento"
            color="orange"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-heading-1 font-semibold mb-6">Acesso Rápido</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardInteractive
              icon={Calendar}
              title="Timeline"
              description="Visualize e gerencie agendamentos de salas"
              onClick={() => navigate("/timeline")}
            />
            <CardInteractive
              icon={Users}
              title="Minhas Reservas"
              description="Veja suas reservas futuras e passadas"
              onClick={() => navigate("/my-bookings")}
            />
            <CardInteractive
              icon={Settings}
              title="Configurações"
              description="Gerencie sua conta e preferências"
              onClick={() => navigate("/settings")}
            />
          </div>
        </div>

        {isAdmin && (
          <div>
            <h2 className="text-heading-1 font-semibold mb-6">Administração</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CardInteractive
                icon={Shield}
                title="Gestão de Usuários"
                description="Gerencie usuários e permissões do sistema"
                onClick={() => navigate("/admin/users")}
                iconColor="text-purple-600"
              />
              <CardInteractive
                icon={Building2}
                title="Gestão de Salas"
                description="Configure e gerencie salas de reunião"
                onClick={() => navigate("/admin/rooms")}
                iconColor="text-green-600"
              />
              <CardInteractive
                icon={BarChart3}
                title="Analytics"
                description="Visualize métricas e relatórios detalhados"
                onClick={() => navigate("/admin/analytics")}
                iconColor="text-orange-600"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
