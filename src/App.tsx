// src/App.tsx - Version avec gestion du mode démo
import { useState, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import { AppToolbar, AppToolbarProvider, AppToolbarTitle, AppToolbarMenu } from "@/components/organisms/app-toolbar";
import { PageLayout } from "@/components/layouts/PageLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { menuItems } from "@/lib/constants/menu";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useLicense } from "@/hooks/use-license";
import { LicenseForm } from "@/components/organisms/license-form/LicenseForm";
import { Spinner } from "@/components/ui/LoadingSpinner";
import { NotificationProvider } from "./components/ui/notification-system";
import { useAutoBackup } from "@/hooks/useAutoBackup";

// Contexte pour la gestion d'état globale
import { createContext, useContext } from "react";

interface AppContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshData: () => void;
  isDemoMode: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

// Composant principal de l'application avec gestion du mode démo
const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Gestion des licences et mode démo
  const {
    isLicensed,
    isDemoMode,
    isLoading: licenseLoading,
    error: licenseError,
    licenseKey,
    setLicenseKey,
    activateLicense,
    enterDemoMode
  } = useLicense();
  
  const [currentPath, setCurrentPath] = useLocalStorage<string>("current_path", (isDemoMode ? "settings" : "receipts"));

  // Activer les sauvegardes automatiques
  useAutoBackup();

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

    // N'initialiser l'app que si la licence est validée OU en mode démo
    if ((isLicensed || isDemoMode) && !isInitialized) {
      initializeApp();
    }
  }, [isLicensed, isDemoMode, isInitialized]);

  const refreshData = () => {
    setIsLoading(true);
    // Logique de rafraîchissement des données
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Filtrer les éléments de menu selon le mode
  const getFilteredMenuItems = () => {
    if (isDemoMode) {
      // En mode démo, désactiver l'item "QR Codes sur PDF"
      return menuItems.filter(item => item.url !== "qrcode");
    }
    return menuItems;
  };

  const filteredMenuItems = getFilteredMenuItems();

  // Trouve le composant et le titre pour la route actuelle
  const currentMenuItem = filteredMenuItems.find(item => item.url === currentPath);
  const currentComponent = currentMenuItem?.component || <div>Page non trouvée</div>;
  const currentTitle = currentMenuItem?.title || "Page inconnue";

  // Affichage du chargement initial des licences
  if (licenseLoading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner.Large label="Vérification de la licence" />
          <h2 className="text-xl font-semibold text-gray-800">
            Vérification de la licence...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions votre licence.
          </p>
        </div>
      </div>
    );
  }

  // Affichage du formulaire de licence si non licencié ET pas en mode démo
  if (!isLicensed && !isDemoMode) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LicenseForm
          licenseKey={licenseKey}
          onLicenseKeyChange={setLicenseKey}
          onActivate={activateLicense}
          onEnterDemo={enterDemoMode}
          error={licenseError}
          isLoading={licenseLoading}
          expectedFormat="XXXX-XXXX-XXXX-XXXX"
          licenseExample="ABCD-1234-EFGH-5678"
        />
      </div>
    );
  }

  // Écran de chargement initial de l'application
  if (!isInitialized) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
          {isDemoMode && (
            <div className="mt-4">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Mode Démo
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interface principale de l'application
  return (
    <AppContext.Provider value={{ isLoading, setIsLoading, refreshData, isDemoMode }}>
      <NotificationProvider>
        <AppToolbarProvider>
          <SidebarProvider defaultOpen>
            <div className="flex w-screen h-screen bg-background overflow-auto">
              {/* Bannière mode démo */}
              {isDemoMode && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-1 text-sm font-medium">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  MODE DÉMO - Fonctionnalités limitées - Les documents auront un filigrane "DÉMO"
                </div>
              )}
              
              <AppSidebar />
              
              <SidebarInset className="flex-1 flex flex-col" style={{ marginTop: isDemoMode ? '32px' : '0' }}>
                <AppToolbar />
                
                <main className="flex-1 overflow-auto">
                  {/* Titre et menu de la page courante */}
                  <AppToolbarTitle>
                    <div className="flex items-center gap-2">
                      {currentMenuItem?.icon && (
                        <currentMenuItem.icon className="h-5 w-5" />
                      )}
                      {currentTitle}
                      {isDemoMode && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          DÉMO
                        </Badge>
                      )}
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
                  <div className="relative flex-1 h-full">
                    <AnimatePresence mode="wait">
                      <PageLayout key={currentPath} locationKey={currentPath}>
                        <div className="h-full overflow-auto p-4">
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
      </NotificationProvider>
    </AppContext.Provider>
  );
};

// Composant App principal avec ErrorBoundary
function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;