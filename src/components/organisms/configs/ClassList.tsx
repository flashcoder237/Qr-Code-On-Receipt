import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { BookOpen, GraduationCap, Trash2 } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { ClassConfig } from "./types";
import { motion, AnimatePresence } from "framer-motion";

interface ClassListProps {
  configs: ClassConfig[];
  selectedConfigId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ClassList: React.FC<ClassListProps> = ({
  configs,
  selectedConfigId,
  onSelect,
  onDelete,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <GraduationCap className="mr-2 h-5 w-5 text-gray-600" />
          Classes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          {configs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 text-gray-500"
            >
              <BookOpen className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-2">Aucune classe configurée</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {configs.map((cfg) => (
                  <motion.div
                    key={cfg.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant={selectedConfigId === cfg.id ? "default" : "outline"}
                      className={`w-full justify-between group relative ${
                        selectedConfigId === cfg.id
                          ? "bg-gray-600 hover:bg-gray-700 text-white"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => onSelect(cfg.id)}
                    >
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="font-medium truncate max-w-[200px]">
                          {cfg.name}
                        </span>
                        {cfg.academicYear && (
                          <span
                            className={`text-xs truncate max-w-[200px] ${
                              selectedConfigId === cfg.id
                                ? "text-gray-100"
                                : "text-gray-500"
                            }`}
                          >
                            {cfg.academicYear}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`opacity-0 group-hover:opacity-100 absolute right-2 h-8 w-8 p-0 transition-opacity ${
                          selectedConfigId === cfg.id
                            ? "text-gray-100 hover:text-white hover:bg-gray-700"
                            : "text-red-400 hover:text-red-600 hover:bg-transparent"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(cfg.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
