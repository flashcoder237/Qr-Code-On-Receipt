// src/components/ui/advanced-border-editor/AdvancedBorderEditor.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Square } from "lucide-react";
import { 
  AdvancedBorderConfig, 
  BORDER_STYLES 
} from "@/lib/form-schemas/advanced-typography";

interface AdvancedBorderEditorProps {
  label: string;
  value: AdvancedBorderConfig;
  onChange: (config: AdvancedBorderConfig) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showRadius?: boolean;
}

export const AdvancedBorderEditor: React.FC<AdvancedBorderEditorProps> = ({
  label,
  value,
  onChange,
  isOpen = false,
  onOpenChange,
  showRadius = false
}) => {
  // Provide default values if value is undefined or null
  const defaultBorderConfig: AdvancedBorderConfig = {
    style: 'none',
    width: 0,
    color: '#000000',
    radius: 0
  };

  const borderConfig = value || defaultBorderConfig;

  const updateBorder = (field: keyof AdvancedBorderConfig, newValue: any) => {
    onChange({
      ...borderConfig,
      [field]: newValue
    });
  };

  const previewStyle = {
    width: '100%',
    height: '40px',
    border: `${borderConfig.width || 0}px ${borderConfig.style || 'solid'} ${borderConfig.color || '#000000'}`,
    borderRadius: showRadius && borderConfig.radius ? `${borderConfig.radius}px` : '0px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px 0',
    fontSize: '12px',
    color: '#64748b'
  } as React.CSSProperties;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            <span className="font-medium">{label}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 p-4 border rounded-lg bg-gray-50">
        {/* Aperçu */}
        <div>
          <Label className="text-sm font-medium">Aperçu</Label>
          <div style={previewStyle}>
            Aperçu de la bordure
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Style de bordure */}
          <div className="space-y-2">
            <Label>Style</Label>
            <Select
              value={borderConfig.style}
              onValueChange={(val) => updateBorder('style', val as typeof borderConfig.style)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BORDER_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-1" 
                        style={{ 
                          border: style === 'none' ? 'none' : `2px ${style} #000`,
                          borderTop: style === 'none' ? 'none' : `2px ${style} #000`,
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: 'none'
                        }}
                      />
                      {style === 'none' ? 'Aucune' :
                       style === 'solid' ? 'Continu' :
                       style === 'dashed' ? 'Tirets' :
                       style === 'dotted' ? 'Pointillés' :
                       style === 'double' ? 'Double' :
                       style === 'groove' ? 'Rainuré' :
                       style === 'ridge' ? 'Relief' :
                       style === 'inset' ? 'Enfoncé' :
                       style === 'outset' ? 'Surélevé' : style}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Épaisseur */}
          <div className="space-y-2">
            <Label>Épaisseur: {borderConfig.width}px</Label>
            <Slider
              value={[borderConfig.width]}
              min={0}
              max={10}
              step={1}
              onValueChange={(val) => updateBorder('width', val[0])}
              disabled={borderConfig.style === 'none'}
            />
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              <div
                className="w-8 h-8 border border-gray-300 rounded-md cursor-pointer"
                style={{ backgroundColor: borderConfig.color }}
                onClick={() => document.getElementById(`border-color-${label}`)?.click()}
              />
              <Input
                type="text"
                value={borderConfig.color}
                onChange={(e) => updateBorder('color', e.target.value)}
                className="flex-1"
                placeholder="#000000"
                disabled={borderConfig.style === 'none'}
              />
              <input
                id={`border-color-${label}`}
                type="color"
                value={borderConfig.color}
                onChange={(e) => updateBorder('color', e.target.value)}
                className="w-12 h-8 border-0 rounded"
                style={{ appearance: 'none', backgroundColor: 'transparent' }}
                disabled={borderConfig.style === 'none'}
              />
            </div>
          </div>

          {/* Rayon (optionnel) */}
          {showRadius && (
            <div className="space-y-2">
              <Label>Rayon: {borderConfig.radius || 0}px</Label>
              <Slider
                value={[borderConfig.radius || 0]}
                min={0}
                max={20}
                step={1}
                onValueChange={(val) => updateBorder('radius', val[0])}
              />
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({
              style: 'none',
              width: 0,
              color: '#000000',
              radius: 0
            })}
          >
            Aucune bordure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({
              style: 'solid',
              width: 1,
              color: '#000000',
              radius: showRadius ? 0 : undefined
            })}
          >
            Bordure simple
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({
              style: 'double',
              width: 3,
              color: '#000000',
              radius: showRadius ? 0 : undefined
            })}
          >
            Bordure double
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};