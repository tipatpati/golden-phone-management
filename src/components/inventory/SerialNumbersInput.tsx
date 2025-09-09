import React from "react";
import type { UnitEntryForm } from "@/services/inventory/types";
import { UnitEntryForm as UnifiedUnitEntryForm } from "@/components/shared/forms/UnitEntryForm";

interface SerialNumbersInputProps {
  entries: UnitEntryForm[];
  setEntries: (entries: UnitEntryForm[]) => void;
  setStock: (value: string) => void; // kept for backward compatibility
}

/**
 * @deprecated Use UnitEntryForm from shared/forms instead
 * This component is kept for backward compatibility only
 */
export function SerialNumbersInput({ entries, setEntries, setStock }: SerialNumbersInputProps) {
  // Use the unified component
  const handleStockChange = (count: number) => {
    setStock(String(count));
  };

  return (
    <UnifiedUnitEntryForm
      entries={entries}
      setEntries={setEntries}
      onStockChange={handleStockChange}
      title="Unità (IMEI/SN + attributi) *"
      showPricing={true}
    />
  );
}