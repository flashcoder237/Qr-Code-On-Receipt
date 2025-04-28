// ClassDetail.tsx
import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, BookOpen, BookmarkPlus, PlusCircle, GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SemesterTab } from "./SemesterTab";
import { ClassConfig, Semester, UE, EC } from "./types";
import { calculateSemesterCredits } from "./utils";

interface ClassDetailProps {
  config: ClassConfig | null;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updated: Partial<ClassConfig>) => void;
  onAddSemester: () => void;
  onUpdateSemester: (semesterId: string, updated: Partial<Semester>) => void;
  onDeleteSemester: (semesterId: string) => void;
  onAddUE: (semesterId: string) => void;
  onUpdateUE: (semesterId: string, ueId: string, updated: Partial<UE>) => void;
  onDeleteUE: (semesterId: string, ueId: string) => void;
  onAddEC: (semesterId: string, ueId: string) => void;
  onUpdateEC: (semesterId: string, ueId: string, ecId: string, updated: Partial<EC>) => void;
  onDeleteEC: (semesterId: string, ueId: string, ecId: string) => void;
  onAddNewConfig: () => void;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  config,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onAddSemester,
  onUpdateSemester,
  onDeleteSemester,
  onAddUE,
  onUpdateUE,
  onDeleteUE,
  onAddEC,
  onUpdateEC,
  onDeleteEC,
  onAddNewConfig,
}) => {
  if (!config) {
    return (
      <Card className="h-full flex items-center justify-center p-6 md:p-12">
        <div className="text-center">
          <GraduationCap className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-xl font-medium text-gray-700">
            Aucune classe sélectionnée
          </h3>
          <p className="mt-2 text-gray-500 max-w-md">
            Sélectionnez une classe existante ou créez-en une nouvelle pour commencer
            la configuration.
          </p>
          <Button onClick={onAddNewConfig} className="mt-6">
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer une nouvelle classe
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{config.name}</CardTitle>
            {config.academicYear && (
              <CardDescription>
                <div className="flex items-center mt-1">
                  <Calendar className="mr-1 h-4 w-4 text-gray-500" />
                  {config.academicYear}
                </div>
              </CardDescription>
            )}
          </div>
          {isEditing ? (
            <Button 
              onClick={onSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Enregistrer
            </Button>
          ) : (
            <Button 
              onClick={onEdit}
              variant="outline"
            >
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="className" className="text-sm font-medium">
              Nom de la classe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="className"
              value={config.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="mt-1"
              required
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="academicYear" className="text-sm font-medium">
              Année académique <span className="text-red-500">*</span>
            </Label>
            <Input
              id="academicYear"
              value={config.academicYear}
              onChange={(e) => onUpdate({ academicYear: e.target.value })}
              className="mt-1"
              placeholder="ex: 2024-2025"
              required
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="cycle" className="text-sm font-medium">
              Cycle
            </Label>
            <Input
              id="cycle"
              value={config.cycle || ""}
              onChange={(e) => onUpdate({ cycle: e.target.value })}
              className="mt-1"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="niveau" className="text-sm font-medium">
              Niveau
            </Label>
            <Input
              id="niveau"
              value={config.niveau || ""}
              onChange={(e) => onUpdate({ niveau: e.target.value })}
              className="mt-1"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="filiere" className="text-sm font-medium">
              Filière
            </Label>
            <Input
              id="filiere"
              value={config.filiere || ""}
              onChange={(e) => onUpdate({ filiere: e.target.value })}
              className="mt-1"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="option" className="text-sm font-medium">
              Option
            </Label>
            <Input
              id="option"
              value={config.option || ""}
              onChange={(e) => onUpdate({ option: e.target.value })}
              className="mt-1"
              disabled={!isEditing}
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-gray-600" />
            Semestres
          </h3>
          {isEditing && (
            <Button onClick={onAddSemester} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un semestre
            </Button>
          )}
        </div>

        {config.semesters.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BookmarkPlus className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">Aucun semestre ajouté</p>
            {isEditing && (
              <Button 
                onClick={onAddSemester} 
                className="mt-4"
                variant="outline"
              >
                Ajouter un premier semestre
              </Button>
            )}
          </div>
        ) : (
          <Tabs defaultValue={config.semesters[0]?.id}>
            <TabsList className="mb-4 grid h-auto grid-cols-3 content-stretch gap-2 overflow-x-auto  max-w-3xl">
              {config.semesters.map((sem) => (
                <TabsTrigger key={sem.id} value={sem.id} className="min-w-fit">
                  {sem.name}
                  <Badge variant="outline" className="ml-2">
                    {calculateSemesterCredits(sem)} crédits
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {config.semesters.map((sem) => (
              <TabsContent key={sem.id} value={sem.id}>
                <SemesterTab
                  semester={sem}
                  isEditing={isEditing}
                  onUpdate={(updated) => onUpdateSemester(sem.id, updated)}
                  onDelete={() => onDeleteSemester(sem.id)}
                  onAddUE={() => onAddUE(sem.id)}
                  onUpdateUE={(ueId, updated) => onUpdateUE(sem.id, ueId, updated)}
                  onDeleteUE={(ueId) => onDeleteUE(sem.id, ueId)}
                  onAddEC={(ueId) => onAddEC(sem.id, ueId)}
                  onUpdateEC={(ueId, ecId, updated) => onUpdateEC(sem.id, ueId, ecId, updated)}
                  onDeleteEC={(ueId, ecId) => onDeleteEC(sem.id, ueId, ecId)}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
