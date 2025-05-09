// ECItem.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EC } from "./types";

interface ECItemProps {
  ec: EC;
  isEditing: boolean;
  onUpdate: (updated: Partial<EC>) => void;
  onDelete: () => void;
}

export const ECItem: React.FC<ECItemProps> = ({ ec, isEditing, onUpdate, onDelete }) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 bg-gray-50 p-2 rounded">
      <div className="flex-1 w-full">
        <Input
          value={ec.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="text-sm"
          disabled={!isEditing}
        />
      </div>
      {/* Suppression du champ crédits pour les EC */}
      {isEditing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
