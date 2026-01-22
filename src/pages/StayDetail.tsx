import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Activity, Sun, Zap, DollarSign, Calendar, 
  User, Check, Copy, MessageCircle, Upload, Loader2 
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Stay {
  id: string;
  property_id: string;
  guest_name: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string | null;
  monitoring_entry: number | null;
  codigo_03_entry: number | null;
  codigo_103_entry: number | null;
  monitoring_exit: number | null;
  codigo_03_exit: number | null;
  codigo_103_exit: number | null;
  grid_consumption: number | null;
  grid_injection: number | null;
  solar_generation: number | null;
  self_consumption: number | null;
  total_consumption: number | null;
  amount_to_charge: number | null;
  tariff_used: number | null;
  is_paid: boolean;
  payment_proof_url: string | null;
  status: string;
}

interface Property {
  id: string;
  name: string;
  tariff: number;
  owner_id: string;
}

interface Profile {
  pix_key: string | null;
}

export default function StayDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stay, setStay] = useState<Stay | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Entry readings form
  const [monitoringEntry, setMonitoringEntry] = useState("");
  const [codigo03Entry, setCodigo03Entry] = useState("");
  const [codigo103Entry, setCodigo103Entry] = useState("");

  // Exit readings form
  const [checkOutDate, setCheckOutDate] = useState("");
  const [monitoringExit, setMonitoringExit] = useState("");
  const [codigo03Exit, setCodigo03Exit] = useState("");
  const [codigo103Exit, setCodigo103Exit] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchStayData();
    }
  }, [user, id]);

  const fetchStayData = async () => {
    try {
      // Fetch stay
      const { data: stayData, error: stayError } = await supabase
        .from("stays")
        .select("*")
        .eq("id", id)
        .single();

      if (stayError) throw stayError;
      if (!stayData) throw new Error("Stay not found");
      
      const stayTyped = stayData as Stay;
      setStay(stayTyped);

      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", stayTyped.property_id)
        .single();

      if (propertyError) throw propertyError;
      if (!propertyData) throw new Error("Property not found");
      
      const propertyTyped = propertyData as Property;
      setProperty(propertyTyped);

      // Fetch profile for PIX key
      const { data: profileData } = await supabase
        .from("profiles")
        .select("pix_key")
        .eq("user_id", propertyTyped.owner_id)
        .single();

      setProfile(profileData as Profile | null);

      // Set form values if already filled
      if (stayTyped.monitoring_entry) {
        setMonitoringEntry(stayTyped.monitoring_entry.toString());
      }
      if (stayTyped.codigo_03_entry) {
        setCodigo03Entry(stayTyped.codigo_03_entry.toString());
      }
      if (stayTyped.codigo_103_entry) {
        setCodigo103Entry(stayTyped.codigo_103_entry.toString());
      }
      if (stayTyped.check_out_date) {
        setCheckOutDate(stayTyped.check_out_date);
      }
      if (stayTyped.monitoring_exit) {
        setMonitoringExit(stayTyped.monitoring_exit.toString());
      }
      if (stayTyped.codigo_03_exit) {
        setCodigo03Exit(stayTyped.codigo_03_exit.toString());
      }
      if (stayTyped.codigo_103_exit) {
        setCodigo103Exit(stayTyped.codigo_103_exit.toString());
      }
    } catch (error) {
      console.error("Error fetching stay:", error);
      toast.error("Erro ao carregar estadia");
      navigate("/dashboard");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveEntryReadings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!monitoringEntry || !codigo03Entry || !codigo103Entry) {
      toast.error("Preencha todas as leituras de entrada");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("stays")
      .update({
        monitoring_entry: parseFloat(monitoringEntry),
        codigo_03_entry: parseFloat(codigo03Entry),
        codigo_103_entry: parseFloat(codigo103Entry),
        status: "in_progress",
      } as any)
      .eq("id", id);

    if (error) {
      console.error("Error saving entry readings:", error);
      toast.error("Erro ao salvar leituras de entrada");
    } else {
      toast.success("Leituras de entrada registradas!");
      fetchStayData();
    }

    setSaving(false);
  };

  const handleCompleteStay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!monitoringExit || !codigo03Exit || !codigo103Exit) {
      toast.error("Preencha todas as leituras de saída");
      return;
    }

    if (!stay) return;

    setSaving(true);

    // Calculate values
    const monitoringEntryVal = Number(stay.monitoring_entry) || 0;
    const codigo03EntryVal = Number(stay.codigo_03_entry) || 0;
    const codigo103EntryVal = Number(stay.codigo_103_entry) || 0;
    const monitoringExitVal = parseFloat(monitoringExit);
    const codigo03ExitVal = parseFloat(codigo03Exit);
    const codigo103ExitVal = parseFloat(codigo103Exit);
    const tariff = Number(stay.tariff_used) || property?.tariff || 0.75;

    const gridConsumption = codigo03ExitVal - codigo03EntryVal;
    const gridInjection = codigo103ExitVal - codigo103EntryVal;
    const solarGeneration = monitoringExitVal - monitoringEntryVal;
    const selfConsumption = solarGeneration - gridInjection;
    const totalConsumption = selfConsumption + gridConsumption;
    const amountToCharge = totalConsumption * tariff;

    const { error } = await supabase
      .from("stays")
      .update({
        monitoring_exit: monitoringExitVal,
        codigo_03_exit: codigo03ExitVal,
        codigo_103_exit: codigo103ExitVal,
        grid_consumption: gridConsumption,
        grid_injection: gridInjection,
        solar_generation: solarGeneration,
        self_consumption: selfConsumption,
        total_consumption: totalConsumption,
        amount_to_charge: amountToCharge,
        status: "completed",
      } as any)
      .eq("id", id);

    if (error) {
      console.error("Error updating stay:", error);
      toast.error("Erro ao finalizar estadia");
    } else {
      toast.success("Estadia finalizada!");
      fetchStayData();
    }

    setSaving(false);
  };

  const handleTogglePaid = async (paid: boolean) => {
    if (!stay) return;

    const { error } = await supabase
      .from("stays")
      .update({
        is_paid: paid,
        paid_at: paid ? new Date().toISOString() : null,
        status: paid ? "paid" : "completed",
      } as any)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar pagamento");
    } else {
      toast.success(paid ? "Marcado como pago!" : "Desmarcado");
      fetchStayData();
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !stay) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${stay.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("stays")
      .update({ payment_proof_url: publicUrl } as any)
      .eq("id", id);

    if (updateError) {
      toast.error("Erro ao salvar comprovante");
    } else {
      toast.success("Comprovante anexado!");
      fetchStayData();
    }

    setUploading(false);
  };

  const generateMessage = () => {
    if (!stay || !stay.amount_to_charge) return "";
    
    const checkIn = format(parseISO(stay.check_in_date), "dd/MM/yyyy", { locale: ptBR });
    const checkOut = stay.check_out_date 
      ? format(parseISO(stay.check_out_date), "dd/MM/yyyy", { locale: ptBR })
      : "";
    const days = stay.check_out_date 
      ? differenceInDays(parseISO(stay.check_out_date), parseISO(stay.check_in_date))
      : 0;

    let message = `⚡ *Olá ${stay.guest_name}!*

Segue o resumo do consumo de energia da sua estadia:

📅 *Período:* ${checkIn} a ${checkOut}
📆 *Dias:* ${days} dias

☀️ Geração solar: ${(stay.solar_generation || 0).toFixed(1)} kWh
🔄 Injetado na rede: ${(stay.grid_injection || 0).toFixed(1)} kWh
🏠 Autoconsumo solar: ${(stay.self_consumption || 0).toFixed(1)} kWh
⚡ Consumo da rede: ${(stay.grid_consumption || 0).toFixed(1)} kWh

📊 *Consumo total: ${(stay.total_consumption || 0).toFixed(1)} kWh*

💰 Tarifa: R$ ${(stay.tariff_used || 0).toFixed(2)}/kWh
💵 *Valor da energia: R$ ${stay.amount_to_charge.toFixed(2)}*`;

    if (profile?.pix_key) {
      message += `

💳 *Chave PIX para pagamento:*
${profile.pix_key}`;
    }

    message += `

_Obrigado pela preferência!_
_Calculado por Solo Energia_`;

    return message;
  };

  const handleCopy = async () => {
    const message = generateMessage();
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!stay?.guest_phone) {
      toast.error("WhatsApp do hóspede não cadastrado");
      return;
    }
    
    const phone = stay.guest_phone.replace(/\D/g, "");
    const phoneFormatted = phone.startsWith("55") ? phone : `55${phone}`;
    const message = encodeURIComponent(generateMessage());
    window.open(`https://wa.me/${phoneFormatted}?text=${message}`, "_blank");
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!stay || !property) return null;

  const isPendingEntry = stay.status === "pending_entry";
  const isInProgress = stay.status === "in_progress";
  const isCompleted = stay.status === "completed" || stay.status === "paid";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/properties/${property.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{stay.guest_name}</h1>
            <p className="text-sm text-muted-foreground">{property.name}</p>
          </div>
          {stay.is_paid && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              Pago
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Stay Info */}
        <Card className="shadow-card border-0 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Informações da Reserva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Check-in:</span>{" "}
                <span className="font-medium">
                  {format(parseISO(stay.check_in_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Check-out:</span>{" "}
                <span className="font-medium">
                  {stay.check_out_date 
                    ? format(parseISO(stay.check_out_date), "dd/MM/yyyy", { locale: ptBR })
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Tarifa:</span>{" "}
                <span className="font-medium">R$ {(stay.tariff_used || 0).toFixed(2)}/kWh</span>
              </div>
              {stay.guest_phone && (
                <div>
                  <span className="text-muted-foreground">WhatsApp:</span>{" "}
                  <span className="font-medium">{stay.guest_phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Entry Readings Info (if already filled) */}
        {!isPendingEntry && (
          <Card className="shadow-card border-0 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Leituras de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Monitoramento:</span>{" "}
                  <span className="font-medium">{stay.monitoring_entry} kWh</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Código 03:</span>{" "}
                  <span className="font-medium">{stay.codigo_03_entry} kWh</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Código 103:</span>{" "}
                  <span className="font-medium">{stay.codigo_103_entry} kWh</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entry Readings Form */}
        {isPendingEntry && (
          <form onSubmit={handleSaveEntryReadings} className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  Registrar Leituras de Entrada
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

            <Button
              type="submit"
              className="w-full h-12 gradient-solar hover:opacity-90"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar Leituras de Entrada"
              )}
            </Button>
          </form>
        )}

        {/* Exit Form */}
        {isInProgress && (
          <form onSubmit={handleCompleteStay} className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  Registrar Leituras de Saída
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Registre as leituras no momento do check-out
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monitoringExit" className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Monitoramento Solar (kWh) *
                  </Label>
                  <Input
                    id="monitoringExit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={monitoringExit}
                    onChange={(e) => setMonitoringExit(e.target.value)}
                    className="bg-muted/50 border-0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo03Exit" className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Código 03 - Consumo da Rede (kWh) *
                  </Label>
                  <Input
                    id="codigo03Exit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={codigo03Exit}
                    onChange={(e) => setCodigo03Exit(e.target.value)}
                    className="bg-muted/50 border-0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo103Exit" className="flex items-center gap-2">
                    <Sun className="h-3 w-3" />
                    Código 103 - Injeção na Rede (kWh) *
                  </Label>
                  <Input
                    id="codigo103Exit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={codigo103Exit}
                    onChange={(e) => setCodigo103Exit(e.target.value)}
                    className="bg-muted/50 border-0"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-12 gradient-solar hover:opacity-90"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Calcular e Finalizar"
              )}
            </Button>
          </form>
        )}
        {/* Results */}
        {isCompleted && (
          <div className="space-y-6">
            {/* Results Card */}
            <Card className="shadow-solar border-0 overflow-hidden">
              <div className="h-1 gradient-solar" />
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-lg font-semibold text-center">
                  Resumo do Consumo
                </CardTitle>
                <p className="text-sm text-muted-foreground text-center">
                  {format(parseISO(stay.check_in_date), "dd/MM", { locale: ptBR })} → {stay.check_out_date && format(parseISO(stay.check_out_date), "dd/MM", { locale: ptBR })}
                  {stay.check_out_date && ` (${differenceInDays(parseISO(stay.check_out_date), parseISO(stay.check_in_date))} dias)`}
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Amount */}
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-1">Valor a cobrar</p>
                  <p className="text-4xl font-bold text-gradient-solar">
                    R$ {(stay.amount_to_charge || 0).toFixed(2)}
                  </p>
                </div>

                {/* Details */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Geração solar
                    </span>
                    <span className="font-medium">{(stay.solar_generation || 0).toFixed(1)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Injetado na rede
                    </span>
                    <span className="font-medium">{(stay.grid_injection || 0).toFixed(1)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Autoconsumo solar
                    </span>
                    <span className="font-medium">{(stay.self_consumption || 0).toFixed(1)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Consumo da rede
                    </span>
                    <span className="font-medium">{(stay.grid_consumption || 0).toFixed(1)} kWh</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center font-semibold">
                    <span>Consumo total</span>
                    <span>{(stay.total_consumption || 0).toFixed(1)} kWh</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="h-12"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copiar
                  </Button>
                  <Button
                    onClick={handleWhatsApp}
                    className="h-12 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card className="shadow-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paid Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paid-toggle" className="font-medium">Marcar como pago</Label>
                    <p className="text-xs text-muted-foreground">
                      Confirme quando o pagamento for recebido
                    </p>
                  </div>
                  <Switch
                    id="paid-toggle"
                    checked={stay.is_paid}
                    onCheckedChange={handleTogglePaid}
                  />
                </div>

                {/* Upload Proof */}
                <div className="space-y-2">
                  <Label>Comprovante de pagamento</Label>
                  {stay.payment_proof_url ? (
                    <div className="flex items-center gap-2">
                      <a 
                        href={stay.payment_proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-accent underline"
                      >
                        Ver comprovante
                      </a>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleUploadProof}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Anexar comprovante
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
