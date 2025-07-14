// src/components/ui/advanced-font-editor/AdvancedFontEditor.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Type, Palette } from "lucide-react";
import { 
  AdvancedFontConfig, 
  AVAILABLE_FONTS, 
  FONT_WEIGHTS, 
  FONT_STYLES 
} from "@/lib/form-schemas/advanced-typography";

interface AdvancedFontEditorProps {
  label: string;
  value: AdvancedFontConfig;
  onChange: (config: AdvancedFontConfig) => void;
  previewText?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AdvancedFontEditor: React.FC<AdvancedFontEditorProps> = ({
  label,
  value,
  onChange,
  previewText = "Aperçu du texte",
  isOpen = false,
  onOpenChange
}) => {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  
  const updateFont = (field: keyof AdvancedFontConfig, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const previewStyle = {
    fontFamily: value.fontFamily,
    fontSize: `${Math.max(value.fontSize * 0.8, 12)}px`,
    fontWeight: value.fontWeight,
    fontStyle: value.fontStyle,
    color: value.color,
    lineHeight: value.lineHeight || 1.2,
    letterSpacing: value.letterSpacing ? `${value.letterSpacing}px` : 'normal',
    textTransform: value.textTransform || 'none',
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    backgroundColor: '#f8fafc',
    margin: '8px 0',
  } as React.CSSProperties;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
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
            {previewText}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Police */}
          <div className="space-y-2">
            <Label>Police</Label>
            <Select
              value={value.fontFamily}
              onValueChange={(val) => updateFont('fontFamily', val as typeof value.fontFamily)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {AVAILABLE_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>
                      {font.split(',')[0]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Taille */}
          <div className="space-y-2">
            <Label>Taille: {value.fontSize}px</Label>
            <Slider
              value={[value.fontSize]}
              min={6}
              max={72}
              step={1}
              onValueChange={(val) => updateFont('fontSize', val[0])}
            />
          </div>

          {/* Graisse */}
          <div className="space-y-2">
            <Label>Graisse</Label>
            <Select
              value={value.fontWeight}
              onValueChange={(val) => updateFont('fontWeight', val as typeof value.fontWeight)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((weight) => (
                  <SelectItem key={weight} value={weight}>
                    <span style={{ fontWeight: weight }}>
                      {weight === "normal" ? "Normal" : 
                       weight === "bold" ? "Gras" :
                       weight === "bolder" ? "Plus gras" :
                       weight === "lighter" ? "Plus léger" :
                       weight}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label>Style</Label>
            <Select
              value={value.fontStyle}
              onValueChange={(val) => updateFont('fontStyle', val as typeof value.fontStyle)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>
                    <span style={{ fontStyle: style }}>
                      {style === "normal" ? "Normal" :
                       style === "italic" ? "Italique" :
                       style === "oblique" ? "Oblique" : style}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              <div
                className="w-8 h-8 border border-gray-300 rounded-md cursor-pointer"
                style={{ backgroundColor: value.color }}
                onClick={() => document.getElementById(`color-${label}`)?.click()}
              />
              <Input
                type="text"
                value={value.color}
                onChange={(e) => updateFont('color', e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
              <input
                id={`color-${label}`}
                type="color"
                value={value.color}
                onChange={(e) => updateFont('color', e.target.value)}
                className="w-12 h-8 border-0 rounded"
                style={{ appearance: 'none', backgroundColor: 'transparent' }}
              />
            </div>
          </div>

          {/* Hauteur de ligne */}
          <div className="space-y-2">
            <Label>Hauteur de ligne: {value.lineHeight?.toFixed(1) || '1.2'}</Label>
            <Slider
              value={[value.lineHeight || 1.2]}
              min={0.8}
              max={3.0}
              step={0.1}
              onValueChange={(val) => updateFont('lineHeight', val[0])}
            />
          </div>
        </div>

        {/* Options avancées */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              {advancedOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Options avancées
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Espacement des lettres */}
              <div className="space-y-2">
                <Label>Espacement lettres: {value.letterSpacing || 0}px</Label>
                <Slider
                  value={[value.letterSpacing || 0]}
                  min={-2}
                  max={5}
                  step={0.1}
                  onValueChange={(val) => updateFont('letterSpacing', val[0])}
                />
              </div>

              {/* Transformation du texte */}
              <div className="space-y-2">
                <Label>Transformation</Label>
                <Select
                  value={value.textTransform || "none"}
                  onValueChange={(val) => updateFont('textTransform', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="uppercase">MAJUSCULES</SelectItem>
                    <SelectItem value="lowercase">minuscules</SelectItem>
                    <SelectItem value="capitalize">Première Lettre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  );
};