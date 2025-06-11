// src/components/pages/SettingsPage.tsx - Version mise à jour avec gestion du mode démo
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  User, 
  Shield, 
  AlertTriangle, 
  Key,
  Building,
  Palette
} from 'lucide-react';
import { DemoModeManager } from '@/components/organisms/demo-mode-manager/DemoModeManager';

// Import des autres composants de paramètres (à adapter selon votre structure)
// import { UserSettings } from '@/components/organisms/user-settings/UserSettings';
// import { SecuritySettings } from '@/components/organisms/security-settings/SecuritySettings';
// import { AppearanceSettings } from '@/components/organisms/appearance-settings/AppearanceSettings';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Détection du mode démo
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Configuration des onglets selon le mode
  const tabs = [
    {
      id: 'general',
      label: 'Général',
      icon: Settings,
      available: true
    },
    {
      id: 'institution',
      label: 'Institution',
      icon: Building,
      available: true
    },
    {
      id: 'appearance',
      label: 'Apparence',
      icon: Palette,
      available: true
    },
    {
      id: 'license',
      label: isDemoMode ? 'Mode Démo' : 'Licence',
      icon: isDemoMode ? AlertTriangle : Shield,
      available: true,
      highlight: isDemoMode
    },
    {
      id: 'security',
      label: 'Sécurité',
      icon: Shield,
      available: !isDemoMode // Désactivé en mode démo
    }
  ].filter(tab => tab.available);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">
            Configuration de l'application et préférences utilisateur
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              MODE DÉMO
            </Badge>
          )}
          {isDevelopment && (
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              DEV
            </Badge>
          )}
        </div>
      </div>

      {/* Alerte mode démo */}
      {isDemoMode && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            Certains paramètres sont limités en mode démo. 
            <span className="font-medium"> Activez une licence</span> pour accéder à toutes les fonctionnalités.
          </AlertDescription>
        </Alert>
      )}

      {/* Interface des paramètres */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className={`relative ${tab.highlight ? 'bg-orange-100 data-[state=active]:bg-orange-200' : ''}`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
              {tab.highlight && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Langue de l'interface
                    </label>
                    <select 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isDemoMode}
                    >
                      <option>Français</option>
                      <option>English</option>
                    </select>
                    {isDemoMode && (
                      <p className="text-xs text-orange-600 mt-1">
                        Limité en mode démo
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Fuseau horaire
                    </label>
                    <select 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isDemoMode}
                    >
                      <option>Africa/Douala</option>
                      <option>UTC</option>
                    </select>
                    {isDemoMode && (
                      <p className="text-xs text-orange-600 mt-1">
                        Limité en mode démo
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="institution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations de l'institution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configuration des informations de votre établissement qui apparaîtront sur les documents.
                </p>
                {isDemoMode && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-orange-800">
                      Les modifications sont limitées en mode démo et n'affecteront pas les documents générés.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nom de l'établissement (FR)
                    </label>
                    <input 
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Université de..."
                      disabled={isDemoMode}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nom de l'établissement (EN)
                    </label>
                    <input 
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="University of..."
                      disabled={isDemoMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Thème de l'interface
                    </label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>Clair</option>
                      <option>Sombre</option>
                      <option>Automatique</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Densité d'affichage
                    </label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>Normale</option>
                      <option>Compacte</option>
                      <option>Spacieuse</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Licence/Mode Démo */}
        <TabsContent value="license" className="space-y-4">
          {isDemoMode ? (
            <DemoModeManager />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gestion de la licence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-green-800">
                      Licence activée et valide pour l'année {new Date().getFullYear()}.
                      Toutes les fonctionnalités sont disponibles.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Informations de licence
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>Statut: <span className="text-green-600 font-medium">Active</span></li>
                        <li>Année: <span className="font-medium">{new Date().getFullYear()}</span></li>
                        <li>Type: <span className="font-medium">Licence complète</span></li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Fonctionnalités disponibles
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✅ Documents officiels</li>
                        <li>✅ QR Codes sécurisés</li>
                        <li>✅ Chiffrement avancé</li>
                        <li>✅ Support technique</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Sécurité (uniquement si pas en mode démo) */}
        {!isDemoMode && (
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Paramètres de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Chiffrement des documents
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm text-gray-700">
                          Activer le chiffrement compact des QR codes
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm text-gray-700">
                          Forcer la vérification des signatures
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Sauvegarde et archivage
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        <span className="text-sm text-gray-700">
                          Archiver automatiquement les documents générés
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-sm text-gray-700">
                          Créer des sauvegardes de sécurité
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};