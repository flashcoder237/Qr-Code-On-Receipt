import { useState, useCallback } from 'react';

export const useTranscriptData = () => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [mappingComplete, setMappingComplete] = useState(false);

  const handleFileLoaded = useCallback((data: any[], columns: string[]) => {
    setExcelData(data);
    setExcelColumns(columns);
    setMappingComplete(false);
  }, []);

  const clearData = useCallback(() => {
    setExcelData([]);
    setExcelColumns([]);
    setMappingComplete(false);
  }, []);

  const setMappingStatus = useCallback((status: boolean) => {
    setMappingComplete(status);
  }, []);

  return {
    excelData,
    excelColumns,
    mappingComplete,
    handleFileLoaded,
    clearData,
    setMappingStatus,
  };
};
