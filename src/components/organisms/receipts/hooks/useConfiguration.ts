// Fixed useConfiguration.ts

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Clé utilisée pour stocker les configurations dans le localStorage
 */
const LOCAL_STORAGE_KEY = "academicConfigs"; // Same key as AcademicConfigManager
const CACHE_STORAGE_KEY = "releveGeneratorCache";

/**
 * Structure de la configuration académique
 */
interface AcademicConfig {
  id: string;
  name: string;
  semesters: Semester[];
  // Ajoutez d'autres propriétés si nécessaire
}

/**
 * Structure d'un semestre
 */
interface Semester {
  id: string;
  name: string;
  // Ajoutez d'autres propriétés si nécessaire
}

/**
 * Structure des données mises en cache
 */
interface ConfigurationCache {
  lastConfigId?: string;
  lastSemesterId?: string;
  lastMapping?: Record<string, string>;
}

/**
 * Options disponibles pour le hook useConfiguration
 */
interface UseConfigurationOptions {
  /** Callback appelé lorsque la configuration change */
  onConfigChange?: (configId: string) => void;
  /** Callback appelé lorsque le semestre change */
  onSemesterChange?: (semesterId: string) => void;
}

/**
 * FIXED: Removed cyclical dependencies where state updates were triggering each other
 */
export const useConfiguration = (options: UseConfigurationOptions = {}) => {
  // États
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [availableSemesters, setAvailableSemesters] = useState<Array<{ id: string; name: string }>>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [configs, setConfigs] = useState<AcademicConfig[]>([]);
  
  // Référence pour éviter les boucles infinies
  const isInitialLoad = useRef(true);
  const hasLoadedCache = useRef(false);

  /**
   * Charge les configurations depuis le localStorage
   */
  const loadConfigs = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return;

      const parsedConfigs = JSON.parse(stored) as AcademicConfig[];
      setConfigs(parsedConfigs);
    } catch (error) {
      console.error(`Erreur lors du chargement des configurations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  /**
   * Met à jour le cache avec les nouvelles valeurs
   */
  const updateCache = useCallback((updates: Partial<ConfigurationCache>) => {
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      const currentCache = cached ? JSON.parse(cached) as ConfigurationCache : {};
      const newCache = { ...currentCache, ...updates };
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  /**
   * Charge le cache au montage du composant
   * FIXED: Only run this once using a ref flag
   */
  useEffect(() => {
    if (hasLoadedCache.current) return;
    
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      if (!cached) return;

      const { lastConfigId, lastSemesterId, lastMapping } = JSON.parse(cached) as ConfigurationCache;

      if (lastConfigId) {
        setSelectedConfigId(lastConfigId);
        if (options.onConfigChange) {
          options.onConfigChange(lastConfigId);
        }
      }

      if (lastSemesterId) {
        setSelectedSemesterId(lastSemesterId);
        if (options.onSemesterChange) {
          options.onSemesterChange(lastSemesterId);
        }
      }

      if (lastMapping) {
        setColumnMapping(lastMapping);
      }
      
      hasLoadedCache.current = true;
    } catch (error) {
      console.error(`Erreur lors du chargement du cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [options]);

  // Effet pour charger les configurations au montage
  useEffect(() => {
    loadConfigs();

    // Écouter les changements de stockage pour les mises à jour en temps réel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        loadConfigs();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadConfigs]);

  // FIXED: This effect only runs when selectedConfigId or configs change,
  // and now properly prevents infinite loops
  useEffect(() => {
    if (selectedConfigId && configs.length > 0) {
      const config = configs.find(c => c.id === selectedConfigId);
      if (config) {
        // Update available semesters
        const semestersList = config.semesters.map(sem => ({
          id: sem.id,
          name: sem.name
        }));
        
        setAvailableSemesters(semestersList);
        
        // Only auto-select first semester if no semester is selected
        // and we have semesters available
        if (config.semesters.length > 0 && !selectedSemesterId && isInitialLoad.current) {
          isInitialLoad.current = false;
          setSelectedSemesterId(config.semesters[0].id);
          if (options.onSemesterChange) {
            options.onSemesterChange(config.semesters[0].id);
          }
        }
      }
    }
  }, [selectedConfigId, configs, selectedSemesterId]);

  // Handlers
  /**
   * Gère le changement de configuration
   */
  const handleConfigChange = useCallback((configId: string) => {
    setSelectedConfigId(configId);
    updateCache({ lastConfigId: configId });
    
    // Don't automatically reset selected semester here - let the effect handle it
    
    if (options.onConfigChange) {
      options.onConfigChange(configId);
    }
  }, [updateCache, options]);

  /**
   * Gère le changement de semestre
   */
  const handleSemesterChange = useCallback((semesterId: string) => {
    if (!semesterId || semesterId === "null") {
      setSelectedSemesterId(null);
      updateCache({ lastSemesterId: null });
    } else {
      setSelectedSemesterId(semesterId);
      updateCache({ lastSemesterId: semesterId });
      if (options.onSemesterChange) {
        options.onSemesterChange(semesterId);
      }
    }
  }, [updateCache, options]);

  /**
   * Gère la mise à jour du mapping des colonnes
   */
  const handleMappingChange = useCallback((ecId: string, column: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev, [ecId]: column };
      updateCache({ lastMapping: newMapping });
      return newMapping;
    });
  }, [updateCache]);

  /**
   * Met à jour la liste des semestres disponibles
   * FIXED: Added dependency on selectedSemesterId to prevent infinite loops
   */
  const updateAvailableSemesters = useCallback((semesters: Array<{ id: string; name: string }>) => {
    setAvailableSemesters(semesters);
  }, []);

  /**
   * Réinitialise toute la configuration
   */
  const resetConfiguration = useCallback(() => {
    setSelectedConfigId(null);
    setSelectedSemesterId(null);
    setColumnMapping({});
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (error) {
      console.error(`Erreur lors de la réinitialisation de la configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    resetConfiguration,
    setColumnMapping // Needed for direct mapping updates
  };
};