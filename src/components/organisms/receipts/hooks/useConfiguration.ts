import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = "academicConfigs"; // Same key as AcademicConfigManager

interface ConfigurationCache {
  lastConfigId?: string;
  lastSemesterId?: string;
  lastMapping?: Record<string, string>;
}

interface UseConfigurationOptions {
  onConfigChange?: (configId: string) => void;
  onSemesterChange?: (semesterId: string) => void;
}

export const useConfiguration = (options: UseConfigurationOptions = {}) => {
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [availableSemesters, setAvailableSemesters] = useState<Array<{id: string; name: string}>>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [configs, setConfigs] = useState<any[]>([]);

  // Load configurations from localStorage
  const loadConfigs = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedConfigs = JSON.parse(stored);
        setConfigs(parsedConfigs);

        // If we have a selected config, update its semesters
        if (selectedConfigId) {
          const config = parsedConfigs.find((c: any) => c.id === selectedConfigId);
          if (config) {
            setAvailableSemesters(
              config.semesters.map((sem: any) => ({
                id: sem.id,
                name: sem.name
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  }, [selectedConfigId]);

  // Load cache on mount
  useEffect(() => {
    const loadCache = () => {
      try {
        const cached = localStorage.getItem('releveGeneratorCache');
        if (cached) {
          const { lastConfigId, lastSemesterId, lastMapping } = JSON.parse(cached) as ConfigurationCache;
          
          if (lastConfigId) {
            setSelectedConfigId(lastConfigId);
            options.onConfigChange?.(lastConfigId);
          }
          
          if (lastSemesterId) {
            setSelectedSemesterId(lastSemesterId);
            options.onSemesterChange?.(lastSemesterId);
          }
          
          if (lastMapping) {
            setColumnMapping(lastMapping);
          }
        }
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };

    loadConfigs();
    loadCache();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        loadConfigs();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadConfigs, options]);

  // Update cache when values change
  const updateCache = useCallback((updates: Partial<ConfigurationCache>) => {
    try {
      const cached = localStorage.getItem('releveGeneratorCache');
      const currentCache = cached ? JSON.parse(cached) : {};
      const newCache = { ...currentCache, ...updates };
      localStorage.setItem('releveGeneratorCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }, []);

  const handleConfigChange = useCallback((configId: string) => {
    setSelectedConfigId(configId);
    updateCache({ lastConfigId: configId });
    
    // Update available semesters
    const config = configs.find(c => c.id === configId);
    if (config) {
      const semesters = config.semesters.map((sem: any) => ({
        id: sem.id,
        name: sem.name
      }));
      setAvailableSemesters(semesters);
    }
    
    options.onConfigChange?.(configId);
  }, [configs, updateCache, options]);

  const handleSemesterChange = useCallback((semesterId: string) => {
    setSelectedSemesterId(semesterId);
    updateCache({ lastSemesterId: semesterId });
    options.onSemesterChange?.(semesterId);
  }, [updateCache, options]);

  const handleMappingChange = useCallback((ecId: string, column: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev, [ecId]: column };
      updateCache({ lastMapping: newMapping });
      return newMapping;
    });
  }, [updateCache]);

  const updateAvailableSemesters = useCallback((semesters: Array<{id: string; name: string}>) => {
    setAvailableSemesters(semesters);
  }, []);

  const resetConfiguration = useCallback(() => {
    setSelectedConfigId(null);
    setSelectedSemesterId(null);
    setColumnMapping({});
    localStorage.removeItem('releveGeneratorCache');
  }, []);

  return {
    configs,
    selectedConfigId,
    selectedSemesterId,
    availableSemesters,
    columnMapping,
    handleConfigChange,
    handleSemesterChange,
    handleMappingChange,
    updateAvailableSemesters,
    resetConfiguration
  };
};
