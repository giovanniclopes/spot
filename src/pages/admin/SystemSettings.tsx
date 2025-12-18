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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Settings } from "@/types/database";
import { Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function SystemSettings() {
  const { hasRole } = useAuth();
  const [settings, setSettings] = useState<Settings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hasRole("admin")) {
      loadSettings();
    }
  }, [hasRole]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("settings").select("*");

      if (error) throw error;
      setSettings((data as Settings[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      toast.success("Configuração atualizada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

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

  const maxDuration = settings.find(
    (s) => s.key === "max_booking_duration_hours"
  );
  const maxDays = settings.find((s) => s.key === "max_days_ahead");

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-canvas">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
          <BackButton to="/dashboard" />
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações globais do sistema
            </p>
          </div>

          <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>Limites de Reserva</CardTitle>
            </div>
            <CardDescription>
              Configure os limites padrão para criação de reservas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxDuration">
                Duração Máxima de Reserva (horas) *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="maxDuration"
                  type="number"
                  min="1"
                  value={maxDuration?.value || "4"}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSettings((prev) =>
                      prev.map((s) =>
                        s.key === "max_booking_duration_hours"
                          ? { ...s, value: newValue }
                          : s
                      )
                    );
                  }}
                  disabled={saving}
                />
                <Button
                  onClick={() =>
                    handleSave(
                      "max_booking_duration_hours",
                      maxDuration?.value || "4"
                    )
                  }
                  disabled={saving}
                >
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {maxDuration?.description ||
                  "Duração máxima permitida para uma reserva"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDays">Antecedência Máxima (dias) *</Label>
              <div className="flex gap-2">
                <Input
                  id="maxDays"
                  type="number"
                  min="1"
                  value={maxDays?.value || "30"}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSettings((prev) =>
                      prev.map((s) =>
                        s.key === "max_days_ahead"
                          ? { ...s, value: newValue }
                          : s
                      )
                    );
                  }}
                  disabled={saving}
                />
                <Button
                  onClick={() =>
                    handleSave("max_days_ahead", maxDays?.value || "30")
                  }
                  disabled={saving}
                >
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {maxDays?.description ||
                  "Quantos dias à frente é possível agendar"}
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
