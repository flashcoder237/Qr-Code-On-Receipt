import React from "react";
import { LayoutGrid, Columns, Smartphone, List } from "lucide-react";
import { Button } from "../../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";

export type PreviewMode = "single" | "grid" | "sideBySide" | "mobile";

interface PreviewModesProps {
  currentMode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
}

export const PreviewModes: React.FC<PreviewModesProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <div className="flex space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentMode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("single")}
          >
            <List className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Vue simple</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Vue grille</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentMode === "sideBySide" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("sideBySide")}
          >
            <Columns className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Vue côte à côte</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentMode === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Vue mobile</TooltipContent>
      </Tooltip>
    </div>
  );
};
