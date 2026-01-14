import soloLogo from "@/assets/solo-logo.png";
import { EnergyCalculator } from "@/components/EnergyCalculator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-4">
          <img 
            src={soloLogo} 
            alt="Solo Energia" 
            className="h-8 object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Cálculo de Energia
            </h1>
            <p className="text-muted-foreground">
              Casa de temporada com energia solar
            </p>
          </div>

          {/* Calculator */}
          <EnergyCalculator />
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-3 text-center">
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
