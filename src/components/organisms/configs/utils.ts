export const LOCAL_STORAGE_KEY = "academicConfigs";

export const getDefaultAcademicYear = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-${currentYear + 1}`;
};

export const calculateSemesterCredits = (semester: Semester) => {
  return semester.ues.reduce((total, ue) => total + ue.credits, 0);
};

export const calculateUECredits = (ue: UE) => {
  return ue.ecs.reduce((total, ec) => total + ec.credits, 0);
};

export const isConfigDuplicate = (configs: ClassConfig[], name: string, academicYear: string, currentId?: string) => {
  return configs.some(cfg => 
    cfg.name.trim().toLowerCase() === name.trim().toLowerCase() && 
    cfg.academicYear.trim() === academicYear.trim() && 
    (!currentId || cfg.id !== currentId)
  );
};