import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home, MapPin, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PropertyNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [tariff, setTariff] = useState("0.75");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Nome da propriedade é obrigatório");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.from("properties").insert({
      owner_id: user.id,
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      tariff: parseFloat(tariff.replace(",", ".")) || 0.75,
    } as any);

    if (error) {
      console.error("Error creating property:", error);
      toast.error("Erro ao criar propriedade");
    } else {
      toast.success("Propriedade criada com sucesso!");
      navigate("/dashboard");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Nova Propriedade</h1>
        </div>
      </header>

      {/* Form */}
      <main className="container max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Home className="h-4 w-4 text-accent" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da propriedade *</Label>
                <Input
                  id="name"
                  placeholder="Casa da Praia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua das Flores, 123"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-muted/50 border-0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Ubatuba"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-muted/50 border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="bg-muted/50 border-0"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tariff */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                Configuração de Tarifa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tariff">Valor por kWh (R$)</Label>
                <Input
                  id="tariff"
                  placeholder="0.75"
                  value={tariff}
                  onChange={(e) => setTariff(e.target.value)}
                  className="bg-muted/50 border-0 max-w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Valor que será cobrado por kWh consumido
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 gradient-solar hover:opacity-90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Criar Propriedade"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
