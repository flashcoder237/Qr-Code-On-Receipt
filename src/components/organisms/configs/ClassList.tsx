// src/components/organisms/configs/ClassList.tsx - Version améliorée
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { BookOpen, GraduationCap, Trash2, MoreVertical, Calendar, Users, Layers, Copy, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { ClassConfig } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

interface ClassListProps {
  configs: ClassConfig[];
  selectedConfigId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleHidden?: (id: string) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export const ClassList: React.FC<ClassListProps> = ({
  configs,
  selectedConfigId,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleHidden,
  onReorder,
  onMoveUp,
  onMoveDown,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculer si on est dans la moitié supérieure ou inférieure
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';

    setDragOverIndex(index);
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || !onReorder) return;

    // Calculer l'index final basé sur la position de drop
    let finalIndex = dropIndex;
    if (dropPosition === 'after' && dropIndex >= draggedIndex) {
      finalIndex = dropIndex;
    } else if (dropPosition === 'before' && dropIndex <= draggedIndex) {
      finalIndex = dropIndex;
    } else if (dropPosition === 'after') {
      finalIndex = dropIndex + 1;
    }

    if (draggedIndex !== finalIndex && draggedIndex !== finalIndex - 1) {
      onReorder(draggedIndex, finalIndex > draggedIndex ? finalIndex - 1 : finalIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getConfigStats = (config: ClassConfig) => {
    const totalSemesters = config.semesters.length;
    const totalUEs = config.semesters.reduce((sum, sem) => sum + sem.ues.length, 0);
    const totalECs = config.semesters.reduce((sum, sem) => 
      sum + sem.ues.reduce((ueSum, ue) => ueSum + ue.ecs.length, 0), 0
    );
    return { totalSemesters, totalUEs, totalECs };
  };

  const getCycleColor = (cycle: string) => {
    switch (cycle?.toLowerCase()) {
      case 'licence': return 'bg-green-100 text-green-800';
      case 'master': return 'bg-blue-100 text-blue-800';
      case 'doctorat': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>Configurations</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {configs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh)]">
          {configs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-4"
            >
              <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune configuration</h3>
              <p className="text-sm text-gray-500">
                Commencez par créer votre première configuration académique
              </p>
            </motion.div>
          ) : (
            <div className="p-2 space-y-2 w-full">
              <AnimatePresence initial={false}>
                {configs.map((config, index) => {
                  const stats = getConfigStats(config);
                  const isSelected = selectedConfigId === config.id;
                  const isHovered = hoveredId === config.id;
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <motion.div
                      key={config.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="relative"
                      draggable={onReorder !== undefined}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={() => setHoveredId(config.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        marginTop: isDragOver && dropPosition === 'before' && !isDragging ? '40px' : '0',
                        marginBottom: isDragOver && dropPosition === 'after' && !isDragging ? '40px' : '0',
                        transition: 'margin 0.2s ease',
                      }}
                    >
                      {/* Indicateur de drop - ligne avant */}
                      {isDragOver && dropPosition === 'before' && !isDragging && (
                        <div className="absolute -top-5 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-10">
                          <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-blue-500 rounded-full" />
                        </div>
                      )}

                      <div
                        className={`
                          relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${isDragging ? 'opacity-50 scale-95' : ''}
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : isHovered
                              ? 'border-gray-300 bg-gray-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                        onClick={() => onSelect(config.id)}
                      >
                        {/* En-tête de la configuration */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 flex items-start gap-2">
                            {onReorder && (
                              <div
                                className="cursor-grab active:cursor-grabbing pt-1"
                                title="Glisser pour réorganiser"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <GripVertical className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <BookOpen className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                <h4 className={`font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {config.name.substring(0, 15)}...
                                </h4>
                              </div>
                              <p className={`text-xs truncate ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {config.academicYear}
                              </p>
                            </div>
                          </div>
                          
                          {/* Menu d'actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isHovered || isSelected ? 'opacity-100' : ''
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onMoveUp && index > 0 && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveUp(config.id);
                                  }}
                                  className="text-gray-700 focus:text-gray-700"
                                >
                                  <ArrowUp className="h-4 w-4 mr-2" />
                                  Déplacer vers le haut
                                </DropdownMenuItem>
                              )}
                              {onMoveDown && index < configs.length - 1 && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveDown(config.id);
                                  }}
                                  className="text-gray-700 focus:text-gray-700"
                                >
                                  <ArrowDown className="h-4 w-4 mr-2" />
                                  Déplacer vers le bas
                                </DropdownMenuItem>
                              )}
                              {onToggleHidden && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleHidden(config.id);
                                  }}
                                  className="text-amber-600 focus:text-amber-600"
                                >
                                  {config.isHidden ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Afficher
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Masquer
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicate(config.id);
                                }}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(config.id);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Badges informatifs */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {config.filiere && (
                            <Badge variant="outline" className="text-xs">
                              {config.filiere}
                            </Badge>
                          )}
                          {config.cycle && (
                            <Badge className={`text-xs ${getCycleColor(config.cycle)} border-0`}>
                              {config.cycle}
                            </Badge>
                          )}
                          {config.niveau && (
                            <Badge variant="secondary" className="text-xs">
                              Niv. {config.niveau}
                            </Badge>
                          )}
                        </div>

                        {/* Statistiques rapides */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className={`text-center p-2 rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-50'}`}>
                            <Calendar className={`inline-block mr-2 h-3 w-3 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className={`mr-1 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {stats.totalSemesters}
                            </span>
                            <span className={`${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                              Sem.
                            </span>
                          </div>
                          <div className={`text-center p-2 rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-50'}`}>
                            <Layers className={`inline-block mr-2 h-3 w-3 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className={`mr-1 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {stats.totalUEs}
                            </span>
                            <span className={`${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                              UEs
                            </span>
                          </div>
                          <div className={`text-center p-2 rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-50'}`}>
                            <Users className={`inline-block mr-2 h-3 w-3 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className={`mr-1 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {stats.totalECs}
                            </span>
                            <span className={`${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                              ECs
                            </span>
                          </div>
                        </div>

                        {/* Indicateur de sélection */}
                        {isSelected && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-lg"
                          />
                        )}
                      </div>

                      {/* Indicateur de drop - ligne après */}
                      {isDragOver && dropPosition === 'after' && !isDragging && (
                        <div className="absolute -bottom-5 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-10">
                          <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};