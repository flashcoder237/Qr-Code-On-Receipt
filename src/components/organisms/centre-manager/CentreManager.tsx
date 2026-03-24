// src/components/organisms/centre-manager/CentreManager.tsx
// Gestionnaire principal pour les centres de formation professionnelle

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { Centre, createNewCentre } from '@/lib/form-schemas/centre-settings';
import { CentreList } from './CentreList';
import { CentreDetail } from './CentreDetail';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/contexts/ConfirmContext';

export const CentreManager: React.FC = () => {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [centres, setCentres] = useLocalStorage<Centre[]>('training-centres', []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');

  // Créer un nouveau centre
  const handleAddCentre = () => {
    const newCentre = createNewCentre();
    setCentres([...centres, newCentre]);
    setSelectedId(newCentre.id);
    setActiveTab(newCentre.id);

    toast({
      title: "Centre créé",
      description: "Un nouveau centre a été créé avec succès.",
    });
  };

  // Mettre à jour un centre
  const handleUpdateCentre = (updatedCentre: Centre) => {
    setCentres(centres.map(c =>
      c.id === updatedCentre.id ? { ...updatedCentre, updatedAt: new Date().toISOString() } : c
    ));

    toast({
      title: "Centre mis à jour",
      description: "Les modifications ont été enregistrées avec succès.",
    });
  };

  // Supprimer un centre
  const handleDeleteCentre = async (id: string) => {
    const centre = centres.find(c => c.id === id);
    if (!centre) return;

    if (await confirm({ title: "Supprimer le centre", message: `Êtes-vous sûr de vouloir supprimer le centre "${centre.nameFrench}" ?`, variant: "destructive", confirmLabel: "Supprimer" })) {
      setCentres(centres.filter(c => c.id !== id));

      if (selectedId === id) {
        setSelectedId(null);
        setActiveTab('list');
      }

      toast({
        title: "Centre supprimé",
        description: "Le centre a été supprimé avec succès.",
        variant: "error",
      });
    }
  };

  // Dupliquer un centre
  const handleDuplicateCentre = (id: string) => {
    const centreToDuplicate = centres.find(c => c.id === id);
    if (!centreToDuplicate) return;

    const now = new Date().toISOString();
    const duplicatedCentre: Centre = {
      ...centreToDuplicate,
      id: `centre-${Date.now()}`,
      name: `${centreToDuplicate.name} (Copie)`,
      nameFrench: `${centreToDuplicate.nameFrench} (Copie)`,
      nameEnglish: `${centreToDuplicate.nameEnglish} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    setCentres([...centres, duplicatedCentre]);

    toast({
      title: "Centre dupliqué",
      description: "Une copie du centre a été créée avec succès.",
    });
  };

  // Sélectionner un centre
  const handleSelectCentre = (id: string) => {
    setSelectedId(id);
    setActiveTab(id);
  };

  // Retour à la liste
  const handleBackToList = () => {
    setSelectedId(null);
    setActiveTab('list');
  };

  const selectedCentre = centres.find(c => c.id === selectedId);

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <div>
                <CardTitle>Gestion des Centres</CardTitle>
                <CardDescription>
                  Configurez les centres de formation professionnelle
                </CardDescription>
              </div>
            </div>
            {activeTab === 'list' && (
              <Button onClick={handleAddCentre} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau Centre
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden">
              <TabsTrigger value="list">Liste</TabsTrigger>
              {centres.map(centre => (
                <TabsTrigger key={centre.id} value={centre.id}>
                  {centre.nameFrench}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="list" className="mt-0">
              {centres.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun centre configuré</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre premier centre de formation
                  </p>
                  <Button onClick={handleAddCentre} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer un Centre
                  </Button>
                </div>
              ) : (
                <CentreList
                  centres={centres}
                  onSelect={handleSelectCentre}
                  onDelete={handleDeleteCentre}
                  onDuplicate={handleDuplicateCentre}
                />
              )}
            </TabsContent>

            {centres.map(centre => (
              <TabsContent key={centre.id} value={centre.id} className="mt-0">
                {selectedCentre && (
                  <CentreDetail
                    centre={selectedCentre}
                    onUpdate={handleUpdateCentre}
                    onBack={handleBackToList}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentreManager;
