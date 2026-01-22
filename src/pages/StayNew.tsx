import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Calendar, DollarSign, Loader2, CreditCard } from "lucide-react";
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
  const [checkOutDate, setCheckOutDate] = useState("");
  const [tariff, setTariff] = useState("");
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && propertyId) {
      fetchProperty();
      fetchUserProfile();
    }
  }, [user, propertyId]);

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("pix_key")
      .eq("user_id", user?.id)
      .single();

    if (data?.pix_key) {
      setPixKey(data.pix_key);
    }
  };

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
    setTariff(data.tariff?.toString() || "0.75");
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

    if (!checkOutDate) {
      toast.error("Data de saída é obrigatória");
      return;
    }

    if (!tariff) {
      toast.error("Tarifa é obrigatória");
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
        check_out_date: checkOutDate,
        tariff_used: parseFloat(tariff),
        pix_key: pixKey.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating stay:", error);
      toast.error("Erro ao criar estadia");
    } else if (data) {
      toast.success("Reserva criada! Agora registre as leituras de entrada.");
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

          {/* Dates */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Período da Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Data de entrada *</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Data de saída *</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Tariff & PIX */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                Cobrança
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Tarifa e dados para pagamento
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tariff">Tarifa (R$/kWh) *</Label>
                <Input
                  id="tariff"
                  type="number"
                  step="0.01"
                  placeholder="0.75"
                  value={tariff}
                  onChange={(e) => setTariff(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pixKey" className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  Chave PIX
                </Label>
                <Input
                  id="pixKey"
                  placeholder="email@exemplo.com ou CPF/CNPJ"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="bg-muted/50 border-0"
                />
                <p className="text-xs text-muted-foreground">
                  Será enviada ao hóspede para pagamento
                </p>
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
              "Criar Reserva"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
