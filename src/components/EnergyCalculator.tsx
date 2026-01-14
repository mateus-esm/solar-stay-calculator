import { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Zap, Sun, DollarSign, Copy, MessageCircle, Check, User, Phone, CreditCard, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface CalculationResult {
  diasEstadia: number;
  consumoRede: number;
  geracaoMonitoramento: number;
  injecaoRede: number;
  autoconsumo: number;
  consumoTotal: number;
  valorCobrar: number;
  dataEntrada: string;
  dataSaida: string;
  tarifa: number;
  nomeCliente: string;
  telefoneCliente: string;
  chavePix: string;
}

export function EnergyCalculator() {
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [codigo03Entrada, setCodigo03Entrada] = useState("");
  const [codigo03Saida, setCodigo03Saida] = useState("");
  const [codigo103Entrada, setCodigo103Entrada] = useState("");
  const [codigo103Saida, setCodigo103Saida] = useState("");
  const [geracaoMonitoramentoEntrada, setGeracaoMonitoramentoEntrada] = useState("");
  const [geracaoMonitoramentoSaida, setGeracaoMonitoramentoSaida] = useState("");
  const [tarifa, setTarifa] = useState("1.10");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCalculate = () => {
    if (!dataEntrada || !dataSaida || !codigo03Entrada || !codigo03Saida || 
        !codigo103Entrada || !codigo103Saida || !geracaoMonitoramentoEntrada || 
        !geracaoMonitoramentoSaida || !tarifa || !nomeCliente || !telefoneCliente) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const entrada = parseISO(dataEntrada);
    const saida = parseISO(dataSaida);
    const diasEstadia = differenceInDays(saida, entrada);

    if (diasEstadia <= 0) {
      toast.error("A data de saída deve ser posterior à data de entrada");
      return;
    }

    // Consumo da rede (código 03)
    const consumoRede = parseFloat(codigo03Saida) - parseFloat(codigo03Entrada);
    
    // Injeção na rede (código 103)
    const injecaoRede = parseFloat(codigo103Saida) - parseFloat(codigo103Entrada);
    
    // Geração do monitoramento (quanto realmente gerou)
    const geracaoMonitoramento = parseFloat(geracaoMonitoramentoSaida) - parseFloat(geracaoMonitoramentoEntrada);
    
    // Autoconsumo = Geração - Injeção (quanto gerou e usou na casa)
    const autoconsumo = geracaoMonitoramento - injecaoRede;
    
    // Consumo total = Autoconsumo + Consumo da rede
    const consumoTotal = autoconsumo + consumoRede;
    
    const tarifaNum = parseFloat(tarifa.replace(",", "."));
    const valorCobrar = consumoTotal * tarifaNum;

    if (consumoRede < 0 || injecaoRede < 0 || geracaoMonitoramento < 0) {
      toast.error("As leituras de saída devem ser maiores que as de entrada");
      return;
    }

    if (autoconsumo < 0) {
      toast.error("A geração do monitoramento deve ser maior que a injeção na rede");
      return;
    }

    setResult({
      diasEstadia,
      consumoRede,
      geracaoMonitoramento,
      injecaoRede,
      autoconsumo,
      consumoTotal,
      valorCobrar,
      dataEntrada: format(entrada, "dd/MM/yyyy", { locale: ptBR }),
      dataSaida: format(saida, "dd/MM/yyyy", { locale: ptBR }),
      tarifa: tarifaNum,
      nomeCliente,
      telefoneCliente,
      chavePix,
    });
  };

  const generateMessage = () => {
    if (!result) return "";
    
    let message = `⚡ *Olá ${result.nomeCliente}!*

Segue o resumo do consumo de energia da sua estadia:

📅 *Período:* ${result.dataEntrada} a ${result.dataSaida}
📆 *Dias:* ${result.diasEstadia} dias

☀️ Geração solar: ${result.geracaoMonitoramento.toFixed(1)} kWh
🔄 Injetado na rede: ${result.injecaoRede.toFixed(1)} kWh
🏠 Autoconsumo solar: ${result.autoconsumo.toFixed(1)} kWh
⚡ Consumo da rede: ${result.consumoRede.toFixed(1)} kWh

📊 *Consumo total: ${result.consumoTotal.toFixed(1)} kWh*

💰 Tarifa: R$ ${result.tarifa.toFixed(2)}/kWh
💵 *Valor da energia: R$ ${result.valorCobrar.toFixed(2)}*`;

    if (result.chavePix) {
      message += `

💳 *Chave PIX para pagamento:*
${result.chavePix}`;
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
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!result) return;
    
    // Formata o telefone removendo caracteres não numéricos
    const telefone = result.telefoneCliente.replace(/\D/g, "");
    const telefoneFormatado = telefone.startsWith("55") ? telefone : `55${telefone}`;
    
    const message = encodeURIComponent(generateMessage());
    window.open(`https://wa.me/${telefoneFormatado}?text=${message}`, "_blank");
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {!result ? (
        <>
          {/* Dados do Cliente */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-solo-orange" />
                Dados do Hóspede
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCliente" className="text-sm text-muted-foreground">
                  Nome do cliente *
                </Label>
                <Input
                  id="nomeCliente"
                  type="text"
                  placeholder="João Silva"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  className="bg-muted/50 border-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefoneCliente" className="text-sm text-muted-foreground">
                  WhatsApp do cliente *
                </Label>
                <Input
                  id="telefoneCliente"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefoneCliente}
                  onChange={(e) => setTelefoneCliente(e.target.value)}
                  className="bg-muted/50 border-0"
                />
              </div>
            </CardContent>
          </Card>

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

          {/* Geração do Monitoramento */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-solo-yellow" />
                Geração do Monitoramento
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Quanto o sistema solar realmente gerou (app do inversor)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="geracaoMonitoramentoEntrada" className="text-sm text-muted-foreground">
                    Leitura entrada (kWh)
                  </Label>
                  <Input
                    id="geracaoMonitoramentoEntrada"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={geracaoMonitoramentoEntrada}
                    onChange={(e) => setGeracaoMonitoramentoEntrada(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geracaoMonitoramentoSaida" className="text-sm text-muted-foreground">
                    Leitura saída (kWh)
                  </Label>
                  <Input
                    id="geracaoMonitoramentoSaida"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={geracaoMonitoramentoSaida}
                    onChange={(e) => setGeracaoMonitoramentoSaida(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Injeção na Rede (Código 103) */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sun className="h-4 w-4 text-solo-yellow" />
                Injeção na Rede (Código 103)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Energia enviada para a rede (leitura do medidor Enel)
              </p>
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

          {/* Leituras Enel */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-solo-orange" />
                Consumo da Rede (Código 03)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Energia consumida da distribuidora (leitura do medidor Enel)
              </p>
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

          {/* Tarifa e PIX */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-solo-orange" />
                Tarifa e Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tarifa" className="text-sm text-muted-foreground">
                  Valor por kWh (R$) *
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
              <div className="space-y-2">
                <Label htmlFor="chavePix" className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-3 w-3" />
                  Chave PIX (opcional)
                </Label>
                <Input
                  id="chavePix"
                  type="text"
                  placeholder="email@exemplo.com ou CPF"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  className="bg-muted/50 border-0"
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
                Resumo para {result.nomeCliente}
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
                    <Activity className="h-4 w-4" />
                    Geração solar
                  </span>
                  <span className="font-medium">{result.geracaoMonitoramento.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Injetado na rede
                  </span>
                  <span className="font-medium">{result.injecaoRede.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    🏠 Autoconsumo solar
                  </span>
                  <span className="font-medium">{result.autoconsumo.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Consumo da rede
                  </span>
                  <span className="font-medium">{result.consumoRede.toFixed(1)} kWh</span>
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
                {result.chavePix && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Chave PIX
                      </span>
                      <span className="font-medium text-right max-w-[180px] truncate">{result.chavePix}</span>
                    </div>
                  </>
                )}
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
                  Enviar WhatsApp
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
