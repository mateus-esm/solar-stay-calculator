import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Calendar, User, DollarSign, Check, Clock, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  tariff: number;
  owner_id: string;
}

interface Stay {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string | null;
  status: string;
  amount_to_charge: number | null;
  is_paid: boolean;
  total_consumption: number | null;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchPropertyAndStays();
    }
  }, [user, id]);

  const fetchPropertyAndStays = async () => {
    try {
      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData as Property);

      // Fetch stays
      const { data: staysData, error: staysError } = await supabase
        .from("stays")
        .select("*")
        .eq("property_id", id)
        .order("check_in_date", { ascending: false });

      if (staysError) throw staysError;
      setStays((staysData as Stay[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
      navigate("/dashboard");
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadge = (stay: Stay) => {
    if (stay.is_paid || stay.status === "paid") {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>;
    }
    if (stay.status === "completed") {
      return <Badge className="bg-accent/10 text-accent border-accent/20">Pendente</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Em andamento</Badge>;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!property) return null;

  const totalRevenue = stays
    .filter(s => s.is_paid || s.status === "paid")
    .reduce((sum, s) => sum + (Number(s.amount_to_charge) || 0), 0);

  const pendingAmount = stays
    .filter(s => !s.is_paid && s.status === "completed")
    .reduce((sum, s) => sum + (Number(s.amount_to_charge) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{property.name}</h1>
            {(property.city || property.state) && (
              <p className="text-sm text-muted-foreground">
                {[property.city, property.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/properties/${id}/settings`)}>
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="shadow-card border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Estadias</p>
              <p className="text-2xl font-bold">{stays.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Receita</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totalRevenue.toFixed(0)}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pendente</p>
              <p className="text-2xl font-bold text-accent">
                R$ {pendingAmount.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stays List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Histórico de Estadias</h2>
          <Button 
            onClick={() => navigate(`/properties/${id}/stays/new`)}
            className="gradient-solar hover:opacity-90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Estadia
          </Button>
        </div>

        {stays.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma estadia</h3>
              <p className="text-muted-foreground text-center mb-6">
                Registre a primeira estadia desta propriedade
              </p>
              <Button 
                onClick={() => navigate(`/properties/${id}/stays/new`)}
                className="gradient-solar hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Estadia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {stays.map((stay) => (
              <Link to={`/stays/${stay.id}`} key={stay.id}>
                <Card className="shadow-card border-0 hover:shadow-card-hover transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">{stay.guest_name}</span>
                          {getStatusBadge(stay)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(parseISO(stay.check_in_date), "dd/MM/yy", { locale: ptBR })}
                            {stay.check_out_date && (
                              <> → {format(parseISO(stay.check_out_date), "dd/MM/yy", { locale: ptBR })}</>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {stay.amount_to_charge ? (
                          <>
                            <p className="font-semibold">R$ {Number(stay.amount_to_charge).toFixed(2)}</p>
                            {stay.total_consumption && (
                              <p className="text-xs text-muted-foreground">
                                {Number(stay.total_consumption).toFixed(1)} kWh
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aguardando saída</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
