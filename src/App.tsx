// app.tsx
import React, { useState, useEffect } from "react";
import { fetchLicenses, updateAndDecrementLicense } from "./lib/licence/drive-utils";
import LicenseDB from "./lib/licence/database";
import "./App.css";
import { AppSidebar } from "./components/organisms/app-sidebar";
import { AppToolbar, AppToolbarProvider } from "./components/organisms/app-toolbar";
import { SidebarProvider } from "./components/ui/sidebar";
import { menuItems } from "./lib/constants/menu";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useReadLocalStorage } from "usehooks-ts";
import { PageLayout } from "./components/layouts/PageLayout";

// Typage des licences
interface Licenses {
  [key: string]: {
    status: "unused" | "used";
  };
}

const App: React.FC = () => {
  const path = useReadLocalStorage<string>("current_path");
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkStoredLicense = async () => {
      setIsLoading(true);
      try {
        const storedLicense = await LicenseDB.get();
        if (storedLicense) { 
            setIsLicensed(true);
            setLicenseKey(storedLicense);     }     
          //  else {
          //   
          // }
        }
      catch (error) {
        console.error("Erreur vérification licence:", error);
      }
      setIsLoading(false);
    };
  
    checkStoredLicense();
  }, []);
  
  const handleActivateLicense = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const licenses = await fetchLicenses();
  
      if (licenses[licenseKey]?.status === "unused") {
        const success = await updateAndDecrementLicense(licenseKey);
  
        if (success) {
          await LicenseDB.save(licenseKey); // Sauvegarde locale de la licence
          setIsLicensed(true);
          alert("Licence activée avec succès !");
        } else {
          setErrorMessage("Erreur lors de l'activation ou licence déjà utilisée.");
        }
      } else {
        setErrorMessage("Licence invalide ou déjà utilisée.");
      }
    } catch (error) {
      console.error("Erreur activation:", error);
      setErrorMessage("Une erreur est survenue lors de l'activation.");
    }
    setIsLoading(false);
  };
  
  

  return (
    <PageLayout>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <p className="text-lg font-semibold text-gray-600">Chargement...</p>
        </div>
      ) : !isLicensed ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
            <div className="w-20 mx-auto mb-4">
              <img src="./logo.png" alt="Logo" className="w-full" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Entrez votre clé de licence :
            </h2>
            <Input
              className="w-full px-4 py-2 border rounded-lg text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Clé de licence"
            />
            <Button
              onClick={handleActivateLicense}
              className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Activer la licence
            </Button>
            <p className="italic text-xs text-gray-400">
              Pour l'activation du logiciel, veuillez à ce que votre ordinateur
              soit connecté à Internet.
            </p>
            {errorMessage && (
              <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
            )}
          </div>
        </div>
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <AppToolbarProvider>
            <main className="px-3 w-full">
              <AppToolbar />
              <div>{menuItems.find((m) => m.url === path)?.component}</div>
            </main>
          </AppToolbarProvider>
        </SidebarProvider>
      )}
    </PageLayout>
  );
};

export default App;
