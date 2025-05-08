import React from "react";
import "./App.css";
import { AppSidebar } from "./components/organisms/app-sidebar";
import { AppToolbar, AppToolbarProvider } from "./components/organisms/app-toolbar";
import { SidebarProvider } from "./components/ui/sidebar";
import { menuItems } from "./lib/constants/menu";
import { useReadLocalStorage } from "usehooks-ts";
import { PageLayout } from "./components/layouts/PageLayout";
import { useLicense } from "./hooks/use-license";
import { LicenseForm } from "./components/organisms/license-form/LicenseForm";
import { Spinner } from "./components/ui/LoadingSpinner";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";

const AppContent: React.FC = () => {
  const path = useReadLocalStorage<string>("current_path");
  const {
    isLicensed,
    isLoading,
    error,
    licenseKey,
    setLicenseKey,
    activateLicense
  } = useLicense();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Spinner.Large label="Chargement de l'application" />
      </div>
    );
  }

  if (!isLicensed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LicenseForm
          licenseKey={licenseKey}
          onLicenseKeyChange={setLicenseKey}
          onActivate={activateLicense}
          error={error}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <AppToolbarProvider>
        <main className="px-3 w-full">
          <AppToolbar />
          <div className="mt-4">
            {menuItems.find((m) => m.url === path)?.component}
          </div>
        </main>
      </AppToolbarProvider>
    </SidebarProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <PageLayout>
        <AppContent />
      </PageLayout>
    </ErrorBoundary>
  );
};

export default App;
