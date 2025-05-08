import React from 'react';
import { Progress } from '../../../ui/progress';
import { Button } from '../../../ui/button';

interface ProcessingProgressProps {
  progress: number;
  processedCount: number;
  totalCount: number;
  onCancel: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  progress,
  processedCount,
  totalCount,
  onCancel
}) => {
  return (
    <div className="space-y-2">
      <Progress value={progress} />
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {processedCount} / {totalCount} traités
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
};
