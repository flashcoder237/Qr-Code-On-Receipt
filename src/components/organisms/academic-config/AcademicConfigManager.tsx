// AcademicConfigManager.tsx
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, AlertCircle } from "lucide-react";
import { ClassList } from "@/components/organisms/configs/ClassList";
import { ClassDetail } from "@/components/organisms/configs/ClassDetail";
import { ClassConfig, Semester, UE, EC } from "@/components/organisms/configs/types";
import { LOCAL_STORAGE_KEY, getDefaultAcademicYear, isConfigDuplicate } from "@/components/organisms/configs/utils";
import { ImportExportExcel } from "@/components/organisms/configs/import-export";

export const AcademicConfigManager: React.FC = () => {
  const [configs, setConfigs] = useLocalStorage<ClassConfig[]>(LOCAL_STORAGE_KEY, []);
  const [selectedConfigId, setSelectedConfigId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [success, setSuccess] = React.useState<string | null>(null);
 
  const selectedConfig = configs.find((cfg) => cfg.id === selectedConfigId);

  const addNewConfig = () => {
    const defaultName = "Config ClassX";
    const defaultYear = getDefaultAcademicYear();

    const newConfig: ClassConfig = {
      id: Date.now().toString(),
      name: defaultName,
      academicYear: defaultYear,
      semesters: [],
    };
    
    setConfigs([...configs, newConfig]);
    setSelectedConfigId(newConfig.id);
    setIsEditing(true);
    setError(null);
  };

  const updateConfig = (id: string, updated: Partial<ClassConfig>) => {
    // Validation pour les champs obligatoires
    if (updated.name !== undefined && updated.name.trim() === "") {
      setError("Le nom de la classe est obligatoire");
      return;
    }
    
    if (updated.academicYear !== undefined && updated.academicYear.trim() === "") {
      setError("L'année académique est obligatoire");
      return;
    }

    // Si on met à jour le nom ou l'année, vérifier les doublons
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
    
    // Vérification des champs obligatoires
    if (!selectedConfig.name.trim()) {
      setError("Le nom de la classe est obligatoire");
      return;
    }
    
    if (!selectedConfig.academicYear.trim()) {
      setError("L'année académique est obligatoire");
      return;
    }
    
    // Vérification des doublons
    if (isConfigDuplicate(configs, selectedConfig.name, selectedConfig.academicYear, selectedConfig.id)) {
      setError("Une configuration avec ce nom et cette année académique existe déjà");
      return;
    }
    
    setError(null);
    setIsEditing(false);
  };

  const deleteConfig = (id: string) => {
    setConfigs(configs.filter((cfg) => cfg.id !== id));
    if (selectedConfigId === id) setSelectedConfigId(null);
    setError(null);
    setIsEditing(false);
  };

  // Semester management
  const addSemester = () => {
    if (!selectedConfigId) return;

    const currentConfig = configs.find(cfg => cfg.id === selectedConfigId);
    if (!currentConfig) return;

    // Find highest semester number from existing semesters named "Semestre X"
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
    
    setConfigs(
      configs.map((cfg) => {
        if (cfg.id !== selectedConfigId) return cfg;
        return {
          ...cfg,
          semesters: cfg.semesters.filter((sem) => sem.id !== semesterId),
        };
      })
    );
  };

  // UE management
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
  };

  // EC management
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
  };

  const handleSelectConfig = (id: string) => {
    setSelectedConfigId(id);
    setError(null);
    setIsEditing(false);
  };

  const handleImportConfigs = (importedConfigs: ClassConfig[]) => {
    // Check for duplicates
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
      
      // Filter out duplicates and add only unique configurations
      const uniqueImports = importedConfigs.filter(imported => 
        !configs.some(cfg => 
          cfg.name === imported.name && 
          cfg.academicYear === imported.academicYear
        )
      );
      
      if (uniqueImports.length > 0) {
        setConfigs([...configs, ...uniqueImports]);
        setSuccess(`${uniqueImports.length} configuration(s) importée(s) avec succès.`);
        setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
      }
    } else {
      // No duplicates found, add all configurations
      setConfigs([...configs, ...importedConfigs]);
      setSuccess(`${importedConfigs.length} configuration(s) importée(s) avec succès.`);
      setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-2 md:p-6 relative">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-700 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold">Configuration Académique</CardTitle>
              <CardDescription className="text-gray-100 mt-1">
                Gérez les classes, semestres, UEs et ECs
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button 
                onClick={addNewConfig} 
                variant="secondary"
                className="bg-white hover:bg-gray-50 text-gray-700 w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle Configuration
              </Button>
              <ImportExportExcel 
                configs={configs}
                onImport={handleImportConfigs}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Classes Sidebar */}
            <div className="w-full lg:w-1/4">
              <ClassList 
                configs={configs}
                selectedConfigId={selectedConfigId}
                onSelect={handleSelectConfig}
                onDelete={deleteConfig}
              />
            </div>

            {/* Main Content */}
            <div className="w-full lg:w-3/4">
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
        </CardContent>
      </Card>
    </div>
  );
};