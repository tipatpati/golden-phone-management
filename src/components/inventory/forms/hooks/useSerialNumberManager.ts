import { useState, useCallback, useMemo } from "react";
import { validateSerialWithBattery, parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { SerialEntry } from "../types";

interface UseSerialNumberManagerOptions {
  initialSerialNumbers?: string[];
  productId?: string;
  onStockChange?: (stock: number) => void;
}

export function useSerialNumberManager({
  initialSerialNumbers = [],
  productId,
  onStockChange
}: UseSerialNumberManagerOptions) {
  const [serialNumbers, setSerialNumbers] = useState(
    initialSerialNumbers.join('\n')
  );

  // Generate barcode entries for each serial number
  const serialEntries = useMemo<SerialEntry[]>(() => {
    if (!serialNumbers.trim()) return [];
    
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      const parsed = parseSerialWithBattery(line);
      const barcode = generateSKUBasedBarcode(parsed.serial, productId, parsed.batteryLevel);
      return {
        serial: line.trim(),
        color: parsed.color,
        batteryLevel: parsed.batteryLevel,
        barcode: barcode,
        index: index
      };
    });
  }, [serialNumbers, productId]);

  // Validate all serial numbers
  const validationResults = useMemo(() => {
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => ({
      line,
      validation: validateSerialWithBattery(line)
    }));
  }, [serialNumbers]);

  const hasValidationErrors = validationResults.some(result => !result.validation.isValid);
  const firstError = validationResults.find(result => !result.validation.isValid);

  const updateSerialNumbers = useCallback((value: string) => {
    setSerialNumbers(value);
    
    // Auto-update stock based on serial count
    const lines = value.split('\n').filter(line => line.trim() !== '');
    if (onStockChange) {
      onStockChange(lines.length);
    }
  }, [onStockChange]);

  const addSerialNumber = useCallback((serialNumber: string) => {
    const newValue = serialNumbers.trim() 
      ? `${serialNumbers}\n${serialNumber}`
      : serialNumber;
    updateSerialNumbers(newValue);
  }, [serialNumbers, updateSerialNumbers]);

  const removeSerialNumber = useCallback((index: number) => {
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    lines.splice(index, 1);
    updateSerialNumbers(lines.join('\n'));
  }, [serialNumbers, updateSerialNumbers]);

  const clearSerialNumbers = useCallback(() => {
    updateSerialNumbers('');
  }, [updateSerialNumbers]);

  return {
    serialNumbers,
    serialEntries,
    hasValidationErrors,
    validationError: firstError?.validation.error,
    invalidLine: firstError?.line,
    updateSerialNumbers,
    addSerialNumber,
    removeSerialNumber,
    clearSerialNumbers,
    serialCount: serialEntries.length
  };
}