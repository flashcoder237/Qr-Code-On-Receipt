// src/App.tsx - Version améliorée avec le nouveau layout
import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import { AppToolbar, AppToolbarProvider, AppToolbarTitle, AppToolbarMenu } from "@/components/organisms/app-toolbar";
import { PageLayout } from "@/components/layouts/PageLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { menuItems } from "@/lib/constants/menu";
import { Loader2, RefreshCw } from "lucide-react";

// Contexte pour la gestion d'état globale
import { createContext, useContext } from "react";

interface AppContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

function App() {
  const [currentPath, setCurrentPath] = useLocalStorage<string>("current_path", "receipts");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation de l'application
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Simule l'initialisation (vérification des données, etc.)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const refreshData = () => {
    setIsLoading(true);
    // Logique de rafraîchissement des données
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Trouve le composant et le titre pour la route actuelle
  const currentMenuItem = menuItems.find(item => item.url === currentPath);
  const currentComponent = currentMenuItem?.component || <div>Page non trouvée</div>;
  const currentTitle = currentMenuItem?.title || "Page inconnue";

  // Écran de chargement initial
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto"
          >
            <Loader2 className="w-16 h-16 text-blue-600" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-800">
            Chargement de l'application...
          </h2>
          <p className="text-gray-600">
            Initialisation en cours, veuillez patienter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppContext.Provider value={{ isLoading, setIsLoading, refreshData }}>
        <AppToolbarProvider>
          <SidebarProvider defaultOpen>
            <div className="flex min-h-screen bg-background">
              <AppSidebar />
              
              <SidebarInset className="flex-1">
                <AppToolbar />
                
                <main className="flex-1 overflow-hidden">
                  {/* Titre et menu de la page courante */}
                  <AppToolbarTitle>
                    <div className="flex items-center gap-2">
                      {currentMenuItem?.icon && (
                        <currentMenuItem.icon className="h-5 w-5" />
                      )}
                      {currentTitle}
                      {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                    </div>
                  </AppToolbarTitle>
                  
                  <AppToolbarMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshData}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </AppToolbarMenu>

                  {/* Contenu principal avec animation */}
                  <div className="relative h-full">
                    <AnimatePresence mode="wait">
                      <PageLayout key={currentPath} locationKey={currentPath}>
                        <div className="h-full overflow-auto">
                          {currentComponent}
                        </div>
                      </PageLayout>
                    </AnimatePresence>
                    
                    {/* Overlay de chargement */}
                    <AnimatePresence>
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50"
                        >
                          <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Chargement en cours...
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </AppToolbarProvider>
      </AppContext.Provider>
    </ErrorBoundary>
  );
}

export default App;