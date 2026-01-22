import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Home, LogOut, User, Settings, Zap } from "lucide-react";
import soloLogo from "@/assets/solo-logo.png";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  modules_count: number | null;
  modules_power: number | null;
  created_at: string;
}

interface Stay {
  id: string;
  status: string;
  amount_to_charge: number | null;
}

interface StayStats {
  property_id: string;
  total_stays: number;
  pending_stays: number;
  total_revenue: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Record<string, StayStats>>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties((propertiesData as Property[]) || []);

      // Fetch stats for each property
      if (propertiesData && propertiesData.length > 0) {
        const statsMap: Record<string, StayStats> = {};
        
        for (const property of propertiesData as Property[]) {
          const { data: staysData } = await supabase
            .from("stays")
            .select("id, status, amount_to_charge")
            .eq("property_id", property.id);

          const stays = (staysData as Stay[]) || [];
          statsMap[property.id] = {
            property_id: property.id,
            total_stays: stays.length,
            pending_stays: stays.filter(s => s.status !== "paid").length,
            total_revenue: stays
              .filter(s => s.status === "paid")
              .reduce((sum, s) => sum + (Number(s.amount_to_charge) || 0), 0),
          };
        }
        setStats(statsMap);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Erro ao carregar propriedades");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || loadingData) {
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
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={soloLogo} 
            alt="Solo Energia" 
            className="h-12 object-contain"
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Minhas Propriedades
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas casas de temporada com energia solar
          </p>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <Card className="shadow-card border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade</h3>
              <p className="text-muted-foreground text-center mb-6">
                Cadastre sua primeira casa de temporada para começar
              </p>
              <Button 
                onClick={() => navigate("/properties/new")}
                className="gradient-solar hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Propriedade
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => {
              const propStats = stats[property.id];
              return (
                <Link to={`/properties/${property.id}`} key={property.id}>
                  <Card className="shadow-card border-0 hover:shadow-card-hover transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Home className="h-5 w-5 text-accent" />
                            {property.name}
                          </CardTitle>
                          {(property.city || property.state) && (
                            <CardDescription>
                              {[property.city, property.state].filter(Boolean).join(", ")}
                            </CardDescription>
                          )}
                        </div>
                        {property.modules_count && property.modules_power && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Potência</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Zap className="h-4 w-4 text-accent" />
                              {((property.modules_count * property.modules_power) / 1000).toFixed(1)} kWp
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Estadias:</span>{" "}
                          <span className="font-medium">{propStats?.total_stays || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pendentes:</span>{" "}
                          <span className="font-medium text-accent">{propStats?.pending_stays || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Receita:</span>{" "}
                          <span className="font-medium">R$ {(propStats?.total_revenue || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            <Button 
              onClick={() => navigate("/properties/new")}
              variant="outline"
              className="w-full h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Propriedade
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
