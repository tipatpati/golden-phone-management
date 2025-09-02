/**
 * Professional hook for thermal label printing operations
 * Provides state management, error handling, and validation
 */

import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { ThermalLabelService } from "../services/ThermalLabelService";
import { ThermalLabelData, ThermalLabelOptions } from "../types";

interface PrintState {
  isPrinting: boolean;
  lastPrintedCount: number;
  printHistory: Array<{
    timestamp: Date;
    labelCount: number;
    success: boolean;
  }>;
}

interface UseThermalLabelPrintResult {
  printState: PrintState;
  printLabels: (labels: ThermalLabelData[], options: ThermalLabelOptions & { companyName?: string }) => Promise<boolean>;
  generatePreview: (labels: ThermalLabelData[], options: ThermalLabelOptions & { companyName?: string }) => Promise<string | null>;
  clearPrintHistory: () => void;
}

export function useThermalLabelPrint(): UseThermalLabelPrintResult {
  const [printState, setPrintState] = useState<PrintState>({
    isPrinting: false,
    lastPrintedCount: 0,
    printHistory: []
  });

  const addToPrintHistory = useCallback((labelCount: number, success: boolean) => {
    setPrintState(prev => ({
      ...prev,
      printHistory: [
        { timestamp: new Date(), labelCount, success },
        ...prev.printHistory.slice(0, 9) // Keep last 10 entries
      ]
    }));
  }, []);

  const printLabels = useCallback(async (
    labels: ThermalLabelData[],
    options: ThermalLabelOptions & { companyName?: string }
  ): Promise<boolean> => {
    if (printState.isPrinting) {
      toast({
        title: "Print in Progress",
        description: "Please wait for the current print job to complete",
        variant: "destructive"
      });
      return false;
    }

    setPrintState(prev => ({ ...prev, isPrinting: true }));

    try {
      const result = await ThermalLabelService.printLabels(labels, options);
      
      if (result.success) {
        setPrintState(prev => ({ 
          ...prev, 
          lastPrintedCount: result.totalLabels,
          isPrinting: false 
        }));
        
        addToPrintHistory(result.totalLabels, true);
        
        toast({
          title: "Print Prepared Successfully",
          description: result.message,
          variant: "default"
        });
        
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown print error';
      
      setPrintState(prev => ({ ...prev, isPrinting: false }));
      addToPrintHistory(0, false);
      
      toast({
        title: "Print Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      console.error('Thermal label print failed:', error);
      return false;
    }
  }, [printState.isPrinting, addToPrintHistory]);

  const generatePreview = useCallback(async (
    labels: ThermalLabelData[],
    options: ThermalLabelOptions & { companyName?: string }
  ): Promise<string | null> => {
    try {
      return ThermalLabelService.generateThermalLabels(labels, options);
    } catch (error) {
      console.error('Preview generation failed:', error);
      toast({
        title: "Preview Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return null;
    }
  }, []);

  const clearPrintHistory = useCallback(() => {
    setPrintState(prev => ({
      ...prev,
      printHistory: []
    }));
  }, []);

  return {
    printState,
    printLabels,
    generatePreview,
    clearPrintHistory
  };
}