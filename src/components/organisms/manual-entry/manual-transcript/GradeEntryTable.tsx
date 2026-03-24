import React, { useMemo, useState } from "react";
import {
  UseFormRegister,
  UseFormSetValue,
  Control,
  useWatch,
  useFieldArray,
} from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen,
  Plus,
  Trash2,
  Settings2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Semester } from "@/components/organisms/configs/types";
import { ManualTranscriptFormValues } from "../shared/manual-entry-schemas";
import { calculateUEAverage } from "@/lib/helpers/grades";
import { useConfirm } from "@/contexts/ConfirmContext";

interface GradeEntryTableProps {
  semester: Semester;
  register: UseFormRegister<ManualTranscriptFormValues>;
  setValue: UseFormSetValue<ManualTranscriptFormValues>;
  control: Control<ManualTranscriptFormValues>;
  displaySessions: boolean;
  academicYear: string;
}

interface UEBlockProps {
  ueIndex: number;
  register: UseFormRegister<ManualTranscriptFormValues>;
  control: Control<ManualTranscriptFormValues>;
  setValue: UseFormSetValue<ManualTranscriptFormValues>;
  displaySessions: boolean;
  academicYear: string;
  onRemoveUE: () => void;
  canRemove: boolean;
}

const UEBlock: React.FC<UEBlockProps> = ({
  ueIndex,
  register,
  control,
  setValue,
  displaySessions,
  academicYear,
  onRemoveUE,
  canRemove,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const confirm = useConfirm();

  const ueData = useWatch({
    control,
    name: `ues.${ueIndex}`,
  });

  const { fields: ecFields, append: appendEc, remove: removeEc } = useFieldArray({
    control,
    name: `ues.${ueIndex}.ecs`,
  });

  // Calculate UE average in real-time
  const ueAverage = useMemo(() => {
    if (!ueData) return null;

    if (ueData.useExcelAverage && ueData.ueAverageManual) {
      const manualAvg =
        typeof ueData.ueAverageManual === "string"
          ? parseFloat(ueData.ueAverageManual)
          : ueData.ueAverageManual;
      return !isNaN(manualAvg) ? manualAvg : null;
    }

    const ecsWithNotes = ueData.ecs
      ?.map((ec: any) => {
        const note =
          typeof ec.note === "string" ? parseFloat(ec.note) : ec.note;
        if (note === undefined || note === null || isNaN(note)) return null;
        return {
          note,
          weight: ec.weight || 1,
          noteBase: ec.noteBase || 20,
          displayBase: ec.displayBase || 20,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (!ecsWithNotes || ecsWithNotes.length === 0) return null;

    const result = calculateUEAverage(ecsWithNotes);
    // Convertir la moyenne /20 vers la base d'affichage de l'UE
    const ueDisplayBase = ueData?.displayBase || 20;
    return (result.average * ueDisplayBase) / 20;
  }, [ueData]);

  const displayBase = ueData?.displayBase || 20;
  const ueCode = ueData?.ueCode || "";
  const ueName = ueData?.ueName || "";
  const ueCredits = ueData?.ueCredits || 0;

  const handleAddEc = () => {
    appendEc({
      ecId: crypto.randomUUID(),
      ecName: `EC ${ecFields.length + 1}`,
      note: undefined,
      weight: 1,
      noteBase: 20,
      displayBase: 20,
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* UE Header */}
      <div className="bg-muted/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {ueCode}
          </Badge>
          <span className="font-medium text-sm">{ueName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {ueCredits} credits
          </Badge>
          {ueData?.forceValidateCredits && (
            <Badge variant="secondary" className="text-xs">
              Équiv.
            </Badge>
          )}
          {ueAverage !== null && (
            <Badge
              variant={
                ueData?.forceValidateCredits || ueAverage >= displayBase / 2
                  ? "default"
                  : "destructive"
              }
              className="text-xs"
            >
              Moy: {ueAverage.toFixed(2)}/{displayBase}
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setEditOpen(!editOpen)}
            title="Personnaliser l'UE"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={async () => {
                const ok = await confirm({
                  title: "Supprimer l'UE",
                  message: `Supprimer "${ueData?.ueName || "cette UE"}" et tous ses ECs ?`,
                  variant: "destructive",
                  confirmLabel: "Supprimer",
                });
                if (ok) onRemoveUE();
              }}
              title="Supprimer l'UE"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* UE Edit Panel */}
      <Collapsible open={editOpen} onOpenChange={setEditOpen}>
        <CollapsibleContent>
          <div className="px-4 py-3 bg-muted/20 border-b space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Personnaliser l'UE
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Code</Label>
                <Input
                  className="h-8 text-xs"
                  {...register(`ues.${ueIndex}.ueCode`)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Intitule</Label>
                <Input
                  className="h-8 text-xs"
                  {...register(`ues.${ueIndex}.ueName`)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Credits</Label>
                <Input
                  type="number"
                  min="1"
                  className="h-8 text-xs"
                  {...register(`ues.${ueIndex}.ueCredits`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Base affichage</Label>
                <Input
                  type="number"
                  min="1"
                  className="h-8 text-xs"
                  {...register(`ues.${ueIndex}.displayBase`, { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                checked={ueData?.forceValidateCredits === true}
                onCheckedChange={(v) =>
                  setValue(`ues.${ueIndex}.forceValidateCredits`, v)
                }
              />
              <div>
                <Label className="text-xs font-medium">Crédits validés (équivalence / étranger)</Label>
                <p className="text-xs text-muted-foreground">
                  Force la validation des crédits quelle que soit la note
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* EC rows or manual UE average */}
      <div className="p-3 space-y-2">
        {ueData?.useExcelAverage ? (
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground w-48">
              Moyenne UE (saisie directe)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={displayBase}
              placeholder={`/ ${displayBase}`}
              className="w-28"
              {...register(`ues.${ueIndex}.ueAverageManual`)}
            />
            <span className="text-xs text-muted-foreground">
              /{displayBase}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ecFields.map((ecField, ecIndex) => {
              const ecData = ueData?.ecs?.[ecIndex];
              const noteBase = ecData?.noteBase || 20;
              const ecWeight = ecData?.weight || 1;
              return (
                <ECRow
                  key={ecField.id}
                  ueIndex={ueIndex}
                  ecIndex={ecIndex}
                  noteBase={noteBase}
                  ecWeight={ecWeight}
                  register={register}
                  control={control}
                  canRemove={ecFields.length > 1}
                  onRemove={() => removeEc(ecIndex)}
                />
              );
            })}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 mt-1"
              onClick={handleAddEc}
            >
              <Plus className="h-3 w-3" />
              Ajouter un EC
            </Button>
          </div>
        )}

        {/* Session selector */}
        {displaySessions && (
          <div className="flex items-center gap-3 pt-2 border-t mt-2">
            <Label className="text-xs text-muted-foreground w-20">
              Session
            </Label>
            <Select
              value={ueData?.session?.type || "N"}
              onValueChange={(val) =>
                setValue(`ues.${ueIndex}.session.type`, val as "N" | "R")
              }
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="N">Normale</SelectItem>
                <SelectItem value="R">Rattrapage</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={academicYear?.split("/")[0] || "2025"}
              className="w-20 h-8 text-xs"
              {...register(`ues.${ueIndex}.session.year`)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// EC row with inline edit for name/weight/noteBase
interface ECRowProps {
  ueIndex: number;
  ecIndex: number;
  noteBase: number;
  ecWeight: number;
  register: UseFormRegister<ManualTranscriptFormValues>;
  control: Control<ManualTranscriptFormValues>;
  canRemove: boolean;
  onRemove: () => void;
}

const ECRow: React.FC<ECRowProps> = ({
  ueIndex,
  ecIndex,
  noteBase,
  ecWeight,
  register,
  control,
  canRemove,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false);
  const confirm = useConfirm();

  const ecData = useWatch({
    control,
    name: `ues.${ueIndex}.ecs.${ecIndex}`,
  });

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={() => setExpanded(!expanded)}
          title="Modifier l'EC"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
        <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
          {ecData?.ecName || `EC ${ecIndex + 1}`}
        </span>
        {ecWeight !== 1 && (
          <Badge variant="outline" className="text-xs shrink-0">
            x{ecWeight}
          </Badge>
        )}
        <Input
          type="number"
          step="0.01"
          min="0"
          max={noteBase}
          placeholder={`/ ${noteBase}`}
          className="w-28 shrink-0"
          {...register(`ues.${ueIndex}.ecs.${ecIndex}.note`)}
        />
        <span className="text-xs text-muted-foreground shrink-0 w-8">
          /{noteBase}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              const ok = await confirm({
                title: "Supprimer l'EC",
                message: `Supprimer "${ecData?.ecName || `EC ${ecIndex + 1}`}" ?`,
                variant: "destructive",
                confirmLabel: "Supprimer",
              });
              if (ok) onRemove();
            }}
            title="Supprimer l'EC"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {expanded && (
        <div className="ml-8 grid grid-cols-3 gap-2 pb-1">
          <div className="space-y-0.5">
            <Label className="text-xs text-muted-foreground">Nom EC</Label>
            <Input
              className="h-7 text-xs"
              {...register(`ues.${ueIndex}.ecs.${ecIndex}.ecName`)}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs text-muted-foreground">Poids</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              className="h-7 text-xs"
              {...register(`ues.${ueIndex}.ecs.${ecIndex}.weight`, {
                valueAsNumber: true,
              })}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs text-muted-foreground">Base note</Label>
            <Input
              type="number"
              min="1"
              className="h-7 text-xs"
              {...register(`ues.${ueIndex}.ecs.${ecIndex}.noteBase`, {
                valueAsNumber: true,
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const GradeEntryTable: React.FC<GradeEntryTableProps> = ({
  semester,
  register,
  setValue,
  control,
  displaySessions,
  academicYear,
}) => {
  const { fields: ueFields, append: appendUe, remove: removeUe } = useFieldArray({
    control,
    name: "ues",
  });

  const handleAddUE = () => {
    const newUeId = crypto.randomUUID();
    appendUe({
      ueId: newUeId,
      ueName: `Nouvelle UE`,
      ueCode: `UE${ueFields.length + 1}`,
      ueCredits: 3,
      useExcelAverage: false,
      ueAverageManual: undefined,
      displayBase: 20,
      forceValidateCredits: false,
      ecs: [
        {
          ecId: crypto.randomUUID(),
          ecName: "EC 1",
          note: undefined,
          weight: 1,
          noteBase: 20,
          displayBase: 20,
        },
      ],
      session: { type: "N" as const, year: "" },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Saisie des notes - {semester.name}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleAddUE}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter UE
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ueFields.map((ueField, ueIndex) => (
          <UEBlock
            key={ueField.id}
            ueIndex={ueIndex}
            register={register}
            control={control}
            setValue={setValue}
            displaySessions={displaySessions}
            academicYear={academicYear}
            onRemoveUE={() => removeUe(ueIndex)}
            canRemove={ueFields.length > 1}
          />
        ))}

        {ueFields.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucune UE. Ajoutez-en une pour commencer la saisie.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleAddUE}
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une UE
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
