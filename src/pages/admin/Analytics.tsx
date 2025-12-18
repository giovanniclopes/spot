import { BackButton } from "@/components/layout/BackButton";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OccupancyData {
  room_name: string;
  occupancy_rate: number;
  total_hours: number;
  booked_hours: number;
}

interface DepartmentData {
  department: string;
  bookings: number;
}

export function Analytics() {
  const { hasRole } = useAuth();
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasRole("admin")) {
      loadAnalytics();
    }
  }, [hasRole]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, room:rooms(name), user:profiles(department)")
        .eq("status", "confirmado")
        .gte("start_time", thirtyDaysAgo.toISOString());

      if (bookings) {
        const roomMap = new Map<string, { total: number; booked: number }>();
        const deptMap = new Map<string, number>();

        bookings.forEach((booking: any) => {
          const roomName = booking.room?.name || "Unknown";
          const duration =
            (new Date(booking.end_time).getTime() -
              new Date(booking.start_time).getTime()) /
            (1000 * 60 * 60);

          if (!roomMap.has(roomName)) {
            roomMap.set(roomName, { total: 30 * 13.17, booked: 0 });
          }
          const room = roomMap.get(roomName)!;
          room.booked += duration;

          const dept = booking.user?.department || "Não informado";
          deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });

        const occupancy: OccupancyData[] = Array.from(roomMap.entries()).map(
          ([name, data]) => ({
            room_name: name,
            occupancy_rate: (data.booked / data.total) * 100,
            total_hours: data.total,
            booked_hours: data.booked,
          })
        );

        const departments: DepartmentData[] = Array.from(deptMap.entries()).map(
          ([dept, count]) => ({
            department: dept,
            bookings: count,
          })
        );

        setOccupancyData(
          occupancy.sort((a, b) => b.occupancy_rate - a.occupancy_rate)
        );
        setDepartmentData(departments.sort((a, b) => b.bookings - a.bookings));
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#2563EB", "#0F172A", "#64748B", "#94A3B8", "#CBD5E1"];

  if (!hasRole("admin")) {
    return (
      <div className="min-h-screen bg-gradient-canvas">
        <Navbar />
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Analytics e Relatórios</h1>
          <p className="text-muted-foreground">
            Métricas e estatísticas de uso do sistema
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Taxa de Ocupação por Sala</CardTitle>
              </div>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="room_name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? `${value.toFixed(1)}%` : ""
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="occupancy_rate"
                    fill="#2563EB"
                    name="Taxa de Ocupação (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Reservas por Departamento</CardTitle>
              </div>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData as any[]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.department}: ${entry.bookings}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="bookings"
                  >
                    {departmentData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
