import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Calendar, Activity, Sun, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  tariff: number;
}

export default function StayNew() {
  const { id: propertyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [monitoringEntry, setMonitoringEntry] = useState("");
  const [codigo03Entry, setCodigo03Entry] = useState("");
  const [codigo103Entry, setCodigo103Entry] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && propertyId) {
      fetchProperty();
    }
  }, [user, propertyId]);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, tariff")
      .eq("id", propertyId)
      .single();

    if (error) {
      toast.error("Erro ao carregar propriedade");
      navigate("/dashboard");
      return;
    }
    setProperty(data as Property);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      toast.error("Nome do hóspede é obrigatório");
      return;
    }

    if (!checkInDate) {
      toast.error("Data de entrada é obrigatória");
      return;
    }

    if (!monitoringEntry || !codigo03Entry || !codigo103Entry) {
      toast.error("Todas as leituras de entrada são obrigatórias");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("stays")
      .insert({
        property_id: propertyId,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim() || null,
        check_in_date: checkInDate,
        monitoring_entry: parseFloat(monitoringEntry),
        codigo_03_entry: parseFloat(codigo03Entry),
        codigo_103_entry: parseFloat(codigo103Entry),
        tariff_used: property?.tariff || 0.75,
        status: "in_progress",
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating stay:", error);
      toast.error("Erro ao criar estadia");
    } else if (data) {
      toast.success("Estadia registrada!");
      navigate(`/stays/${(data as any).id}`);
    }

    setSaving(false);
  };

  if (loading || !property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Nova Estadia</h1>
            <p className="text-sm text-muted-foreground">{property.name}</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container max-w-lg mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Info */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Dados do Hóspede
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Nome do hóspede *</Label>
                <Input
                  id="guestName"
                  placeholder="João Silva"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPhone">WhatsApp</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="bg-muted/50 border-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Check-in Date */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Data de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Data de check-in *</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Entry Readings */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Leituras de Entrada
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Registre as leituras no momento do check-in
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monitoringEntry" className="flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  Monitoramento Solar (kWh) *
                </Label>
                <Input
                  id="monitoringEntry"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monitoringEntry}
                  onChange={(e) => setMonitoringEntry(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo03Entry" className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Código 03 - Consumo da Rede (kWh) *
                </Label>
                <Input
                  id="codigo03Entry"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={codigo03Entry}
                  onChange={(e) => setCodigo03Entry(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo103Entry" className="flex items-center gap-2">
                  <Sun className="h-3 w-3" />
                  Código 103 - Injeção na Rede (kWh) *
                </Label>
                <Input
                  id="codigo103Entry"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={codigo103Entry}
                  onChange={(e) => setCodigo103Entry(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 gradient-solar hover:opacity-90"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Registrar Entrada"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
