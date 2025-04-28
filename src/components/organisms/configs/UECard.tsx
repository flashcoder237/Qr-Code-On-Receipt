import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { ECItem } from "./ECItem";
import { UE, EC } from "./types";
import { calculateUECredits } from "./utils";
import { motion, AnimatePresence } from "framer-motion"

interface UECardProps {
  ue: UE;
  isEditing: boolean;
  onUpdate: (updated: Partial<UE>) => void;
  onDelete: () => void;
  onAddEC: () => void;
  onUpdateEC: (ecId: string, updated: Partial<EC>) => void;
  onDeleteEC: (ecId: string) => void;
}

export const UECard: React.FC<UECardProps> = ({
  ue,
  isEditing,
  onUpdate,
  onDelete,
  onAddEC,
  onUpdateEC,
  onDeleteEC,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border-l-4 border-l-gray-500">
      <CardHeader className="py-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div className="flex flex-col flex-1 w-full cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center mb-1">
              {expanded ? (
                <ChevronDown className="mr-2 h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="mr-2 h-5 w-5 text-gray-600" />
              )}
              <Input
                value={ue.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="font-medium"
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center">
              <Label htmlFor={`code-${ue.id}`} className="mr-2 text-sm">
                Code UE:
              </Label>
              <Input
                id={`code-${ue.id}`}
                type="text"
                value={ue.id}
                onChange={(e) => onUpdate({ id: e.target.value })}
                className="w-32"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="flex items-center">
              <Label htmlFor={`credits-${ue.id}`} className="mr-2 text-sm">
                Crédits UE:
              </Label>
              <Input
                id={`credits-${ue.id}`}
                type="number"
                value={ue.credits}
                onChange={(e) => onUpdate({ credits: Number(e.target.value) })}
                className="w-20"
                min={0}
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
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Total ECs: {calculateUECredits(ue)} crédits
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="py-3">
              <div className="flex justify-between items-center mb-3">
                <h6 className="text-sm font-medium">
                  Éléments Constitutifs (EC)
                </h6>
            {isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddEC}
                className="bg-transparent border-none p-0"
                aria-label="Add EC"
                variant="ghost"
              >
                <PlusCircle className="mr-1 h-3 w-3" />
                Ajouter EC
              </motion.button>
            )}
              </div>
              {ue.ecs.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Aucun EC ajouté à cette UE
                </p>
              ) : (
                <div className="space-y-2">
                  {ue.ecs.map((ec) => (
                    <ECItem
                      key={ec.id}
                      ec={ec}
                      isEditing={isEditing}
                      onUpdate={(updated) => onUpdateEC(ec.id, updated)}
                      onDelete={() => onDeleteEC(ec.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
