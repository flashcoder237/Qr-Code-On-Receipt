import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Alert } from "../../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import {
  PlusCircle,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ClassConfig, Semester, UE, EC } from "./types";

interface ClassDetailProps {
  config: ClassConfig | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updated: Partial<ClassConfig>) => void;
  onUpdateSemester: (id: string, updated: Partial<Semester>) => void;
  onAddUE: (semesterId: string) => void;
  onUpdateUE: (semesterId: string, ueId: string, updated: Partial<UE>) => void;
  onDeleteUE: (semesterId: string, ueId: string) => void;
  onAddEC: (semesterId: string, ueId: string) => void;
  onUpdateEC: (
    semesterId: string,
    ueId: string,
    ecId: string,
    updated: Partial<EC>
  ) => void;
  onDeleteEC: (semesterId: string, ueId: string, ecId: string) => void;
  onAddNewConfig: () => void;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  config,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onUpdateSemester,
  onAddUE,
  onUpdateUE,
  onDeleteUE,
  onAddEC,
  onUpdateEC,
  onDeleteEC,
  onAddNewConfig,
}) => {
  const [expandedUEs, setExpandedUEs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("0");
  const [localState, setLocalState] = useState({
    name: "",
    academicYear: "",
    filiere: "",
    niveau: "",
    cycle: "",
    option: "",
  });

  // Initialize local state when config changes
  useEffect(() => {
    if (config) {
      setLocalState({
        name: config.name,
        academicYear: config.academicYear,
        filiere: config.filiere || "",
        niveau: config.niveau || "",
        cycle: config.cycle || "",
        option: config.option || "",
      });
    }
  }, [config]);

  // Update handler with automatic semester management
  const handleUpdate = useCallback((field: string, value: string) => {
    setLocalState(prev => ({ ...prev, [field]: value }));
    
    // If updating niveau, automatically update semester numbers
    if (field === 'niveau') {
      const niveauNumber = parseInt(value) || 0;
      if (niveauNumber > 0) {
        const semester1Id = `semester-${(niveauNumber * 2) - 1}`;
        const semester2Id = `semester-${niveauNumber * 2}`;
        
        const updatedSemesters: Semester[] = [
          {
            id: semester1Id,
            name: `Semestre ${(niveauNumber * 2) - 1}`,
            ues: [],
          },
          {
            id: semester2Id,
            name: `Semestre ${niveauNumber * 2}`,
            ues: [],
          },
        ];
        
        onUpdate({ 
          [field]: value,
          semesters: updatedSemesters
        });
      } else {
        onUpdate({ [field]: value });
      }
    } else {
      onUpdate({ [field]: value });
    }
  }, [onUpdate]);

  const toggleUE = useCallback((ueId: string) => {
    setExpandedUEs((prev) => {
      const next = new Set(prev);
      if (next.has(ueId)) {
        next.delete(ueId);
      } else {
        next.add(ueId);
      }
      return next;
    });
  }, []);

  if (!config) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] p-8 text-center"
      >
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Aucune configuration sélectionnée
        </h3>
        <p className="text-gray-500 mb-6">
          Sélectionnez une configuration existante ou créez-en une nouvelle
        </p>
        <Button onClick={onAddNewConfig}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Configuration
        </Button>
      </motion.div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-4 flex-1">
          <CardTitle className="flex items-center space-x-4">
            {isEditing ? (
              <Input
                value={localState.name}
                onChange={(e) => handleUpdate('name', e.target.value)}
                className="text-xl font-bold"
                placeholder="Nom de la classe"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{config.name}</span>
            )}
          </CardTitle>
          
          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Année Académique */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Année Académique</label>
              {isEditing ? (
                <Input
                  value={localState.academicYear}
                  onChange={(e) => handleUpdate('academicYear', e.target.value)}
                  placeholder="Ex: 2023-2024"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.academicYear}</p>
              )}
            </div>

            {/* Filière */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filière</label>
              {isEditing ? (
                <Input
                  value={localState.filiere}
                  onChange={(e) => handleUpdate('filiere', e.target.value)}
                  placeholder="Ex: Informatique"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.filiere}</p>
              )}
            </div>

            {/* Niveau */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              {isEditing ? (
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={localState.niveau}
                  onChange={(e) => handleUpdate('niveau', e.target.value)}
                  placeholder="Ex: 1"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.niveau}</p>
              )}
            </div>

            {/* Cycle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cycle</label>
              {isEditing ? (
                <Input
                  value={localState.cycle}
                  onChange={(e) => handleUpdate('cycle', e.target.value)}
                  placeholder="Ex: Licence"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.cycle}</p>
              )}
            </div>

            {/* Option */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Option</label>
              {isEditing ? (
                <Input
                  value={localState.option}
                  onChange={(e) => handleUpdate('option', e.target.value)}
                  placeholder="Ex: Développement"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-gray-500">{config.option}</p>
              )}
            </div>
          </div>
        </div>

        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={isEditing ? onSave : onEdit}
          className="ml-4"
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          ) : (
            <>
              <Edit2 className="mr-2 h-4 w-4" />
              Modifier
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 w-full flex-wrap">
            {config.semesters.map((semester, index) => (
              <TabsTrigger key={semester.id} value={index.toString()}>
                {semester.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[calc(100vh-20rem)]">
            {config.semesters.map((semester, semesterIndex) => (
              <TabsContent
                key={semester.id}
                value={semesterIndex.toString()}
                className="space-y-4 mt-0"
              >
                <AnimatePresence initial={false}>
                  {semester.ues.map((ue) => (
                    <motion.div
                      key={ue.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card>
                        <CardHeader
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleUE(ue.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {expandedUEs.has(ue.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {isEditing ? (
                                <Input
                                  value={ue.name}
                                  onChange={(e) =>
                                    onUpdateUE(semester.id, ue.id, {
                                      name: e.target.value,
                                    })
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-64"
                                />
                              ) : (
                                <span className="font-medium">{ue.name}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {isEditing && (
                                <Input
                                  type="number"
                                  value={ue.credits}
                                  onChange={(e) =>
                                    onUpdateUE(semester.id, ue.id, {
                                      credits: Number(e.target.value),
                                    })
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20"
                                />
                              )}
                              <span className="text-sm text-gray-500">
                                {ue.credits} crédits
                              </span>
                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteUE(semester.id, ue.id);
                                  }}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <AnimatePresence>
                          {expandedUEs.has(ue.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  {ue.ecs.map((ec) => (
                                    <motion.div
                                      key={ec.id}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                    >
                                      {isEditing ? (
                                        <Input
                                          value={ec.name}
                                          onChange={(e) =>
                                            onUpdateEC(semester.id, ue.id, ec.id, {
                                              name: e.target.value,
                                            })
                                          }
                                          className="w-64"
                                        />
                                      ) : (
                                        <span>{ec.name}</span>
                                      )}
                                      <div className="flex items-center space-x-2">
                                        {isEditing && (
                                          <Input
                                            type="number"
                                            value={ec.credits}
                                            onChange={(e) =>
                                              onUpdateEC(
                                                semester.id,
                                                ue.id,
                                                ec.id,
                                                {
                                                  credits: Number(e.target.value),
                                                }
                                              )
                                            }
                                            className="w-20"
                                          />
                                        )}
                                        <span className="text-sm text-gray-500">
                                          {ec.credits} crédits
                                        </span>
                                        {isEditing && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              onDeleteEC(semester.id, ue.id, ec.id)
                                            }
                                            className="text-red-500 hover:text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </motion.div>
                                  ))}
                                  {isEditing && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onAddEC(semester.id, ue.id)}
                                      className="w-full mt-2"
                                    >
                                      <PlusCircle className="h-4 w-4 mr-2" />
                                      Ajouter un EC
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => onAddUE(semester.id)}
                    className="w-full mt-4"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter une UE
                  </Button>
                )}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};
