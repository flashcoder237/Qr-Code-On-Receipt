// src/components/organisms/qr-document-processor/components/ManualQRDataEntry.tsx
import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileText, 
  Plus, 
  Minus, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  QrCode,
  FileCheck,
  Info
} from "lucide-react";
import QRCode from 'qrcode';

interface ManualQRData {
  content: string;
  fields: { [key: string]: string };
}

interface ManualQRDataEntryProps {
  data: ManualQRData;
  onChange: (data: ManualQRData) => void;
  onDocumentUpload: (file: File) => void;
  uploadedDocument: File | null;
}

interface QRField {
  id: string;
  label: string;
  value: string;
  type: "text" | "number" | "email" | "phone" | "url";
}

const defaultQRTemplates = [
  {
    id: "contact",
    name: "Contact vCard",
    fields: [
      { id: "name", label: "Nom complet", value: "", type: "text" as const },
      { id: "phone", label: "Téléphone", value: "", type: "phone" as const },
      { id: "email", label: "Email", value: "", type: "email" as const },
      { id: "organization", label: "Organisation", value: "", type: "text" as const },
    ]
  },
  {
    id: "payment",
    name: "Information de Paiement",
    fields: [
      { id: "invoice", label: "N° Facture", value: "", type: "text" as const },
      { id: "amount", label: "Montant", value: "", type: "number" as const },
      { id: "recipient", label: "Bénéficiaire", value: "", type: "text" as const },
      { id: "reference", label: "Référence", value: "", type: "text" as const },
    ]
  },
  {
    id: "document",
    name: "Référence Document",
    fields: [
      { id: "docId", label: "ID Document", value: "", type: "text" as const },
      { id: "title", label: "Titre", value: "", type: "text" as const },
      { id: "date", label: "Date", value: "", type: "text" as const },
      { id: "author", label: "Auteur", value: "", type: "text" as const },
    ]
  }
];

export const ManualQRDataEntry: React.FC<ManualQRDataEntryProps> = ({
  data,
  onChange,
  onDocumentUpload,
  uploadedDocument
}) => {
  // State
  const [activeTab, setActiveTab] = useState<"document" | "qr-data">("document");
  const [qrFields, setQRFields] = useState<QRField[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [qrPreview, setQRPreview] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string>(data.content || "");

  // Document upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onDocumentUpload(acceptedFiles[0]);
        setActiveTab("qr-data");
      }
    }
  });

  // Generate QR preview
  const generateQRPreview = useCallback(async (content: string) => {
    if (!content.trim()) {
      setQRPreview(null);
      return;
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(content, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQRPreview(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR preview:', error);
      setQRPreview(null);
    }
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = defaultQRTemplates.find(t => t.id === templateId);
    if (template) {
      setQRFields(template.fields.map(f => ({ ...f, id: Date.now() + Math.random().toString() })));
      setSelectedTemplate(templateId);
      setRawContent("");
    }
  }, []);

  // Handle field changes
  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setQRFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value } : field
    ));
  }, []);

  // Add custom field
  const addCustomField = useCallback(() => {
    const newField: QRField = {
      id: Date.now().toString(),
      label: "Nouveau champ",
      value: "",
      type: "text"
    };
    setQRFields(prev => [...prev, newField]);
  }, []);

  // Remove field
  const removeField = useCallback((fieldId: string) => {
    setQRFields(prev => prev.filter(field => field.id !== fieldId));
  }, []);

  // Generate content from fields
  const generateContentFromFields = useCallback(() => {
    if (qrFields.length === 0) return "";

    const content = qrFields
      .filter(field => field.value.trim())
      .map(field => `${field.label}: ${field.value}`)
      .join('\n');
    
    return content;
  }, [qrFields]);

  // Update parent data
  useEffect(() => {
    const fieldsObject = qrFields.reduce((acc, field) => {
      acc[field.label] = field.value;
      return acc;
    }, {} as { [key: string]: string });

    const content = rawContent || generateContentFromFields();
    
    onChange({
      content,
      fields: fieldsObject
    });

    generateQRPreview(content);
  }, [qrFields, rawContent, onChange, generateContentFromFields, generateQRPreview]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="document" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Charger Document
          </TabsTrigger>
          <TabsTrigger value="qr-data" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Données QR Code
          </TabsTrigger>
        </TabsList>

        {/* Document Upload Tab */}
        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chargement du Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadedDocument ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Déposez le document ici' : 'Chargez votre document'}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, PNG, JPG, JPEG - Glissez-déposez ou cliquez pour sélectionner
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{uploadedDocument.name}</p>
                      <p className="text-sm text-green-600">
                        {(uploadedDocument.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("qr-data")}
                  >
                    Configurer QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Data Tab */}
        <TabsContent value="qr-data" className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modèles de Données</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Choisir un modèle prédéfini</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un modèle ou créez le vôtre" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultQRTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fields Editor */}
          {qrFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Champs de Données</span>
                  <Button variant="outline" size="sm" onClick={addCustomField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrFields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`field-label-${field.id}`}>Libellé</Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(e) => {
                          setQRFields(prev => prev.map(f => 
                            f.id === field.id ? { ...f, label: e.target.value } : f
                          ));
                        }}
                        placeholder="Nom du champ"
                      />
                    </div>
                    <div className="flex-2">
                      <Label htmlFor={`field-value-${field.id}`}>Valeur</Label>
                      <Input
                        id={`field-value-${field.id}`}
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder="Valeur du champ"
                        type={field.type}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      disabled={qrFields.length <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Raw Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Contenu Brut (Optionnel)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="raw-content">
                  Saisie libre du contenu QR Code
                </Label>
                <Textarea
                  id="raw-content"
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="Saisissez directement le contenu du QR code..."
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  Si rempli, ce contenu remplace les champs structurés ci-dessus
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QR Preview */}
          {qrPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu du QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <img src={qrPreview} alt="QR Code Preview" className="mx-auto" />
                <p className="text-sm text-gray-500 mt-2">
                  Aperçu généré en temps réel
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <div className="space-y-3">
            {uploadedDocument && (data.content || qrFields.some(f => f.value)) && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Configuration prête ! Vous pouvez passer au positionnement du QR code.
                </AlertDescription>
              </Alert>
            )}
            
            {!uploadedDocument && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Chargez d'abord un document dans l'onglet "Charger Document".
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};