// src/components/organisms/academic-config/AcademicConfigManager.tsx - Version améliorée
import React, { useState, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, AlertCircle, Search, Filter, BookOpen, 
  Users, Calendar, GraduationCap, ChevronRight, 
  BarChart3, TrendingUp, Database, Settings2 
} from "lucide-react";
import { ClassList } from "@/components/organisms/configs/ClassList";
import { ClassDetail } from "@/components/organisms/configs/ClassDetail";
import { ClassConfig, Semester, UE, EC } from "@/components/organisms/configs/types";
import { LOCAL_STORAGE_KEY, getDefaultAcademicYear, isConfigDuplicate } from "@/components/organisms/configs/utils";
import { ImportExportExcel } from "@/components/organisms/configs/import-export";
import { motion, AnimatePresence } from "framer-motion";

export const AcademicConfigManager: React.FC = () => {
  const [configs, setConfigs] = useLocalStorage<ClassConfig[]>(LOCAL_STORAGE_KEY, []);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterBy, setFilterBy] = useState<"all" | "year" | "cycle">("all");
  const [activeTab, setActiveTab] = useState<"overview" | "configuration">("overview");

  const selectedConfig = configs.find((cfg) => cfg.id === selectedConfigId);

  // Statistiques calculées
  const statistics = useMemo(() => {
    const totalConfigs = configs.length;
    const totalSemesters = configs.reduce((sum, config) => sum + config.semesters.length, 0);
    const totalUEs = configs.reduce((sum, config) => 
      sum + config.semesters.reduce((semSum, sem) => semSum + sem.ues.length, 0), 0);
    const totalECs = configs.reduce((sum, config) => 
      sum + config.semesters.reduce((semSum, sem) => 
        semSum + sem.ues.reduce((ueSum, ue) => ueSum + ue.ecs.length, 0), 0), 0);
    
    const academicYears = [...new Set(configs.map(c => c.academicYear))];
    const cycles = [...new Set(configs.map(c => c.cycle).filter(Boolean))];
    
    return {
      totalConfigs,
      totalSemesters,
      totalUEs,
      totalECs,
      academicYears,
      cycles
    };
  }, [configs]);

  // Filtrage des configurations
  const filteredConfigs = useMemo(() => {
    return configs.filter(config => {
      const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           config.academicYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (config.filiere || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === "all") return matchesSearch;
      if (filterBy === "year") return matchesSearch && config.academicYear === getDefaultAcademicYear();
      if (filterBy === "cycle") return matchesSearch && config.cycle;
      
      return matchesSearch;
    });
  }, [configs, searchTerm, filterBy]);

  const addNewConfig = () => {
    const defaultName = `Configuration ${configs.length + 1}`;
    const defaultYear = getDefaultAcademicYear();

    const newConfig: ClassConfig = {
      id: Date.now().toString(),
      name: defaultName,
      academicYear: defaultYear,
      filiere: "",
      niveau: "",
      cycle: "",
      option: "",
      semesters: [],
    };
    
    setConfigs([...configs, newConfig]);
    setSelectedConfigId(newConfig.id);
    setIsEditing(true);
    setError(null);
    setActiveTab("configuration");
  };

  const updateConfig = (id: string, updated: Partial<ClassConfig>) => {
    if (updated.name !== undefined && updated.name.trim() === "") {
      setError("Le nom de la classe est obligatoire");
      return;
    }
    
    if (updated.academicYear !== undefined && updated.academicYear.trim() === "") {
      setError("L'année académique est obligatoire");
      return;
    }

    if ((updated.name !== undefined || updated.academicYear !== undefined)) {
      const currentConfig = configs.find(cfg => cfg.id === id);
      if (!currentConfig) return;
      
      const newName = updated.name !== undefined ? updated.name : currentConfig.name;
      const newYear = updated.academicYear !== undefined ? updated.academicYear : currentConfig.academicYear;
      
      if (isConfigDuplicate(configs, newName, newYear, id)) {
        setError("Une configuration avec ce nom et cette année académique existe déjà");
        return;
      }
    }

    setError(null);
    setConfigs(
      configs.map((cfg) => (cfg.id === id ? { ...cfg, ...updated } : cfg))
    );
  };

  const saveConfig = () => {
    if (!selectedConfig) return;
    
    if (!selectedConfig.name.trim()) {
      setError("Le nom de la classe est obligatoire");
      return;
    }
    
    if (!selectedConfig.academicYear.trim()) {
      setError("L'année académique est obligatoire");
      return;
    }
    
    if (isConfigDuplicate(configs, selectedConfig.name, selectedConfig.academicYear, selectedConfig.id)) {
      setError("Une configuration avec ce nom et cette année académique existe déjà");
      return;
    }
    
    setError(null);
    setIsEditing(false);
    setSuccess("Configuration sauvegardée avec succès");
    setTimeout(() => setSuccess(null), 3000);
  };

  const deleteConfig = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      setConfigs(configs.filter((cfg) => cfg.id !== id));
      if (selectedConfigId === id) setSelectedConfigId(null);
      setError(null);
      setIsEditing(false);
    }
  };

  // Gestion des semestres, UEs et ECs (fonctions existantes maintenues)
  const addSemester = () => {
    if (!selectedConfigId) return;
    const currentConfig = configs.find(cfg => cfg.id === selectedConfigId);
    if (!currentConfig) return;

    const semesterNumbers = currentConfig.semesters
      .map(sem => {
        const match = sem.name.match(/^Semestre (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
    const maxNumber = semesterNumbers.length > 0 ? Math.max(...semesterNumbers) : 0;
    const nextNumber = maxNumber + 1;

    const newSemester: Semester = {
      id: Date.now().toString(),
      name: `Semestre ${nextNumber}`,
      ues: [],
    };

    setConfigs(
      configs.map((cfg) =>
        cfg.id === selectedConfigId
          ? { ...cfg, semesters: [...cfg.semesters, newSemester] }
          : cfg
      )
    );
  };

  const updateSemester = (semesterId: string, updated: Partial<Semester>) => {
    if (!selectedConfigId) return;
    setConfigs(
      configs.map((cfg) => {
        if (cfg.id !== selectedConfigId) return cfg;
        return {
          ...cfg,
          semesters: cfg.semesters.map((sem) =>
            sem.id === semesterId ? { ...sem, ...updated } : sem
          ),
        };
      })
    );
  };

  const deleteSemester = (semesterId: string) => {
    if (!selectedConfigId) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce semestre ?")) {
      setConfigs(
        configs.map((cfg) => {
          if (cfg.id !== selectedConfigId) return cfg;
          return {
            ...cfg,
            semesters: cfg.semesters.filter((sem) => sem.id !== semesterId),
          };
        })
      );
    }
  };

  const addUE = (semesterId: string) => {
    if (!selectedConfigId) return;
    const newUE: UE = {
      id: Date.now().toString(),
      name: "Nouvelle UE",
      code: "",
      credits: 0,
      ecs: [],
    };
    
    setConfigs(
      configs.map((cfg) => {
        if (cfg.id !== selectedConfigId) return cfg;
        return {
          ...cfg,
          semesters: cfg.semesters.map((sem) =>
            sem.id === semesterId
              ? { ...sem, ues: [...sem.ues, newUE] }
              : sem
          ),
        };
      })
    );
  };

  const updateUE = (semesterId: string, ueId: string, updated: Partial<UE>) => {
    if (!selectedConfigId) return;
    setConfigs(
      configs.map((cfg) => {
        if (cfg.id !== selectedConfigId) return cfg;
        return {
          ...cfg,
          semesters: cfg.semesters.map((sem) => {
            if (sem.id !== semesterId) return sem;
            return {
              ...sem,
              ues: sem.ues.map((ue) =>
                ue.id === ueId ? { ...ue, ...updated } : ue
              ),
            };
          }),
        };
      })
    );
  };

  const deleteUE = (semesterId: string, ueId: string) => {
    if (!selectedConfigId) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette UE ?")) {
      setConfigs(
        configs.map((cfg) => {
          if (cfg.id !== selectedConfigId) return cfg;
          return {
            ...cfg,
            semesters: cfg.semesters.map((sem) => {
              if (sem.id !== semesterId) return sem;
              return {
                ...sem,
                ues: sem.ues.filter((ue) => ue.id !== ueId),
              };
            }),
          };
        })
      );
    }
  };

  const addEC = (semesterId: string, ueId: string) => {
    if (!selectedConfigId) return;
    const newEC: EC = {
      id: Date.now().toString(),
      name: "Nouvel EC",
    };
    
    setConfigs(
      configs.map((cfg) => {
        if (cfg.id !== selectedConfigId) return cfg;
        return {
          ...cfg,
          semesters: cfg.semesters.map((sem) => {
            if (sem.id !== semesterId) return sem;
            return {
              ...sem,
              ues: sem.ues.map((ue) =>
                ue.id === ueId ? { ...ue, ecs: [...ue.ecs, newEC] } : ue
              ),
            };
          }),
        };
      })
    );
  };

  const updateEC = (semesterId: string, ueId: string, ecId: string, updated: Partial<EC>) => {
    if (!selectedConfigId) return;
    setConfigs(
      configs.map((cfg) => {
        if (cfg.id !== selectedConfigId) return cfg;
        return {
          ...cfg,
          semesters: cfg.semesters.map((sem) => {
            if (sem.id !== semesterId) return sem;
            return {
              ...sem,
              ues: sem.ues.map((ue) => {
                if (ue.id !== ueId) return ue;
                return {
                  ...ue,
                  ecs: ue.ecs.map((ec) =>
                    ec.id === ecId ? { ...ec, ...updated } : ec
                  ),
                };
              }),
            };
          }),
        };
      })
    );
  };

  const deleteEC = (semesterId: string, ueId: string, ecId: string) => {
    if (!selectedConfigId) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet EC ?")) {
      setConfigs(
        configs.map((cfg) => {
          if (cfg.id !== selectedConfigId) return cfg;
          return {
            ...cfg,
            semesters: cfg.semesters.map((sem) => {
              if (sem.id !== semesterId) return sem;
              return {
                ...sem,
                ues: sem.ues.map((ue) => {
                  if (ue.id !== ueId) return ue;
                  return {
                    ...ue,
                    ecs: ue.ecs.filter((ec) => ec.id !== ecId),
                  };
                }),
              };
            }),
          };
        })
      );
    }
  };

  const handleSelectConfig = (id: string) => {
    setSelectedConfigId(id);
    setError(null);
    setIsEditing(false);
    setActiveTab("configuration");
  };

  const duplicateConfig = (configId: string) => {
    const originalConfig = configs.find(cfg => cfg.id === configId);
    if (!originalConfig) return;

    // Générer un nom unique pour la copie
    let duplicateName = `${originalConfig.name} - Copie`;
    let counter = 1;
    
    while (configs.some(cfg => cfg.name === duplicateName && cfg.academicYear === originalConfig.academicYear)) {
      duplicateName = `${originalConfig.name} - Copie ${counter}`;
      counter++;
    }

    // Créer une copie profonde de la configuration
    const duplicatedConfig: ClassConfig = {
      ...originalConfig,
      id: Date.now().toString(),
      name: duplicateName,
      // Copier en profondeur les semestres et leurs UEs/ECs
      semesters: originalConfig.semesters.map(semester => ({
        ...semester,
        id: `${Date.now()}-sem-${Math.random().toString(36).substr(2, 9)}`,
        ues: semester.ues.map(ue => ({
          ...ue,
          id: `${Date.now()}-ue-${Math.random().toString(36).substr(2, 9)}`,
          ecs: ue.ecs.map(ec => ({
            ...ec,
            id: `${Date.now()}-ec-${Math.random().toString(36).substr(2, 9)}`
          }))
        }))
      })),
      // Copier les semestres fusionnés s'ils existent
      mergedSemesters: originalConfig.mergedSemesters?.map(merged => ({
        ...merged,
        id: `merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isActive: false // Désactiver par défaut pour éviter les conflits
      }))
    };

    setConfigs([...configs, duplicatedConfig]);
    setSelectedConfigId(duplicatedConfig.id);
    setIsEditing(true);
    setError(null);
    setActiveTab("configuration");
    setSuccess(`Configuration "${duplicateName}" créée avec succès`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleImportConfigs = (importedConfigs: ClassConfig[]) => {
    const duplicates: string[] = [];
    importedConfigs.forEach(imported => {
      const existingConfig = configs.find(cfg => 
        cfg.name === imported.name && 
        cfg.academicYear === imported.academicYear &&
        cfg.id !== imported.id
      );
      
      if (existingConfig) {
        duplicates.push(`${imported.name} (${imported.academicYear})`);
      }
    });
    
    if (duplicates.length > 0) {
      setError(`Configurations en double trouvées: ${duplicates.join(", ")}. Ces configurations n'ont pas été importées.`);
      
      const uniqueImports = importedConfigs.filter(imported => 
        !configs.some(cfg => 
          cfg.name === imported.name && 
          cfg.academicYear === imported.academicYear
        )
      );
      
      if (uniqueImports.length > 0) {
        setConfigs([...configs, ...uniqueImports]);
        setSuccess(`${uniqueImports.length} configuration(s) importée(s) avec succès.`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } else {
      setConfigs([...configs, ...importedConfigs]);
      setSuccess(`${importedConfigs.length} configuration(s) importée(s) avec succès.`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "default" }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden"
    >
      <Card className={`${color === "primary" ? "border-blue-200 bg-blue-50" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${color === "primary" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* En-tête */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-600" />
                Configuration Académique
              </h1>
              <p className="text-gray-600 mt-2">Gérez vos structures académiques et organisez vos formations</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={addNewConfig} className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle Configuration
              </Button>
              <ImportExportExcel 
                configs={configs}
                onImport={handleImportConfigs}
              />
            </div>
          </div>

          {/* Messages d'état */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Onglets principaux */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="configuration" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={BookOpen}
                  title="Configurations"
                  value={statistics.totalConfigs}
                  subtitle="Formations configurées"
                  color="primary"
                />
                <StatCard
                  icon={Calendar}
                  title="Semestres"
                  value={statistics.totalSemesters}
                  subtitle="Périodes d'enseignement"
                />
                <StatCard
                  icon={GraduationCap}
                  title="Unités d'Enseignement"
                  value={statistics.totalUEs}
                  subtitle="Matières principales"
                />
                <StatCard
                  icon={Users}
                  title="Éléments Constitutifs"
                  value={statistics.totalECs}
                  subtitle="Modules de cours"
                />
              </div>

              {/* Aperçu des configurations récentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Configurations Récentes
                  </CardTitle>
                  <CardDescription>
                    Vos dernières formations configurées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {configs.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune configuration</h3>
                      <p className="mt-2 text-gray-500">Commencez par créer votre première configuration académique.</p>
                      <Button onClick={addNewConfig} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Créer une configuration
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {configs.slice(0, 5).map((config) => (
                        <motion.div
                          key={config.id}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleSelectConfig(config.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{config.name}</h4>
                              <div className="flex gap-4 mt-1">
                                <span className="text-sm text-gray-500">{config.academicYear}</span>
                                {config.filiere && (
                                  <Badge variant="secondary" className="text-xs">
                                    {config.filiere}
                                  </Badge>
                                )}
                                {config.niveau && (
                                  <Badge variant="outline" className="text-xs">
                                    Niveau {config.niveau}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{config.semesters.length} semestre(s)</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations sur les années académiques et cycles */}
              {statistics.academicYears.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Années Académiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {statistics.academicYears.map((year) => (
                          <div key={year} className="flex justify-between items-center">
                            <span>{year}</span>
                            <Badge variant="outline">
                              {configs.filter(c => c.academicYear === year).length} config(s)
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cycles de Formation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {statistics.cycles.map((cycle) => (
                          <div key={cycle} className="flex justify-between items-center">
                            <span>{cycle}</span>
                            <Badge variant="outline">
                              {configs.filter(c => c.cycle === cycle).length} config(s)
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="configuration" className="space-y-6">
              {/* Barre de recherche et filtres */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher une configuration..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={filterBy === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterBy("all")}
                      >
                        Toutes
                      </Button>
                      <Button
                        variant={filterBy === "year" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterBy("year")}
                      >
                        Année courante
                      </Button>
                      <Button
                        variant={filterBy === "cycle" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterBy("cycle")}
                      >
                        Avec cycle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
                {/* Liste des configurations */}
                <div className="xl:col-span-2">
                  <ClassList 
                    configs={filteredConfigs}
                    selectedConfigId={selectedConfigId}
                    onSelect={handleSelectConfig}
                    onDelete={deleteConfig}
                    onDuplicate={duplicateConfig}
                  />
                </div>

                {/* Détails de la configuration */}
                <div className="xl:col-span-5">
                  <ClassDetail 
                    config={selectedConfig}
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onSave={saveConfig}
                    onUpdate={(updated) => selectedConfigId && updateConfig(selectedConfigId, updated)}
                    onAddSemester={addSemester}
                    onUpdateSemester={updateSemester}
                    onDeleteSemester={deleteSemester}
                    onAddUE={addUE}
                    onUpdateUE={updateUE}
                    onDeleteUE={deleteUE}
                    onAddEC={addEC}
                    onUpdateEC={updateEC}
                    onDeleteEC={deleteEC}
                    onAddNewConfig={addNewConfig}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};