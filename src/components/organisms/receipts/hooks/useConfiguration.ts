import { useState, useEffect, useCallback, useMemo } from 'react';

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
 * Valeurs de retour du hook useConfiguration
 */
interface UseConfigurationReturn {
  /** Liste des configurations disponibles */
  configs: AcademicConfig[];
  /** ID de la configuration sélectionnée */
  selectedConfigId: string | null;
  /** ID du semestre sélectionné */
  selectedSemesterId: string | null;
  /** Liste des semestres disponibles pour la configuration sélectionnée */
  availableSemesters: Array<{ id: string; name: string }>;
  /** Mapping des colonnes */
  columnMapping: Record<string, string>;
  /** Fonction pour changer la configuration sélectionnée */
  handleConfigChange: (configId: string) => void;
  /** Fonction pour changer le semestre sélectionné */
  handleSemesterChange: (semesterId: string) => void;
  /** Fonction pour mettre à jour le mapping des colonnes */
  handleMappingChange: (ecId: string, column: string) => void;
  /** Fonction pour mettre à jour la liste des semestres disponibles */
  updateAvailableSemesters: (semesters: Array<{ id: string; name: string }>) => void;
  /** Fonction pour réinitialiser toute la configuration */
  resetConfiguration: () => void;
}

/**
 * Hook pour gérer les configurations académiques et leur persistance
 * 
 * @param options Options de configuration du hook
 * @returns Un objet contenant l'état et les fonctions de gestion de la configuration
 */
export const useConfiguration = (options: UseConfigurationOptions = {}): UseConfigurationReturn => {
  // États
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [availableSemesters, setAvailableSemesters] = useState<Array<{ id: string; name: string }>>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [configs, setConfigs] = useState<AcademicConfig[]>([]);

  /**
   * Charge les configurations depuis le localStorage
   */
  const loadConfigs = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return;

      const parsedConfigs = JSON.parse(stored) as AcademicConfig[];
      setConfigs(parsedConfigs);

      // Mettre à jour les semestres disponibles si une configuration est sélectionnée
      if (selectedConfigId) {
        const config = parsedConfigs.find((c) => c.id === selectedConfigId);
        if (config) {
          setAvailableSemesters(
            config.semesters.map((sem) => ({
              id: sem.id,
              name: sem.name,
            }))
          );
        }
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des configurations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedConfigId]);

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
   */
  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      if (!cached) return;

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
    } catch (error) {
      console.error(`Erreur lors du chargement du cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [options]);

  // Effet pour charger les configurations et le cache au montage
  useEffect(() => {
    loadConfigs();
    loadCache();

    // Écouter les changements de stockage pour les mises à jour en temps réel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        loadConfigs();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadConfigs, loadCache]);

  // Handlers
  /**
   * Gère le changement de configuration
   */
  const handleConfigChange = useCallback((configId: string) => {
    setSelectedConfigId(configId);
    updateCache({ lastConfigId: configId });

    // Mettre à jour les semestres disponibles
    const config = configs.find(c => c.id === configId);
    if (config) {
      const semesters = config.semesters.map((sem) => ({
        id: sem.id,
        name: sem.name,
      }));
      setAvailableSemesters(semesters);
    } else {
      // Réinitialiser les semestres si la configuration n'existe pas
      setAvailableSemesters([]);
    }

    options.onConfigChange?.(configId);
  }, [configs, updateCache, options]);

  /**
   * Gère le changement de semestre
   */
  const handleSemesterChange = useCallback((semesterId: string) => {
    setSelectedSemesterId(semesterId);
    updateCache({ lastSemesterId: semesterId });
    options.onSemesterChange?.(semesterId);
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

  // Memoïsation de la configuration sélectionnée
  const selectedConfig = useMemo(() => {
    return configs.find(c => c.id === selectedConfigId) || null;
  }, [configs, selectedConfigId]);

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