import React, { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: string[];
  error?: string;
}

export const AutocompleteInput = React.forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>(({ suggestions, error, className, ...props }, ref) => {
  const listId = useId();
  const uniqueSuggestions = [...new Set(suggestions.filter(Boolean))].slice(0, 30);

  return (
    <div>
      <Input
        ref={ref}
        list={listId}
        className={cn(className, error ? "border-red-500" : "")}
        {...props}
      />
      <datalist id={listId}>
        {uniqueSuggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

AutocompleteInput.displayName = "AutocompleteInput";
