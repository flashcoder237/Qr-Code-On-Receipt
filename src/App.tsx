import { useState } from "react";
import { authenticate } from "./lib/licence/google-auth";
import { fetchLicenses, updateLicense } from "./lib/licence/drive-utils";
import { useReadLocalStorage } from "usehooks-ts";
import "./App.css";
import { AppSidebar } from "./components/organisms/app-sidebar";
import { AppToolbar, AppToolbarProvider } from "./components/organisms/app-toolbar";
import { SidebarProvider } from "./components/ui/sidebar";
import { menuItems } from "./lib/constants/menu";
import { OAuth2Client } from "google-auth-library";

const App = () => {
  const path = useReadLocalStorage<string>("current_path");
  const [licenseKey, setLicenseKey] = useState("");
  const [isLicensed, setIsLicensed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleActivateLicense = async () => {
    try {
      // Assurez-vous que 'authenticate' renvoie un OAuth2Client
      const auth: OAuth2Client = await authenticate();
      const licenses = await fetchLicenses(auth);

      if (licenses[licenseKey]?.status === "unused") {
        const success = await updateLicense(auth, licenseKey);
        if (success) {
          setIsLicensed(true);
          alert("Licence activée avec succès !");
        } else {
          setErrorMessage("Erreur lors de l'activation de la licence.");
        }
      } else {
        setErrorMessage("Licence invalide ou déjà utilisée.");
      }
    } catch (error) {
      console.error("Erreur :", error);
      setErrorMessage("Une erreur est survenue.");
    }
  };

  if (!isLicensed) {
    return (
      <div>
        <h2>Entrez votre clé de licence :</h2>
        <input
          type="text"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          placeholder="Clé de licence"
        />
        <button onClick={handleActivateLicense}>Activer</button>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <AppToolbarProvider>
        <main className="px-3 w-full">
          <AppToolbar />
          <div>{menuItems.find((m) => m.url === path)?.component}</div>
        </main>
      </AppToolbarProvider>
    </SidebarProvider>
  );
};

export default App;
