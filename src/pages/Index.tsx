import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import soloLogo from "@/assets/solo-logo.png";
import { Button } from "@/components/ui/button";
import { LogIn, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If user is logged in, redirect to dashboard
  if (!loading && user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={soloLogo} 
            alt="Solo Energia" 
            className="h-12 object-contain"
          />
          <Button 
            onClick={() => navigate("/auth")}
            variant="outline"
            size="sm"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full gradient-solar flex items-center justify-center shadow-solar">
            <Zap className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Gestão de Energia Solar para{" "}
            <span className="text-gradient-solar">Casas de Temporada</span>
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Controle o consumo de energia dos seus hóspedes, calcule valores automaticamente e 
            envie cobranças diretamente pelo WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => navigate("/auth")}
              className="gradient-solar hover:opacity-90 h-12 px-8 text-base"
            >
              Começar Agora
            </Button>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">📊</p>
              <p className="text-sm text-muted-foreground mt-1">Cálculo automático</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">💬</p>
              <p className="text-sm text-muted-foreground mt-1">WhatsApp integrado</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">💳</p>
              <p className="text-sm text-muted-foreground mt-1">PIX automático</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Desenvolvido por{" "}
            <span className="font-medium text-foreground">Solo Energia</span>
            {" "}— Você no controle da sua energia
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
