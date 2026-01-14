import { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Zap, Sun, DollarSign, Copy, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface CalculationResult {
  diasEstadia: number;
  consumoRede: number;
  geracaoSolar: number;
  consumoTotal: number;
  valorCobrar: number;
  dataEntrada: string;
  dataSaida: string;
  tarifa: number;
}

export function EnergyCalculator() {
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [codigo03Entrada, setCodigo03Entrada] = useState("");
  const [codigo03Saida, setCodigo03Saida] = useState("");
  const [codigo103Entrada, setCodigo103Entrada] = useState("");
  const [codigo103Saida, setCodigo103Saida] = useState("");
  const [tarifa, setTarifa] = useState("1.10");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCalculate = () => {
    if (!dataEntrada || !dataSaida || !codigo03Entrada || !codigo03Saida || !codigo103Entrada || !codigo103Saida || !tarifa) {
      toast.error("Preencha todos os campos");
      return;
    }

    const entrada = parseISO(dataEntrada);
    const saida = parseISO(dataSaida);
    const diasEstadia = differenceInDays(saida, entrada);

    if (diasEstadia <= 0) {
      toast.error("A data de saída deve ser posterior à data de entrada");
      return;
    }

    const consumoRede = parseFloat(codigo03Saida) - parseFloat(codigo03Entrada);
    const geracaoSolar = parseFloat(codigo103Saida) - parseFloat(codigo103Entrada);
    const consumoTotal = consumoRede + geracaoSolar;
    const tarifaNum = parseFloat(tarifa.replace(",", "."));
    const valorCobrar = consumoTotal * tarifaNum;

    if (consumoRede < 0 || geracaoSolar < 0) {
      toast.error("As leituras de saída devem ser maiores que as de entrada");
      return;
    }

    setResult({
      diasEstadia,
      consumoRede,
      geracaoSolar,
      consumoTotal,
      valorCobrar,
      dataEntrada: format(entrada, "dd/MM/yyyy", { locale: ptBR }),
      dataSaida: format(saida, "dd/MM/yyyy", { locale: ptBR }),
      tarifa: tarifaNum,
    });
  };

  const generateMessage = () => {
    if (!result) return "";
    return `⚡ *Resumo de Energia - Estadia*

📅 Período: ${result.dataEntrada} a ${result.dataSaida}
📆 Dias: ${result.diasEstadia} dias

⚡ Consumo da rede: ${result.consumoRede.toFixed(1)} kWh
☀️ Geração solar: ${result.geracaoSolar.toFixed(1)} kWh
📊 *Consumo total: ${result.consumoTotal.toFixed(1)} kWh*

💰 Tarifa: R$ ${result.tarifa.toFixed(2)}/kWh
💵 *Valor da energia: R$ ${result.valorCobrar.toFixed(2)}*

_Calculado por Solo Energia_`;
  };

  const handleCopy = async () => {
    const message = generateMessage();
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(generateMessage());
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {!result ? (
        <>
          {/* Período da Estadia */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-solo-orange" />
                Período da Estadia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataEntrada" className="text-sm text-muted-foreground">
                    Entrada
                  </Label>
                  <Input
                    id="dataEntrada"
                    type="date"
                    value={dataEntrada}
                    onChange={(e) => setDataEntrada(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataSaida" className="text-sm text-muted-foreground">
                    Saída
                  </Label>
                  <Input
                    id="dataSaida"
                    type="date"
                    value={dataSaida}
                    onChange={(e) => setDataSaida(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leituras Enel */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-solo-orange" />
                Consumo da Rede (Código 03)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo03Entrada" className="text-sm text-muted-foreground">
                    Leitura entrada (kWh)
                  </Label>
                  <Input
                    id="codigo03Entrada"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={codigo03Entrada}
                    onChange={(e) => setCodigo03Entrada(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo03Saida" className="text-sm text-muted-foreground">
                    Leitura saída (kWh)
                  </Label>
                  <Input
                    id="codigo03Saida"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={codigo03Saida}
                    onChange={(e) => setCodigo03Saida(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leituras Solar */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sun className="h-4 w-4 text-solo-yellow" />
                Geração Solar (Código 103)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo103Entrada" className="text-sm text-muted-foreground">
                    Leitura entrada (kWh)
                  </Label>
                  <Input
                    id="codigo103Entrada"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={codigo103Entrada}
                    onChange={(e) => setCodigo103Entrada(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo103Saida" className="text-sm text-muted-foreground">
                    Leitura saída (kWh)
                  </Label>
                  <Input
                    id="codigo103Saida"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={codigo103Saida}
                    onChange={(e) => setCodigo103Saida(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarifa */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-solo-orange" />
                Tarifa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tarifa" className="text-sm text-muted-foreground">
                  Valor por kWh (R$)
                </Label>
                <Input
                  id="tarifa"
                  type="text"
                  placeholder="1.10"
                  value={tarifa}
                  onChange={(e) => setTarifa(e.target.value)}
                  className="bg-muted/50 border-0 max-w-[140px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão Calcular */}
          <Button
            onClick={handleCalculate}
            className="w-full h-12 text-base font-semibold gradient-solar hover:opacity-90 transition-opacity"
          >
            Calcular Consumo
          </Button>
        </>
      ) : (
        /* Resultado */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-solar border-0 overflow-hidden">
            <div className="h-1 gradient-solar" />
            <CardHeader className="pb-2 pt-6">
              <CardTitle className="text-lg font-semibold text-center">
                Resumo da Estadia
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                {result.dataEntrada} → {result.dataSaida} ({result.diasEstadia} dias)
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Valor Principal */}
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-1">Valor a cobrar</p>
                <p className="text-4xl font-bold text-gradient-solar">
                  R$ {result.valorCobrar.toFixed(2)}
                </p>
              </div>

              {/* Detalhamento */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Consumo da rede
                  </span>
                  <span className="font-medium">{result.consumoRede.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Geração solar
                  </span>
                  <span className="font-medium">{result.geracaoSolar.toFixed(1)} kWh</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Consumo total</span>
                  <span className="font-bold">{result.consumoTotal.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Tarifa aplicada</span>
                  <span>R$ {result.tarifa.toFixed(2)}/kWh</span>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="h-11 gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  className="h-11 gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>

              {/* Novo Cálculo */}
              <Button
                variant="ghost"
                onClick={handleReset}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Novo cálculo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
