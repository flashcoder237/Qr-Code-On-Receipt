import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerInputProps {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  id?: string;
  className?: string;
}

function isValidDateFormat(val: string): boolean {
  if (!val) return true;
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(val)) return false;
  const [day, month, year] = val.split("/").map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

function toNativeDate(val: string): string {
  if (!val || !isValidDateFormat(val)) return "";
  const [day, month, year] = val.split("/");
  return `${year}-${month}-${day}`;
}

function fromNativeDate(val: string): string {
  if (!val) return "";
  const [year, month, day] = val.split("-");
  return `${day}/${month}/${year}`;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "JJ/MM/AAAA",
  error,
  id,
  className,
}) => {
  const nativeRef = useRef<HTMLInputElement>(null);
  const [internalError, setInternalError] = useState<string>("");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setInternalError("");
  };

  const handleBlur = () => {
    if (value && !isValidDateFormat(value)) {
      setInternalError("Format invalide, utilisez JJ/MM/AAAA");
    } else {
      setInternalError("");
    }
    onBlur?.();
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fromNativeDate(e.target.value));
    setInternalError("");
  };

  const displayError = error || internalError;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1">
        <Input
          id={id}
          value={value}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn("flex-1", displayError ? "border-red-500" : "")}
          maxLength={10}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 shrink-0"
          onClick={() => nativeRef.current?.showPicker?.()}
          title="Choisir une date"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>
      <input
        ref={nativeRef}
        type="date"
        value={toNativeDate(value)}
        onChange={handleNativeDateChange}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        tabIndex={-1}
      />
      {displayError && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </p>
      )}
    </div>
  );
};
