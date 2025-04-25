// ClassList.tsx
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassConfig } from "./types";

interface ClassListProps {
  configs: ClassConfig[];
  selectedConfigId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ClassList: React.FC<ClassListProps> = ({ configs, selectedConfigId, onSelect, onDelete }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <GraduationCap className="mr-2 h-5 w-5 text-blue-600" />
          Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] md:h-[500px] pr-4">
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-2">Aucune classe configurée</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {configs.map((cfg) => (
                <li key={cfg.id}>
                  <Button
                    variant={selectedConfigId === cfg.id ? "default" : "outline"}
                    className={`w-full justify-between group ${
                      selectedConfigId === cfg.id 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "hover:bg-blue-50"
                    }`}
                    onClick={() => onSelect(cfg.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{cfg.name}</span>
                      {cfg.academicYear && (
                        <span className={`text-xs ${selectedConfigId === cfg.id ? "text-blue-100" : "text-gray-500"}`}>
                          {cfg.academicYear}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`opacity-0 group-hover:opacity-100 h-8 w-8 p-0 ${
                        selectedConfigId === cfg.id ? "text-blue-100 hover:text-white hover:bg-blue-700" : "text-red-400 hover:text-red-600 hover:bg-transparent"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(cfg.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};