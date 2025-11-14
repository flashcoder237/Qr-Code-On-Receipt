// src/components/organisms/help-support/HelpSupport.tsx - Version avec LicenseReset
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Phone, 
  ExternalLink,
  Settings,
  Key,
  Info,
  AlertTriangle,
  Shield,
  Download,
  FileText,
  Zap
} from 'lucide-react';

// Import du composant LicenseReset
import { LicenseReset } from '@/components/dev/LicenseReset';

export const HelpSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState('guide');
  
  // Détecter l'environnement de développement
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  const quickLinks = [
    {
      title: "Guide de démarrage rapide",
      description: "Comment configurer et utiliser l'application",
      icon: BookOpen,
      action: () => setActiveTab('guide')
    },
    {
      title: "Questions fréquentes",
      description: "Réponses aux questions les plus courantes",
      icon: HelpCircle,
      action: () => setActiveTab('faq')
    },
    {
      title: "Contactez le support",
      description: "Obtenez de l'aide personnalisée",
      icon: MessageCircle,
      action: () => setActiveTab('contact')
    }
  ];

  const faqItems = [
    {
      question: "Comment configurer mon premier relevé de notes ?",
      answer: "Allez dans 'Configurer les relevés', créez une nouvelle configuration académique avec vos UE et EC, puis dans 'Générer les relevés', importez votre fichier Excel et mappez les colonnes."
    },
    {
      question: "Pourquoi mes documents ont un filigrane 'DÉMO' ?",
      answer: "Vous êtes en mode démo. Pour des documents officiels, vous devez activer une licence valide."
    },
    {
      question: "Comment activer le chiffrement des QR codes ?",
      answer: "Dans les pages de génération, activez l'option 'Chiffrement compact'. Les QR codes seront alors sécurisés avec un chiffrement basé sur le matricule."
    },
    {
      question: "Que faire si l'import Excel échoue ?",
      answer: "Vérifiez que votre fichier contient les colonnes requises (NOM, PRENOM, MATRICULE, etc.) et que les données sont bien formatées."
    },
    {
      question: "Comment personnaliser l'apparence des documents ?",
      answer: "Utilisez les onglets 'Thème' et 'Préréglages' dans les générateurs pour personnaliser couleurs, polices, mise en page et logos."
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aide & Support</h1>
          <p className="text-gray-600 mt-1">
            Documentation et assistance pour le générateur de documents académiques
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
              <Settings className="h-3 w-3 mr-1" />
              DEV
            </Badge>
          )}
        </div>
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={link.action}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <link.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{link.title}</h3>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          {isDevelopment && (
            <TabsTrigger value="dev">
              <Settings className="h-4 w-4 mr-1" />
              Dev Tools
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Guide de démarrage rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Configuration initiale</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <h4 className="font-medium">Configurer les entêtes</h4>
                        <p className="text-sm text-gray-600">Définissez les informations de votre établissement, logos et contacts.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium">Configurer les relevés</h4>
                        <p className="text-sm text-gray-600">Créez vos configurations académiques avec UE et EC.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium">Préparer vos données</h4>
                        <p className="text-sm text-gray-600">Formatez votre fichier Excel avec les colonnes requises.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Génération de documents</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                      <div>
                        <h4 className="font-medium">Importer les données</h4>
                        <p className="text-sm text-gray-600">Chargez votre fichier Excel et vérifiez la correspondance des colonnes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                      <div>
                        <h4 className="font-medium">Personnaliser l'apparence</h4>
                        <p className="text-sm text-gray-600">Utilisez les thèmes et préréglages pour personnaliser vos documents.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                      <div>
                        <h4 className="font-medium">Générer et télécharger</h4>
                        <p className="text-sm text-gray-600">Prévisualisez puis générez vos documents PDF.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Fonctionnalités avancées</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Chiffrement compact</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Sécurisez vos QR codes avec un chiffrement basé sur le matricule pour des documents plus petits et plus sûrs.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Validation automatique</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      Seuls les étudiants avec une moyenne ≥ 10/20 peuvent recevoir des attestations de réussite.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Questions fréquemment posées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-sm text-gray-600">{item.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Support technique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">cedrictefoye@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-gray-600">+237 652 761 931</p>
                  </div>
                </div>
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Ressources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Manuel utilisateur (PDF)
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Modèle Excel exemple
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Guide de démarrage rapide
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet outils de développement */}
        {isDevelopment && (
          <TabsContent value="dev" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Composant LicenseReset */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Gestion des licences
                </h2>
                <LicenseReset />
              </div>

              {/* Informations de développement */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Informations de développement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Mode :</span>
                        <Badge variant="outline">{process.env.NODE_ENV}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Version :</span>
                        <Badge variant="outline">1.0.0</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Licence :</span>
                        <Badge variant={isDemoMode ? "secondary" : "default"}>
                          {isDemoMode ? "DÉMO" : "ACTIVÉE"}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Les outils de développement ne sont visibles qu'en mode développement.
                        En production, cet onglet sera automatiquement masqué.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        console.clear();
                        
                      }}
                    >
                      Vider la console
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const data = {
                          localStorage: Object.keys(localStorage).reduce((acc, key) => {
                            acc[key] = localStorage.getItem(key);
                            return acc;
                          }, {} as Record<string, string | null>),
                          userAgent: navigator.userAgent,
                          timestamp: new Date().toISOString()
                        };
                        
                      }}
                    >
                      Logger l'état de l'app
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};