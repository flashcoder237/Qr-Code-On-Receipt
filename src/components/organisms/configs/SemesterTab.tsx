// SemesterTab.tsx
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { UECard } from "./UECard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Semester, UE, EC } from "./types";

interface SemesterTabProps {
  semester: Semester;
  isEditing: boolean;
  onUpdate: (updated: Partial<Semester>) => void;
  onDelete: () => void;
  onAddUE: () => void;
  onUpdateUE: (ueId: string, updated: Partial<UE>) => void;
  onDeleteUE: (ueId: string) => void;
  onAddEC: (ueId: string) => void;
  onUpdateEC: (ueId: string, ecId: string, updated: Partial<EC>) => void;
  onDeleteEC: (ueId: string, ecId: string) => void;
}

export const SemesterTab: React.FC<SemesterTabProps> = ({
  semester,
  isEditing,
  onUpdate,
  onDelete,
  onAddUE,
  onUpdateUE,
  onDeleteUE,
  onAddEC,
  onUpdateEC,
  onDeleteEC,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex-1 w-full">
            <Input
              value={semester.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="text-lg font-medium"
              disabled={!isEditing}
            />
          </div>
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Unités d'Enseignement (UE)</h4>
          {isEditing && (
            <Button 
              onClick={onAddUE} 
              size="sm"
              variant="outline"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une UE
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px] md:h-[400px] pr-4">
          {semester.ues.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Aucune UE dans ce semestre</p>
              {isEditing && (
                <Button 
                  onClick={onAddUE} 
                  className="mt-2"
                  variant="outline"
                  size="sm"
                >
                  Ajouter une UE
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {semester.ues.map((ue) => (
                <UECard
                  key={ue.id}
                  ue={ue}
                  isEditing={isEditing}
                  onUpdate={(updated) => onUpdateUE(ue.id, updated)}
                  onDelete={() => onDeleteUE(ue.id)}
                  onAddEC={() => onAddEC(ue.id)}
                  onUpdateEC={(ecId, updated) => onUpdateEC(ue.id, ecId, updated)}
                  onDeleteEC={(ecId) => onDeleteEC(ue.id, ecId)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};