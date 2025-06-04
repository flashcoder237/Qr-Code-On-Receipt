// src/components/organisms/help-support/HelpSupport.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Github,
  ExternalLink,
  Book,
  Video,
  Download,
  Shield,
  Zap,
  Code,
  Coffee,
  Heart,
  Send,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Smartphone,
  Globe,
  Linkedin,
  Twitter,
  MapPin,
  Clock,
  User,
  Briefcase,
  Eye,
  Users
} from "lucide-react";

interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  location: string;
  timezone: string;
  languages: string[];
  specializations: string[];
  avatar?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface SupportTicket {
  subject: string;
  category: string;
  priority: string;
  description: string;
  email: string;
  name: string;
}

const developerContacts: ContactInfo[] = [
  {
    name: "Cédric TEFOYE",
    role: "Développeur Principal & Architecte Logiciel",
    email: "cedrictefoye@gmail.com",
    phone: "+237 652 761 31",
    linkedin: "Cédric TEFOYE",
    github: "cedrictefoye",
    twitter: "cedrictefoye_dev",
    location: "Douala, Cameroun",
    timezone: "GMT+1 (WAT)",
    languages: ["Français", "Anglais"],
    specializations: [
      "Applications Electron/React",
      "Chiffrement et Sécurité des Données",
      "Génération de Documents PDF",
      "Systèmes de Gestion Académique",
      "Intégration QR Code",
      "Architecture Full-Stack"
    ],
    avatar: "/api/placeholder/150/150"
  },
  {
    name: "Équipe Support Technique",
    role: "Support et Maintenance",
    email: "cedrictefoye@gmail.com",
    phone: "+237 652 761 31",
    location: "Douala, Cameroun",
    timezone: "GMT+1 (WAT)",
    languages: ["Français", "Anglais"],
    specializations: [
      "Résolution de Problèmes",
      "Formation Utilisateurs",
      "Maintenance Système",
      "Assistance Configuration"
    ]
  }
];

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "Comment activer le chiffrement compact des QR codes ?",
    answer: "Le chiffrement compact est activé par défaut. Vous pouvez le désactiver/activer dans les paramètres de génération des attestations et relevés. Le chiffrement utilise une clé basée uniquement sur le matricule de l'étudiant, rendant les QR codes plus compacts et sécurisés.",
    category: "Sécurité",
    tags: ["chiffrement", "qr-code", "sécurité", "compact"]
  },
  {
    id: "2",
    question: "Pourquoi mes QR codes sont-ils volumineux ?",
    answer: "La taille des QR codes dépend de la quantité de données incluses. Avec le chiffrement compact, seules les données sensibles sont chiffrées (matricule, dates, moyenne) tandis que les informations publiques restent lisibles. Cela réduit significativement la taille par rapport au chiffrement complet.",
    category: "QR Codes",
    tags: ["qr-code", "taille", "optimisation", "données"]
  },
  {
    id: "3",
    question: "Comment importer mes données Excel ?",
    answer: "Utilisez le composant de téléchargement de fichier dans chaque section (Relevés/Attestations). L'application détecte automatiquement les colonnes et propose des correspondances. Les données manquantes sont automatiquement remplacées par 'N/D' pour assurer la cohérence.",
    category: "Import",
    tags: ["excel", "import", "données", "colonnes"]
  },
  {
    id: "4",
    question: "Que faire si certaines colonnes Excel sont manquantes ?",
    answer: "L'application propose un système de correspondance automatique et suggère des noms similaires. Vous pouvez aussi continuer avec un import partiel - les colonnes manquantes seront remplies avec des valeurs par défaut. Consultez la section 'Correspondance' pour mapper manuellement vos colonnes.",
    category: "Import",
    tags: ["excel", "colonnes", "mapping", "validation"]
  },
  {
    id: "5",
    question: "Comment personnaliser l'apparence des documents ?",
    answer: "Utilisez l'éditeur de thèmes dans la section 'Thème' pour personnaliser les couleurs, polices, mise en page, et plus. Vous pouvez aussi choisir parmi des préréglages dans la section 'Préréglages' ou créer vos propres thèmes personnalisés.",
    category: "Personnalisation",
    tags: ["thème", "apparence", "personnalisation", "design"]
  },
  {
    id: "6",
    question: "Comment configurer les logos de mon établissement ?",
    answer: "Dans la section 'Paramètres', vous pouvez télécharger jusqu'à 3 logos : logo de l'IPES/établissement, logo de l'université, et logo de la faculté. Les logos sont automatiquement redimensionnés et optimisés pour l'affichage sur les documents.",
    category: "Configuration",
    tags: ["logos", "établissement", "configuration", "images"]
  },
  {
    id: "7",
    question: "Puis-je générer des documents pour des étudiants spécifiques ?",
    answer: "Oui ! Utilisez la section 'Sélection' pour choisir individuellement les étudiants. Vous pouvez filtrer par nom, matricule, moyenne, ou utiliser la sélection en lot. La prévisualisation est disponible pour chaque étudiant avant génération.",
    category: "Génération",
    tags: ["sélection", "étudiants", "filtrage", "génération"]
  },
  {
    id: "8",
    question: "Comment vérifier l'authenticité d'un document avec QR code ?",
    answer: "Scannez le QR code avec l'application mobile dédiée (en développement) ou un lecteur QR standard. Les données publiques sont immédiatement visibles, tandis que les données sensibles nécessitent le matricule de l'étudiant pour être déchiffrées.",
    category: "Vérification",
    tags: ["qr-code", "vérification", "authenticité", "mobile"]
  },
  {
    id: "9",
    question: "L'application fonctionne-t-elle hors ligne ?",
    answer: "Oui, l'application Electron fonctionne entièrement hors ligne une fois installée. Aucune connexion internet n'est requise pour générer les documents, traiter les données ou utiliser les fonctionnalités de chiffrement.",
    category: "Utilisation",
    tags: ["hors-ligne", "offline", "installation", "autonomie"]
  },
  {
    id: "10",
    question: "Comment sauvegarder mes configurations et thèmes ?",
    answer: "Toutes vos configurations (paramètres d'établissement, thèmes personnalisés, correspondances de colonnes) sont automatiquement sauvegardées localement. Vous pouvez aussi exporter/importer vos configurations via les boutons dédiés dans chaque section.",
    category: "Sauvegarde",
    tags: ["sauvegarde", "configuration", "export", "import"]
  },
  {
    id: "11",
    question: "Quels formats de fichiers Excel sont supportés ?",
    answer: "L'application supporte les fichiers .xlsx et .xls. Les données sont automatiquement sanitisées lors de l'import, et les dates Excel sont correctement converties. Assurez-vous que la première ligne contient les en-têtes de colonnes.",
    category: "Formats",
    tags: ["excel", "xlsx", "xls", "formats", "compatibilité"]
  },
  {
    id: "12",
    question: "Comment résoudre les problèmes de génération PDF ?",
    answer: "Si la génération PDF échoue, vérifiez que toutes les données requises sont présentes et valides. Redémarrez l'application si nécessaire. En cas de problème persistant, contactez le support avec les détails de l'erreur et un exemple de vos données.",
    category: "Dépannage",
    tags: ["pdf", "erreurs", "génération", "dépannage"]
  }
];

const quickActions = [
  {
    title: "Guide de démarrage rapide",
    description: "Apprenez les bases en 5 minutes",
    icon: Zap,
    action: "guide",
    color: "bg-blue-500"
  },
  {
    title: "Télécharger le manuel",
    description: "Documentation complète PDF",
    icon: Download,
    action: "manual",
    color: "bg-green-500"
  },
  {
    title: "Vidéos tutoriels",
    description: "Formations visuelles étape par étape",
    icon: Video,
    action: "videos",
    color: "bg-purple-500"
  },
  {
    title: "Contacter le support",
    description: "Assistance personnalisée",
    icon: MessageCircle,
    action: "contact",
    color: "bg-orange-500"
  }
];

export const HelpSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState("faq");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [supportTicket, setSupportTicket] = useState<SupportTicket>({
    subject: "",
    category: "general",
    priority: "medium",
    description: "",
    email: "",
    name: ""
  });
  const [isTicketSubmitted, setIsTicketSubmitted] = useState(false);

  const categories = [
    { id: "all", label: "Toutes les catégories" },
    { id: "Sécurité", label: "Sécurité & Chiffrement" },
    { id: "QR Codes", label: "QR Codes" },
    { id: "Import", label: "Import de données" },
    { id: "Personnalisation", label: "Personnalisation" },
    { id: "Configuration", label: "Configuration" },
    { id: "Génération", label: "Génération de documents" },
    { id: "Vérification", label: "Vérification" },
    { id: "Utilisation", label: "Utilisation générale" },
    { id: "Dépannage", label: "Dépannage" }
  ];

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "guide":
        // Ouvrir le guide de démarrage
        window.open("#", "_blank");
        break;
      case "manual":
        // Télécharger le manuel
        alert("Téléchargement du manuel en cours...");
        break;
      case "videos":
        // Ouvrir les vidéos tutoriels
        window.open("https://youtube.com/playlist/example", "_blank");
        break;
      case "contact":
        setActiveTab("contact");
        break;
    }
  };

  const handleSupportTicketSubmit = () => {
    // Simuler l'envoi du ticket
    setIsTicketSubmitted(true);
    setTimeout(() => {
      setIsTicketSubmitted(false);
      setSupportTicket({
        subject: "",
        category: "general",
        priority: "medium",
        description: "",
        email: "",
        name: ""
      });
    }, 3000);
  };

  const openExternalLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Centre d'aide et Support
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Trouvez rapidement les réponses à vos questions ou contactez notre équipe de support
        </p>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleQuickAction(action.action)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            À propos
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* FAQ */}
            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Questions Fréquentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filtres */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Rechercher dans les questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="md:w-64">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Résultats */}
                  <div className="mb-4">
                    <Badge variant="outline">
                      {filteredFAQ.length} question(s) trouvée(s)
                    </Badge>
                  </div>

                  {/* FAQ Accordion */}
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFAQ.map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <span>{item.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFAQ.length === 0 && (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune question trouvée
                      </h3>
                      <p className="text-gray-600">
                        Essayez de modifier vos critères de recherche ou contactez le support.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contacts développeurs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Équipe de Développement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {developerContacts.map((contact, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{contact.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{contact.role}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                              <MapPin className="h-4 w-4" />
                              {contact.location}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {contact.timezone}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {contact.email}
                            </a>
                          </div>

                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-600" />
                              <a 
                                href={`tel:${contact.phone}`}
                                className="text-green-600 hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {contact.linkedin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openExternalLink(`https://linkedin.com/in/${contact.linkedin}`)}
                              >
                                <Linkedin className="h-4 w-4" />
                              </Button>
                            )}
                            {contact.github && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openExternalLink(`https://github.com/${contact.github}`)}
                              >
                                <Github className="h-4 w-4" />
                              </Button>
                            )}
                            {contact.twitter && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openExternalLink(`https://twitter.com/${contact.twitter}`)}
                              >
                                <Twitter className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Spécialisations:</h4>
                          <div className="flex flex-wrap gap-1">
                            {contact.specializations.map(spec => (
                              <Badge key={spec} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Langues:</h4>
                          <div className="flex gap-1">
                            {contact.languages.map(lang => (
                              <Badge key={lang} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Formulaire de support */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Créer un ticket de support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isTicketSubmitted ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Votre ticket a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Nom</label>
                            <Input
                              value={supportTicket.name}
                              onChange={(e) => setSupportTicket(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Votre nom complet"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <Input
                              type="email"
                              value={supportTicket.email}
                              onChange={(e) => setSupportTicket(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="votre.email@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Sujet</label>
                          <Input
                            value={supportTicket.subject}
                            onChange={(e) => setSupportTicket(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Résumé de votre problème"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Catégorie</label>
                            <select
                              value={supportTicket.category}
                              onChange={(e) => setSupportTicket(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="general">Général</option>
                              <option value="bug">Signaler un bug</option>
                              <option value="feature">Demande de fonctionnalité</option>
                              <option value="installation">Installation</option>
                              <option value="configuration">Configuration</option>
                              <option value="performance">Performance</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Priorité</label>
                            <select
                              value={supportTicket.priority}
                              onChange={(e) => setSupportTicket(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="low">Faible</option>
                              <option value="medium">Moyenne</option>
                              <option value="high">Élevée</option>
                              <option value="urgent">Urgente</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Description détaillée</label>
                          <Textarea
                            value={supportTicket.description}
                            onChange={(e) => setSupportTicket(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Décrivez votre problème en détail. Incluez les étapes pour reproduire le problème, les messages d'erreur, et toute information pertinente."
                            rows={6}
                          />
                        </div>

                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Temps de réponse estimé :</strong>
                            <br />• Urgente : 2-4 heures
                            <br />• Élevée : 4-8 heures  
                            <br />• Moyenne : 1-2 jours
                            <br />• Faible : 2-5 jours
                          </AlertDescription>
                        </Alert>

                        <Button 
                          onClick={handleSupportTicketSubmit}
                          className="w-full"
                          disabled={!supportTicket.name || !supportTicket.email || !supportTicket.subject || !supportTicket.description}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer le ticket
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documentation - Suite */}
            <TabsContent value="docs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Zap className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">Guide de démarrage</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Apprenez les bases pour commencer rapidement avec l'application.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Installation et configuration
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Premier relevé de notes
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Première attestation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold">Sécurité & Chiffrement</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Comprendre le système de chiffrement compact des QR codes.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Chiffrement compact
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Clés de chiffrement
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Vérification mobile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold">Référence API</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Documentation technique pour les développeurs.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Code className="h-4 w-4 mr-2" />
                        API de chiffrement
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Code className="h-4 w-4 mr-2" />
                        Génération PDF
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Github className="h-4 w-4 mr-2" />
                        Code source
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Video className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold">Tutoriels vidéo</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Formations visuelles étape par étape.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Configuration initiale
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Import de données
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Personnalisation avancée
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="font-semibold">Dépannage</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Solutions aux problèmes les plus courants.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Erreurs de génération
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Problèmes d'import
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Performance lente
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Download className="h-6 w-6 text-yellow-600" />
                      </div>
                      <h3 className="font-semibold">Ressources</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Modèles, exemples et fichiers utiles.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Modèles Excel
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Thèmes prédéfinis
                      </Button>
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Manuel complet PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section téléchargements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Téléchargements rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Modèles et exemples</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Modèle Excel pour relevés
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Modèle Excel pour attestations
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Données de test (exemple)
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Documentation</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Book className="h-4 w-4 mr-2" />
                          Manuel utilisateur complet
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Code className="h-4 w-4 mr-2" />
                          Documentation technique
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Shield className="h-4 w-4 mr-2" />
                          Guide de sécurité
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* À propos */}
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    À propos de l'application
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold mb-4">
                        Générateur de Documents Académiques FMSP
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        Application de bureau moderne développée avec Electron et React pour la génération 
                        automatisée de relevés de notes et d'attestations de réussite pour la Faculté de 
                        Médecine et des Sciences Pharmaceutiques de l'Université de Douala.
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        L'application intègre un système de chiffrement compact révolutionnaire pour 
                        sécuriser les QR codes tout en maintenant une taille optimale pour une 
                        lisibilité maximale.
                      </p>

                      <div className="space-y-3">
                        <h4 className="font-medium text-lg">Fonctionnalités principales :</h4>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Génération automatique de relevés de notes
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Génération d'attestations de réussite
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Chiffrement compact des QR codes
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Personnalisation avancée des thèmes
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Import intelligent de données Excel
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Fonctionnement 100% hors ligne
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          Innovation : Chiffrement Compact
                        </h4>
                        <p className="text-gray-700 mb-4">
                          Notre système de chiffrement révolutionnaire utilise uniquement le matricule 
                          de l'étudiant comme clé de chiffrement, créant des QR codes :
                        </p>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            <strong>50-80% plus petits</strong> que les QR codes traditionnels
                          </li>
                          <li className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <strong>100% sécurisés</strong> avec chiffrement AES-128
                          </li>
                          <li className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <strong>Données publiques</strong> immédiatement lisibles
                          </li>
                          <li className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-purple-600" />
                            <strong>Vérification mobile</strong> simplifiée
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Code className="h-5 w-5 text-gray-600" />
                          Informations techniques
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Version:</strong> 1.0.0
                          </div>
                          <div>
                            <strong>Plateforme:</strong> Electron
                          </div>
                          <div>
                            <strong>Framework:</strong> React + TypeScript
                          </div>
                          <div>
                            <strong>Chiffrement:</strong> AES-128-ECB
                          </div>
                          <div>
                            <strong>PDF:</strong> Puppeteer + HTML/CSS
                          </div>
                          <div>
                            <strong>QR Codes:</strong> qrcode.js + Crypto.js
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Équipe et remerciements */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      Équipe et remerciements
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Développement
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              EK
                            </div>
                            <div>
                              <div className="font-medium">Cédric TEFOYE</div>
                              <div className="text-sm text-gray-600">Architecte Principal & Lead Developer</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Remerciements spéciaux
                        </h4>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>• <strong>FMSP - Université de Douala</strong> pour la confiance accordée</p>
                          <p>• <strong>Équipe administrative</strong> pour les spécifications détaillées</p>
                          <p>• <strong>Utilisateurs testeurs</strong> pour leurs retours précieux</p>
                          <p>• <strong>Communauté open source</strong> pour les technologies utilisées</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact et support */}
                  <div className="text-center space-y-4">
                    <h4 className="font-medium text-lg">Besoin d'aide ou envie de contribuer ?</h4>
                    <div className="flex justify-center gap-4">
                      <Button onClick={() => setActiveTab("contact")}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contacter le support
                      </Button>
                      <Button variant="outline" onClick={() => openExternalLink("https://github.com/fmsp-app")}>
                        <Github className="h-4 w-4 mr-2" />
                        Voir sur GitHub
                      </Button>
                    </div>
                  </div>

                  {/* Footer avec version et copyright */}
                  <div className="text-center text-sm text-gray-500 pt-6 border-t">
                    <p>© 2024 FMSP Document Generator - Développé avec ❤️ par Cédric TEFOYE</p>
                    <p>Version 1.0.0 - Dernière mise à jour : Décembre 2024</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

// Export du composant et des types associés
export default HelpSupport;
export type { ContactInfo, FAQItem, SupportTicket };