// src/components/organisms/help-support/HelpSupport.tsx - Version enrichie
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
  Zap,
  Search,
  Wrench,
  BookMarked,
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertCircleIcon,
  ArrowRight,
  Database,
  Lock,
  Globe
} from 'lucide-react';

// Import du composant LicenseReset
import { LicenseReset } from '@/components/dev/LicenseReset';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface TroubleshootingItem {
  problem: string;
  symptoms: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high';
}

interface GlossaryItem {
  term: string;
  definition: string;
  example?: string;
}

export const HelpSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState('guide');
  const [searchQuery, setSearchQuery] = useState('');

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
      title: "Dépannage",
      description: "Résoudre les problèmes courants",
      icon: Wrench,
      action: () => setActiveTab('troubleshooting')
    },
    {
      title: "Glossaire",
      description: "Définitions des termes techniques",
      icon: BookMarked,
      action: () => setActiveTab('glossary')
    }
  ];

  // FAQ enrichie organisée par catégories
  const faqItems: FAQItem[] = [
    // Catégorie: Démarrage
    {
      category: "Démarrage",
      question: "Comment configurer mon premier relevé de notes ?",
      answer: "Allez dans 'Configurer les relevés', créez une nouvelle configuration académique avec vos UE et EC, puis dans 'Générer les relevés', importez votre fichier Excel et mappez les colonnes.",
      keywords: ["relevé", "configuration", "premier", "démarrage", "UE", "EC"]
    },
    {
      category: "Démarrage",
      question: "Quelles sont les colonnes Excel obligatoires ?",
      answer: "Les colonnes obligatoires sont : NOM, PRENOM, MATRICULE. Les autres colonnes dépendent de votre configuration académique (notes des EC, crédits, etc.).",
      keywords: ["excel", "colonnes", "obligatoire", "import", "données"]
    },
    {
      category: "Démarrage",
      question: "Comment personnaliser les logos de mon établissement ?",
      answer: "Rendez-vous dans Paramètres → Entêtes et téléchargez vos logos (logo principal et logo secondaire). Formats acceptés : PNG, JPG, SVG.",
      keywords: ["logo", "personnalisation", "établissement", "image"]
    },

    // Catégorie: Licences
    {
      category: "Licences",
      question: "Pourquoi mes documents ont un filigrane 'DÉMO' ?",
      answer: "Vous êtes en mode démo. Pour des documents officiels, vous devez activer une licence valide dans Paramètres → Licence.",
      keywords: ["démo", "filigrane", "licence", "activation"]
    },
    {
      category: "Licences",
      question: "Quels sont les différents types de licences ?",
      answer: "Il existe 4 types : Établissement (EST), Utilisateur unique (USR), Par fonctionnalité (FEA), et Temporaire (TMP). Chaque type a ses propres caractéristiques et limites.",
      keywords: ["licence", "types", "établissement", "utilisateur", "temporaire"]
    },
    {
      category: "Licences",
      question: "Que faire si ma licence temporaire expire ?",
      answer: "Contactez le support pour renouveler votre licence. Les licences temporaires affichent une date d'expiration dans les paramètres.",
      keywords: ["licence", "expiration", "temporaire", "renouvellement"]
    },
    {
      category: "Licences",
      question: "Comment activer une licence ?",
      answer: "Allez dans Paramètres → Licence, cliquez sur 'Activer une licence', entrez votre clé de licence (format: YYYY-TYPE-XXXXX), puis complétez les informations requises.",
      keywords: ["activation", "licence", "clé", "paramètres"]
    },

    // Catégorie: Configuration
    {
      category: "Configuration",
      question: "Comment créer une configuration académique ?",
      answer: "Dans 'Configurer les relevés', cliquez sur 'Nouvelle configuration', définissez le niveau et l'année académique, puis ajoutez vos UE avec leurs EC respectifs.",
      keywords: ["configuration", "académique", "UE", "EC", "création"]
    },
    {
      category: "Configuration",
      question: "Comment modifier les coefficients des EC ?",
      answer: "Dans la configuration académique, cliquez sur l'EC concerné, puis modifiez le coefficient dans les paramètres avancés. Le coefficient affecte le calcul de la moyenne.",
      keywords: ["coefficient", "EC", "modification", "moyenne", "calcul"]
    },
    {
      category: "Configuration",
      question: "Puis-je avoir plusieurs semestres dans une configuration ?",
      answer: "Oui, lors de la création de la configuration, vous pouvez définir le nombre de semestres et configurer chaque semestre séparément avec ses UE et EC.",
      keywords: ["semestre", "configuration", "multiple", "organisation"]
    },

    // Catégorie: Import/Export
    {
      category: "Import/Export",
      question: "Que faire si l'import Excel échoue ?",
      answer: "Vérifiez que votre fichier contient les colonnes requises (NOM, PRENOM, MATRICULE), que les données sont bien formatées, et qu'il n'y a pas de cellules fusionnées ou de formules complexes.",
      keywords: ["import", "excel", "erreur", "échec", "problème"]
    },
    {
      category: "Import/Export",
      question: "Comment exporter mes configurations ?",
      answer: "Dans Paramètres, utilisez l'option 'Exporter toutes les données' pour créer une sauvegarde complète de vos configurations, paramètres et données.",
      keywords: ["export", "configuration", "sauvegarde", "données"]
    },
    {
      category: "Import/Export",
      question: "Comment importer une configuration existante ?",
      answer: "Dans Paramètres, cliquez sur 'Importer depuis un fichier', sélectionnez votre fichier JSON de sauvegarde, et confirmez l'import. L'application se rechargera automatiquement.",
      keywords: ["import", "configuration", "restauration", "sauvegarde"]
    },
    {
      category: "Import/Export",
      question: "Puis-je partager mes configurations avec d'autres utilisateurs ?",
      answer: "Oui, exportez vos configurations en JSON, puis partagez le fichier. Les autres utilisateurs pourront l'importer dans leur application.",
      keywords: ["partage", "configuration", "export", "collaboration"]
    },

    // Catégorie: Sauvegarde
    {
      category: "Sauvegarde",
      question: "Comment activer la sauvegarde automatique ?",
      answer: "Dans Paramètres → Sauvegarde, activez 'Sauvegarde automatique' et configurez l'intervalle (6h, 12h, 24h ou 7 jours). Les sauvegardes seront téléchargées automatiquement.",
      keywords: ["sauvegarde", "automatique", "backup", "intervalle"]
    },
    {
      category: "Sauvegarde",
      question: "Où sont stockées mes sauvegardes automatiques ?",
      answer: "Les sauvegardes automatiques sont téléchargées dans votre dossier de téléchargements par défaut. Le nom du fichier contient la date : auto_backup_fmsp_YYYY-MM-DD.json",
      keywords: ["sauvegarde", "emplacement", "stockage", "fichier"]
    },
    {
      category: "Sauvegarde",
      question: "Quelle est la différence entre sauvegarde automatique et export manuel ?",
      answer: "La sauvegarde automatique inclut TOUT le localStorage et se déclenche automatiquement. L'export manuel permet de choisir quelles données exporter et nécessite une action de votre part.",
      keywords: ["sauvegarde", "export", "différence", "automatique", "manuel"]
    },

    // Catégorie: Personnalisation
    {
      category: "Personnalisation",
      question: "Comment personnaliser l'apparence des documents ?",
      answer: "Utilisez les onglets 'Thème' et 'Préréglages' dans les générateurs pour personnaliser couleurs, polices, mise en page et logos. Vous pouvez prévisualiser en temps réel.",
      keywords: ["personnalisation", "thème", "apparence", "couleurs", "polices"]
    },
    {
      category: "Personnalisation",
      question: "Puis-je créer mes propres préréglages de thème ?",
      answer: "Oui, dans la configuration avancée du thème, personnalisez tous les paramètres puis sauvegardez comme nouveau préréglage pour le réutiliser ultérieurement.",
      keywords: ["préréglage", "thème", "personnalisation", "sauvegarde"]
    },
    {
      category: "Personnalisation",
      question: "Comment changer la position du QR code ?",
      answer: "Dans les générateurs, section QR Code, vous pouvez ajuster la position (coin supérieur/inférieur, gauche/droite) et la taille du QR code sur les documents.",
      keywords: ["QR code", "position", "placement", "personnalisation"]
    },

    // Catégorie: Sécurité
    {
      category: "Sécurité",
      question: "Comment activer le chiffrement des QR codes ?",
      answer: "Dans les pages de génération, activez l'option 'Chiffrement compact'. Les QR codes seront alors sécurisés avec un chiffrement basé sur le matricule.",
      keywords: ["chiffrement", "QR code", "sécurité", "compact"]
    },
    {
      category: "Sécurité",
      question: "Les données sont-elles sécurisées ?",
      answer: "Oui, toutes les données sont stockées localement sur votre appareil. Les licences sont chiffrées, et vous pouvez activer le chiffrement des QR codes pour plus de sécurité.",
      keywords: ["sécurité", "données", "chiffrement", "protection"]
    },
    {
      category: "Sécurité",
      question: "Comment vérifier l'authenticité d'un document avec QR code ?",
      answer: "Scannez le QR code avec un lecteur compatible. Si le chiffrement est activé, vous devrez fournir le matricule de l'étudiant pour déchiffrer les informations.",
      keywords: ["QR code", "vérification", "authenticité", "scan"]
    },

    // Catégorie: Documents
    {
      category: "Documents",
      question: "Quelle est la différence entre un relevé et une attestation ?",
      answer: "Un relevé de notes détaille toutes les notes par UE et EC. Une attestation confirme simplement la réussite avec la moyenne générale (>= 10/20 requis).",
      keywords: ["relevé", "attestation", "différence", "document"]
    },
    {
      category: "Documents",
      question: "Pourquoi certains étudiants ne peuvent pas recevoir d'attestation ?",
      answer: "Seuls les étudiants avec une moyenne générale >= 10/20 peuvent recevoir une attestation de réussite. Les autres peuvent uniquement obtenir un relevé de notes.",
      keywords: ["attestation", "moyenne", "validation", "réussite"]
    },
    {
      category: "Documents",
      question: "Comment générer des documents pour plusieurs étudiants ?",
      answer: "Importez un fichier Excel contenant tous les étudiants, sélectionnez-les dans la liste, puis cliquez sur 'Générer'. Les documents seront créés en batch.",
      keywords: ["génération", "multiple", "batch", "étudiants"]
    },
    {
      category: "Documents",
      question: "Dans quel format sont générés les documents ?",
      answer: "Tous les documents sont générés au format PDF, qui garantit la préservation de la mise en page et est universellement accepté.",
      keywords: ["format", "PDF", "document", "génération"]
    },

    // Catégorie: Diplômes
    {
      category: "Diplômes",
      question: "Comment générer des diplômes académiques ?",
      answer: "Allez dans 'Génération de Documents → Diplômes', importez votre fichier Excel avec les données des diplômés (NOM, PRENOM, PARCOURS, SPECIALITE, etc.), personnalisez le thème si nécessaire, puis générez.",
      keywords: ["diplôme", "génération", "académique", "grade"]
    },
    {
      category: "Diplômes",
      question: "Pourquoi le menu Diplômes n'apparaît pas ?",
      answer: "La génération de diplômes est réservée aux établissements de type 'Faculté'. Vérifiez dans Paramètres → Entêtes que le type d'établissement est bien configuré comme 'Faculté'.",
      keywords: ["diplôme", "menu", "faculté", "accès"]
    },
    {
      category: "Diplômes",
      question: "Comment personnaliser l'apparence des diplômes ?",
      answer: "Dans l'onglet 'Thème' du générateur de diplômes, vous pouvez personnaliser les couleurs, polices, bordures, marges et QR code. Des préréglages sont disponibles dans l'onglet 'Gestionnaire'.",
      keywords: ["diplôme", "thème", "personnalisation", "apparence"]
    },
    {
      category: "Diplômes",
      question: "Quelles sont les colonnes Excel requises pour les diplômes ?",
      answer: "Colonnes obligatoires : NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, PARCOURS, SPECIALITE, ANNEE OBTENTION, MOYENNE, GRADE, MENTION, TITRE DIPLOME FR, TITRE DIPLOME EN, DATE JURY ADMISSION, DATE JURY DELIBERATION.",
      keywords: ["diplôme", "excel", "colonnes", "données"]
    },
    {
      category: "Diplômes",
      question: "Puis-je sauvegarder mes thèmes de diplômes personnalisés ?",
      answer: "Oui, après avoir personnalisé un thème, cliquez sur 'Sauvegarder le thème', donnez-lui un nom, et il sera disponible dans l'onglet 'Gestionnaire' pour réutilisation future.",
      keywords: ["diplôme", "thème", "sauvegarde", "personnalisé"]
    },

    // Catégorie: Attestations de Centres
    {
      category: "Attestations de Centres",
      question: "Quelle est la différence entre attestations académiques et attestations de centres ?",
      answer: "Les attestations académiques sont pour les étudiants universitaires (semestres, UE, EC). Les attestations de centres sont pour les centres de formation professionnelle (CAP, BEP, BT) avec spécialités et grades professionnels.",
      keywords: ["attestation", "centre", "différence", "académique", "professionnel"]
    },
    {
      category: "Attestations de Centres",
      question: "Comment créer un centre de formation ?",
      answer: "Allez dans 'Configuration → Gestion des Centres', cliquez sur 'Nouveau Centre', remplissez les informations (nom, localisation, logos), configurez les instances administratives (MINEFOP, MINESUP) et les textes légaux.",
      keywords: ["centre", "création", "formation", "MINEFOP"]
    },
    {
      category: "Attestations de Centres",
      question: "Comment ajouter une instance administrative (MINEFOP, MINESUP) ?",
      answer: "Dans la gestion d'un centre, onglet 'Instances', cliquez sur 'Ajouter une instance', remplissez le nom français/anglais, l'acronyme, téléchargez le logo et cochez 'Afficher sur les attestations'.",
      keywords: ["instance", "MINEFOP", "MINESUP", "administratif"]
    },
    {
      category: "Attestations de Centres",
      question: "Puis-je gérer plusieurs centres de formation ?",
      answer: "Oui, vous pouvez créer autant de centres que nécessaire. Chaque centre a ses propres logos, instances administratives et textes légaux. Sélectionnez le centre approprié avant de générer les attestations.",
      keywords: ["centres", "multiple", "gestion", "plusieurs"]
    },
    {
      category: "Attestations de Centres",
      question: "Comment exporter/importer les instances administratives ?",
      answer: "Dans la gestion d'un centre, onglet 'Instances', utilisez 'Exporter les instances' pour sauvegarder en JSON (avec logos inclus), et 'Importer les instances' pour les restaurer ou les partager entre centres.",
      keywords: ["export", "import", "instances", "JSON", "partage"]
    },

    // Catégorie: Historique
    {
      category: "Historique",
      question: "Comment consulter l'historique des documents générés ?",
      answer: "Allez dans 'Autres → Historique des Docs' pour voir tous les documents générés avec filtres par type, date, étudiant, année académique et statut. Vous pouvez rechercher par nom, matricule ou type de document.",
      keywords: ["historique", "documents", "consultation", "filtres"]
    },
    {
      category: "Historique",
      question: "Puis-je exporter l'historique des documents ?",
      answer: "Oui, dans l'historique, vous pouvez exporter la sélection en CSV ou imprimer l'historique en PDF avec les statistiques et filtres appliqués.",
      keywords: ["historique", "export", "impression", "PDF", "CSV"]
    },
    {
      category: "Historique",
      question: "Comment filtrer l'historique par période ?",
      answer: "Utilisez les filtres 'Période' avec les options : Aujourd'hui, Cette semaine, Ce mois, ou Personnalisée pour définir des dates de début et de fin spécifiques.",
      keywords: ["historique", "filtre", "période", "date"]
    },
    {
      category: "Historique",
      question: "Puis-je regénérer un document depuis l'historique ?",
      answer: "Oui, cliquez sur l'icône de regénération (🔄) à côté du document dans l'historique. Le document sera régénéré avec les mêmes paramètres que l'original.",
      keywords: ["historique", "regénérer", "document", "rééditer"]
    },

    // Catégorie: Modèles Excel
    {
      category: "Modèles Excel",
      question: "Où télécharger les modèles Excel ?",
      answer: "Allez dans 'Configuration → Export Modèles Excel' pour télécharger tous les modèles : relevés, attestations, diplômes, attestations de centres, et QR codes. Chaque modèle contient des exemples de données.",
      keywords: ["modèle", "excel", "téléchargement", "template"]
    },
    {
      category: "Modèles Excel",
      question: "Les modèles Excel contiennent-ils des exemples ?",
      answer: "Oui, tous les modèles contiennent 2-3 lignes d'exemples avec toutes les colonnes requises et des commentaires explicatifs. Supprimez les exemples avant d'ajouter vos vraies données.",
      keywords: ["modèle", "exemple", "données", "template"]
    },

    // Catégorie: Performance
    {
      category: "Performance",
      question: "Combien de documents puis-je générer en une fois ?",
      answer: "La limite dépend de votre configuration système. Pour de grandes cohortes (500+ étudiants), privilégiez la génération par lots de 100-200 documents.",
      keywords: ["performance", "limite", "génération", "batch"]
    },
    {
      category: "Performance",
      question: "Pourquoi la génération est-elle lente ?",
      answer: "La génération de PDF nécessite des ressources. Facteurs d'impact : nombre de documents, complexité du thème, qualité des logos, et performances de votre ordinateur.",
      keywords: ["performance", "lenteur", "génération", "optimisation"]
    }
  ];

  // Items de dépannage
  const troubleshootingItems: TroubleshootingItem[] = [
    {
      problem: "L'import Excel échoue",
      symptoms: [
        "Message d'erreur lors de l'import",
        "Colonnes non reconnues",
        "Données manquantes après import"
      ],
      solutions: [
        "Vérifiez que votre fichier contient les colonnes NOM, PRENOM, MATRICULE",
        "Supprimez les cellules fusionnées et les formules complexes",
        "Assurez-vous que le fichier est au format .xlsx ou .xls",
        "Vérifiez qu'il n'y a pas de lignes vides au début du fichier",
        "Enregistrez le fichier sous un nouveau nom et réessayez"
      ],
      severity: 'high'
    },
    {
      problem: "Les PDF ne se génèrent pas",
      symptoms: [
        "Erreur lors de la génération",
        "Génération bloquée à 0%",
        "Fichier PDF vide ou corrompu"
      ],
      solutions: [
        "Vérifiez que tous les champs obligatoires sont remplis dans les paramètres",
        "Assurez-vous que les logos sont dans un format valide (PNG, JPG, SVG)",
        "Réduisez le nombre de documents à générer en une fois",
        "Videz le cache du navigateur et rechargez l'application",
        "Vérifiez l'espace disque disponible"
      ],
      severity: 'high'
    },
    {
      problem: "Les données Excel disparaissent quand je change d'onglet",
      symptoms: [
        "Fichier Excel uploadé perdu après changement d'onglet",
        "Colonnes mappées réinitialisées"
      ],
      solutions: [
        "Ce problème est corrigé dans la dernière version",
        "Les données sont maintenant sauvegardées automatiquement",
        "Si le problème persiste, exportez vos données et rechargez la page"
      ],
      severity: 'low'
    },
    {
      problem: "La licence ne s'active pas",
      symptoms: [
        "Message d'erreur 'Clé invalide'",
        "Licence reconnue mais non activée",
        "Mode démo reste actif après activation"
      ],
      solutions: [
        "Vérifiez que vous avez copié la clé complète sans espaces",
        "Assurez-vous que le format est correct (YYYY-TYPE-XXXXX)",
        "Vérifiez la date d'expiration pour les licences temporaires",
        "Contactez le support si la clé est valide mais ne fonctionne pas",
        "En développement, utilisez Dev Tools → Reset License"
      ],
      severity: 'high'
    },
    {
      problem: "Les configurations ne se sauvegardent pas",
      symptoms: [
        "Modifications perdues après rechargement",
        "Configurations réinitialisées",
        "Import de configuration échoue"
      ],
      solutions: [
        "Vérifiez que le stockage local n'est pas plein",
        "Exportez régulièrement vos configurations comme sauvegarde",
        "Vérifiez les paramètres du navigateur (cookies et stockage activés)",
        "Essayez avec un autre navigateur pour identifier le problème",
        "Utilisez la sauvegarde automatique pour éviter les pertes de données"
      ],
      severity: 'medium'
    },
    {
      problem: "Les QR codes ne se scannent pas",
      symptoms: [
        "QR code illisible par les scanners",
        "Erreur lors du scan",
        "Déchiffrement impossible"
      ],
      solutions: [
        "Augmentez la taille du QR code dans les paramètres",
        "Assurez-vous que le QR code n'est pas coupé lors de l'impression",
        "Pour le chiffrement, vérifiez que vous utilisez le bon matricule",
        "Utilisez un scanner QR compatible avec les données chiffrées",
        "Testez avec plusieurs applications de scan différentes"
      ],
      severity: 'medium'
    },
    {
      problem: "L'application est lente",
      symptoms: [
        "Interface qui rame",
        "Génération très lente",
        "Chargement des pages long"
      ],
      solutions: [
        "Fermez les onglets et applications inutiles",
        "Videz le cache du navigateur",
        "Réduisez la qualité des logos si trop volumineux",
        "Générez les documents par lots plus petits",
        "Vérifiez les performances de votre ordinateur (RAM, CPU)"
      ],
      severity: 'low'
    },
    {
      problem: "L'historique ne s'affiche pas",
      symptoms: [
        "Page historique vide",
        "Documents générés non enregistrés",
        "Filtres ne fonctionnent pas"
      ],
      solutions: [
        "Vérifiez que vous avez bien généré des documents au préalable",
        "Réinitialisez les filtres (bouton 'Réinitialiser')",
        "Vérifiez le stockage local (clé 'document-history')",
        "Exportez et réimportez vos données si nécessaire",
        "En dernier recours, contactez le support avec une sauvegarde"
      ],
      severity: 'low'
    }
  ];

  // Glossaire
  const glossaryItems: GlossaryItem[] = [
    {
      term: "UE (Unité d'Enseignement)",
      definition: "Regroupement de plusieurs éléments constitutifs (EC) formant un ensemble cohérent d'apprentissage. Une UE peut contenir 1 à plusieurs EC.",
      example: "UE 'Mathématiques' contenant les EC 'Algèbre', 'Analyse' et 'Probabilités'"
    },
    {
      term: "EC (Élément Constitutif)",
      definition: "Composante élémentaire d'une UE correspondant à une matière ou un cours spécifique. Chaque EC a une note, un coefficient et des crédits.",
      example: "EC 'Algèbre Linéaire' avec coefficient 2 et 3 crédits"
    },
    {
      term: "Coefficient",
      definition: "Facteur multiplicateur appliqué à une note pour le calcul de la moyenne. Un coefficient de 2 signifie que la note compte double.",
      example: "Note de 15/20 avec coefficient 2 contribue comme 30 points au calcul"
    },
    {
      term: "Crédit (ECTS)",
      definition: "Unité de mesure de la charge de travail. Un crédit correspond généralement à 25-30 heures de travail. 30 crédits = 1 semestre, 60 crédits = 1 année.",
      example: "Une UE de 5 crédits validée permet d'accumuler 5 crédits vers le diplôme"
    },
    {
      term: "Matricule",
      definition: "Identifiant unique attribué à chaque étudiant. Utilisé pour le chiffrement des QR codes et l'identification dans les documents.",
      example: "Matricule: 21A001FS"
    },
    {
      term: "Relevé de notes",
      definition: "Document officiel détaillant toutes les notes obtenues par un étudiant dans chaque EC et UE, avec la moyenne générale et les crédits.",
      example: "Relevé du semestre 1 avec notes, moyennes UE et moyenne générale"
    },
    {
      term: "Attestation de réussite",
      definition: "Document certifiant qu'un étudiant a validé son niveau/semestre avec une moyenne >= 10/20. Plus simple qu'un relevé, elle confirme juste la réussite.",
      example: "Attestation de réussite Licence 1 avec moyenne de 12.5/20"
    },
    {
      term: "QR Code chiffré",
      definition: "Code QR contenant des données sécurisées nécessitant le matricule de l'étudiant pour être déchiffrées. Garantit l'authenticité et la sécurité.",
      example: "QR code scannable uniquement avec le matricule correct de l'étudiant"
    },
    {
      term: "Chiffrement compact",
      definition: "Méthode de chiffrement basée sur le matricule qui réduit la taille des QR codes tout en assurant la sécurité des données.",
      example: "QR code 30% plus petit avec chiffrement basé sur matricule"
    },
    {
      term: "Mode Démo",
      definition: "Mode de fonctionnement sans licence activée. Les documents générés portent un filigrane 'DÉMO' et certaines fonctionnalités sont limitées.",
      example: "PDF avec filigrane 'DÉMO' en transparence"
    },
    {
      term: "Licence Établissement",
      definition: "Type de licence pour une institution (université, faculté). Permet plusieurs utilisateurs et tous les niveaux. Format: YYYY-EST-XXXXX",
      example: "Licence 2025-EST-12345 pour l'Université de Douala"
    },
    {
      term: "Licence Temporaire",
      definition: "Licence avec date d'expiration, généralement pour essai ou usage ponctuel. Format: YYYY-TMP-XXXXX-MMDDYYYY",
      example: "Licence 2025-TMP-12345-12312025 expire le 31/12/2025"
    },
    {
      term: "Mapping de colonnes",
      definition: "Processus d'association des colonnes du fichier Excel avec les champs attendus par l'application (NOM ↔ Nom étudiant, etc.)",
      example: "Colonne 'Student Name' mappée au champ 'NOM'"
    },
    {
      term: "Préréglage (Preset)",
      definition: "Configuration de thème prédéfinie que vous pouvez appliquer rapidement pour personnaliser l'apparence des documents.",
      example: "Préréglage 'Bleu professionnel' avec couleurs et polices coordonnées"
    },
    {
      term: "Configuration académique",
      definition: "Ensemble de paramètres définissant la structure d'un niveau (semestres, UE, EC, coefficients, crédits).",
      example: "Configuration L1 Informatique avec 2 semestres, 8 UE et 24 EC"
    },
    {
      term: "Sauvegarde automatique",
      definition: "Système qui exporte automatiquement toutes vos données à intervalles réguliers dans votre dossier de téléchargements.",
      example: "Sauvegarde toutes les 24h dans 'auto_backup_fmsp_2025-01-19.json'"
    },
    {
      term: "localStorage",
      definition: "Stockage local du navigateur où sont sauvegardées toutes vos données (configurations, paramètres, historique). Persiste entre les sessions.",
      example: "Toutes vos configurations restent disponibles même après fermeture du navigateur"
    },
    {
      term: "Export/Import de configuration",
      definition: "Fonctionnalité permettant de sauvegarder toutes vos configurations dans un fichier JSON et de les restaurer ou partager.",
      example: "Export de toutes les configs dans 'configurations-completes-2025-01-19.json'"
    },
    {
      term: "Batch (Génération par lots)",
      definition: "Génération de plusieurs documents simultanément en une seule opération.",
      example: "Génération de 150 relevés en un clic pour toute la promotion"
    },
    {
      term: "Validation automatique",
      definition: "Système qui vérifie automatiquement si un étudiant remplit les critères pour recevoir une attestation (moyenne >= 10/20).",
      example: "Étudiant avec 9.5/20 ne peut pas recevoir d'attestation automatiquement"
    },
    {
      term: "Diplôme académique",
      definition: "Document officiel attestant l'obtention d'un grade académique (Licence, Master, Doctorat) par un étudiant ayant complété son parcours universitaire.",
      example: "Diplôme de Docteur en Médecine pour un étudiant ayant validé tous les semestres"
    },
    {
      term: "Attestation de centre",
      definition: "Document pour les centres de formation professionnelle certifiant l'obtention d'un grade professionnel (CAP, BEP, BT) avec spécialité et mention.",
      example: "Attestation CAP Électricité Bâtiment mention BIEN délivrée par le CFPD"
    },
    {
      term: "Instance administrative",
      definition: "Organisme de tutelle ou partenaire institutionnel d'un centre de formation (MINEFOP, MINESUP, délégations). Leurs logos apparaissent sur les attestations de centres.",
      example: "MINEFOP (Ministère de l'Emploi et de la Formation Professionnelle)"
    },
    {
      term: "Grade professionnel",
      definition: "Niveau de qualification obtenu dans un centre de formation professionnelle (CAP, BEP, BT, BP, etc.).",
      example: "Grade : CAP (Certificat d'Aptitude Professionnelle)"
    },
    {
      term: "Spécialité (formation professionnelle)",
      definition: "Domaine de formation dans un centre professionnel (Électricité, Plomberie, Couture, Menuiserie, etc.).",
      example: "Spécialité : Électricité Bâtiment avec option Installation Solaire"
    },
    {
      term: "Textes légaux",
      definition: "Références réglementaires et juridiques (décrets, arrêtés) affichées sur les attestations de centres pour garantir leur conformité légale.",
      example: "Vu le décret n° 2018/XXX du XX/XX/2018 portant organisation des examens"
    },
    {
      term: "Parcours académique",
      definition: "Filière d'études suivie par un étudiant jusqu'à l'obtention de son diplôme (Médecine Générale, Pharmacie, Sciences Infirmières, etc.).",
      example: "Parcours : Médecine Générale sur 7 ans"
    },
    {
      term: "Thème de diplôme",
      definition: "Ensemble de paramètres visuels personnalisables pour les diplômes : couleurs, polices, bordures, marges, QR code. Plusieurs préréglages sont disponibles.",
      example: "Thème 'Classique' avec couleurs or et bordeaux, police serif élégante"
    },
    {
      term: "Gestionnaire de thèmes",
      definition: "Interface permettant de sauvegarder, charger et gérer vos thèmes personnalisés de diplômes ou d'attestations.",
      example: "Sauvegarder le thème 'FMSP 2025' pour le réutiliser chaque année"
    },
    {
      term: "Historique des documents",
      definition: "Base de données locale enregistrant tous les documents générés (type, date, étudiant, configuration) pour consultation, recherche et regénération.",
      example: "Consulter tous les relevés générés en janvier 2025 pour L1 Médecine"
    },
    {
      term: "Export de modèles",
      definition: "Fonctionnalité centralisant le téléchargement de tous les modèles Excel pré-formatés avec colonnes requises et exemples de données.",
      example: "Télécharger le modèle Excel pour diplômes avec toutes les colonnes obligatoires"
    },
    {
      term: "Centre de formation",
      definition: "Établissement de formation professionnelle configuré dans l'application avec ses informations, logos, instances administratives et textes légaux.",
      example: "Centre de Formation Professionnelle de Douala (CFPD)"
    },
    {
      term: "Session d'examen",
      definition: "Période durant laquelle se déroulent les examens pour les formations professionnelles (septembre, juin, etc.).",
      example: "Session d'examen : septembre 2025"
    },
    {
      term: "Regénération de document",
      definition: "Action permettant de créer à nouveau un document avec les mêmes paramètres qu'un document précédemment généré, accessible depuis l'historique.",
      example: "Regénérer le relevé de Jean KAMDEM avec les mêmes données et thème"
    }
  ];

  // Bonnes pratiques
  const bestPractices = [
    {
      category: "Organisation",
      icon: Database,
      practices: [
        {
          title: "Structurez vos configurations",
          description: "Créez une configuration par niveau et année académique. Nommez-les clairement : 'L1-2024-2025', 'M2-2024-2025'."
        },
        {
          title: "Préparez vos fichiers Excel",
          description: "Utilisez des noms de colonnes clairs et cohérents. Évitez les accents dans les en-têtes de colonnes pour faciliter le mapping."
        },
        {
          title: "Organisez vos sauvegardes",
          description: "Créez un dossier dédié aux sauvegardes. Nommez-les avec des dates : 'Backup_Janvier_2025', 'Backup_Avant_Modification'."
        }
      ]
    },
    {
      category: "Sécurité",
      icon: Lock,
      practices: [
        {
          title: "Activez la sauvegarde automatique",
          description: "Configurez une sauvegarde automatique quotidienne (24h) minimum pour ne jamais perdre vos données."
        },
        {
          title: "Utilisez le chiffrement des QR codes",
          description: "Pour les documents officiels, activez toujours le chiffrement compact pour garantir l'authenticité."
        },
        {
          title: "Sécurisez vos exports",
          description: "Stockez vos exports de configuration dans un lieu sûr (cloud sécurisé, disque externe chiffré)."
        },
        {
          title: "Protégez votre licence",
          description: "Ne partagez jamais votre clé de licence. Elle est liée à votre établissement ou compte."
        }
      ]
    },
    {
      category: "Performance",
      icon: Zap,
      practices: [
        {
          title: "Optimisez vos logos",
          description: "Utilisez des logos optimisés (max 500KB). Format PNG avec transparence recommandé. Résolution 300-600px suffisante."
        },
        {
          title: "Générez par lots",
          description: "Pour plus de 200 étudiants, divisez en plusieurs lots de 100-150 pour une génération plus rapide et stable."
        },
        {
          title: "Nettoyez régulièrement",
          description: "Supprimez les anciennes configurations non utilisées et videz l'historique des documents très anciens."
        },
        {
          title: "Testez avec un échantillon",
          description: "Avant une génération massive, testez avec 2-3 étudiants pour valider le résultat."
        }
      ]
    },
    {
      category: "Qualité",
      icon: CheckCircle,
      practices: [
        {
          title: "Vérifiez vos données",
          description: "Contrôlez la qualité des données Excel : pas de cellules vides, format des notes cohérent (10/20, pas 10)."
        },
        {
          title: "Utilisez les prévisualisations",
          description: "Prévisualisez toujours avant la génération finale. Vérifiez les polices, couleurs, et alignements."
        },
        {
          title: "Testez vos QR codes",
          description: "Après génération, testez le scan des QR codes avec plusieurs applications pour garantir la lisibilité."
        },
        {
          title: "Validez avec des exemples",
          description: "Créez des documents de test avec données fictives pour valider votre mise en page avant production."
        }
      ]
    }
  ];

  // Filtrer les FAQ selon la recherche
  const filteredFAQ = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;

    const query = searchQuery.toLowerCase();
    return faqItems.filter(item =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filtrer le dépannage selon la recherche
  const filteredTroubleshooting = useMemo(() => {
    if (!searchQuery.trim()) return troubleshootingItems;

    const query = searchQuery.toLowerCase();
    return troubleshootingItems.filter(item =>
      item.problem.toLowerCase().includes(query) ||
      item.symptoms.some(s => s.toLowerCase().includes(query)) ||
      item.solutions.some(s => s.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Filtrer le glossaire selon la recherche
  const filteredGlossary = useMemo(() => {
    if (!searchQuery.trim()) return glossaryItems;

    const query = searchQuery.toLowerCase();
    return glossaryItems.filter(item =>
      item.term.toLowerCase().includes(query) ||
      item.definition.toLowerCase().includes(query) ||
      (item.example && item.example.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Grouper les FAQ par catégorie
  const faqByCategory = useMemo(() => {
    const grouped: Record<string, FAQItem[]> = {};
    filteredFAQ.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [filteredFAQ]);

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

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans l'aide... (FAQ, dépannage, glossaire)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredFAQ.length + filteredTroubleshooting.length + filteredGlossary.length} résultat(s) trouvé(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liens rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <TabsList className={`grid w-full ${isDevelopment ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="faq">
            FAQ
            {searchQuery && filteredFAQ.length > 0 && (
              <Badge variant="secondary" className="ml-1">{filteredFAQ.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="troubleshooting">
            Dépannage
            {searchQuery && filteredTroubleshooting.length > 0 && (
              <Badge variant="secondary" className="ml-1">{filteredTroubleshooting.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="glossary">
            Glossaire
            {searchQuery && filteredGlossary.length > 0 && (
              <Badge variant="secondary" className="ml-1">{filteredGlossary.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="best-practices">Bonnes pratiques</TabsTrigger>
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
                        <h4 className="font-medium">Activer votre licence</h4>
                        <p className="text-sm text-gray-600">Dans Paramètres → Licence, activez votre clé de licence puis complétez les informations requises.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium">Configurer les entêtes</h4>
                        <p className="text-sm text-gray-600">Définissez les informations de votre établissement, logos et contacts.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium">Configurer les relevés</h4>
                        <p className="text-sm text-gray-600">Créez vos configurations académiques avec UE et EC, coefficients et crédits.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                      <div>
                        <h4 className="font-medium">Activer la sauvegarde automatique</h4>
                        <p className="text-sm text-gray-600">Activez la sauvegarde automatique pour protéger vos données.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Génération de documents</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                      <div>
                        <h4 className="font-medium">Préparer vos données Excel</h4>
                        <p className="text-sm text-gray-600">Formatez votre fichier avec les colonnes requises : NOM, PRENOM, MATRICULE, notes des EC.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                      <div>
                        <h4 className="font-medium">Importer les données</h4>
                        <p className="text-sm text-gray-600">Chargez votre fichier Excel et mappez les colonnes avec les champs attendus.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">7</div>
                      <div>
                        <h4 className="font-medium">Personnaliser l'apparence</h4>
                        <p className="text-sm text-gray-600">Utilisez les thèmes et préréglages pour personnaliser vos documents.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">8</div>
                      <div>
                        <h4 className="font-medium">Générer et télécharger</h4>
                        <p className="text-sm text-gray-600">Prévisualisez puis générez vos documents PDF individuellement ou en batch.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Nouveaux types de documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <h4 className="font-medium text-indigo-900">Diplômes académiques</h4>
                    </div>
                    <p className="text-sm text-indigo-700">
                      Générez des diplômes officiels pour les facultés avec thèmes personnalisables et système de préréglages avancé.
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-cyan-600" />
                      <h4 className="font-medium text-cyan-900">Attestations de centres</h4>
                    </div>
                    <p className="text-sm text-cyan-700">
                      Pour les centres de formation professionnelle (CAP, BEP, BT) avec gestion des instances administratives.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-4 w-4 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Export de modèles Excel</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      Téléchargez tous les modèles Excel pré-formatés avec exemples de données et colonnes requises.
                    </p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-pink-600" />
                      <h4 className="font-medium text-pink-900">Historique des documents</h4>
                    </div>
                    <p className="text-sm text-pink-700">
                      Consultez, recherchez et regénérez tous vos documents avec filtres avancés et statistiques.
                    </p>
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
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <h4 className="font-medium text-amber-900">Validation automatique</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Seuls les étudiants avec une moyenne &gt;= 10/20 peuvent recevoir des attestations ou diplômes.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-900">Sauvegarde automatique</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Configurez des sauvegardes automatiques périodiques de toutes vos données pour ne rien perdre.
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <h4 className="font-medium text-orange-900">Génération par lots</h4>
                    </div>
                    <p className="text-sm text-orange-700">
                      Générez des centaines de documents simultanément avec export ZIP automatique et compression.
                    </p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-teal-600" />
                      <h4 className="font-medium text-teal-900">Export/Import instances</h4>
                    </div>
                    <p className="text-sm text-teal-700">
                      Partagez vos instances administratives entre centres via export/import JSON avec logos inclus.
                    </p>
                  </div>
                  <div className="p-3 bg-violet-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-violet-600" />
                      <h4 className="font-medium text-violet-900">Gestionnaire de thèmes</h4>
                    </div>
                    <p className="text-sm text-violet-700">
                      Sauvegardez et réutilisez vos thèmes personnalisés pour diplômes et attestations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          {filteredFAQ.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-600">
                  Essayez avec d'autres mots-clés ou consultez les autres sections d'aide.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(faqByCategory).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    {category}
                    <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                        {item.question}
                      </h3>
                      <p className="text-sm text-gray-600 pl-6">{item.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Guide de dépannage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredTroubleshooting.length === 0 ? (
                <div className="p-12 text-center">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun problème trouvé</h3>
                  <p className="text-gray-600">
                    Essayez avec d'autres mots-clés.
                  </p>
                </div>
              ) : (
                filteredTroubleshooting.map((item, index) => (
                  <div key={index} className="border rounded-lg p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        item.severity === 'high' ? 'bg-red-100' :
                        item.severity === 'medium' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {item.severity === 'high' ? <XCircle className="h-5 w-5 text-red-600" /> :
                         item.severity === 'medium' ? <AlertCircleIcon className="h-5 w-5 text-yellow-600" /> :
                         <Info className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.problem}</h3>
                        <Badge variant={
                          item.severity === 'high' ? 'destructive' :
                          item.severity === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {item.severity === 'high' ? 'Priorité haute' :
                           item.severity === 'medium' ? 'Priorité moyenne' :
                           'Priorité basse'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 ml-14">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Symptômes :</h4>
                        <ul className="space-y-1">
                          {item.symptoms.map((symptom, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Solutions :</h4>
                        <ol className="space-y-2">
                          {item.solutions.map((solution, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="font-semibold text-green-600 mt-0.5">{idx + 1}.</span>
                              <span>{solution}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glossary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5" />
                Glossaire des termes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredGlossary.length === 0 ? (
                <div className="p-12 text-center">
                  <BookMarked className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun terme trouvé</h3>
                  <p className="text-gray-600">
                    Essayez avec d'autres mots-clés.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGlossary.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h3 className="font-semibold text-blue-900 mb-2">{item.term}</h3>
                      <p className="text-sm text-gray-700 mb-2">{item.definition}</p>
                      {item.example && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                          <strong>Exemple :</strong> {item.example}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="best-practices" className="space-y-4">
          {bestPractices.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5" />
                  {section.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.practices.map((practice, practiceIndex) => (
                  <div key={practiceIndex} className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {practice.title}
                    </h4>
                    <p className="text-sm text-gray-600">{practice.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
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
                <Button className="w-full" onClick={() => window.open('mailto:cedrictefoye@gmail.com')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Ressources téléchargeables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Téléchargez des modèles et exemples pour démarrer rapidement.
                  </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Modèle Excel - Relevé de notes
                  <Download className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Modèle Excel - Attestations
                  <Download className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Exemple de configuration complète
                  <Download className="h-3 w-3 ml-auto" />
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Guide PDF de démarrage rapide
                  <Download className="h-3 w-3 ml-auto" />
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
                        console.log('État de l\'application:', data);
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
