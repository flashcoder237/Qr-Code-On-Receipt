import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Label } from "components/ui/label";

interface ConfigurationSelectorProps {
  configs: {
    id: string;
    name: string;
    academicYear: string;
  }[];
  selectedConfigId: string | null;
  isLoading: boolean;
  onConfigChange: (value: string) => void;
}

export const ConfigurationSelector: React.FC<ConfigurationSelectorProps> = ({
  configs,
  selectedConfigId,
  isLoading,
  onConfigChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="config-select">Configuration de classe</Label>
      <Select
        value={selectedConfigId || ""}
        onValueChange={onConfigChange}
        disabled={isLoading}
      >
        <SelectTrigger id="config-select">
          <SelectValue placeholder="Sélectionnez une configuration" />
        </SelectTrigger>
        <SelectContent>
          {configs.map((cfg) => (
            <SelectItem key={cfg.id} value={cfg.id}>
              {cfg.name} ({cfg.academicYear})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
