import { useState, useCallback } from "react";
import { ThermalLabelData as ComponentLabelData, ThermalLabelOptions as ComponentLabelOptions } from "../types";
import { ThermalLabelData as ServiceLabelData, ThermalLabelOptions as ServiceLabelOptions } from "@/services/shared/interfaces/IPrintService";
import { Services } from "@/services/core";
import { useToast } from "@/hooks/use-toast";

// Print state interface
interface PrintState {
  isPrinting: boolean;
  lastPrintedCount: number;
  printHistory: Array<{
    timestamp: Date;
    labelCount: number;
    success: boolean;
  }>;
}

// Hook result interface
interface UseThermalLabelPrintResult {
  printState: PrintState;
  printLabels: (labels: ComponentLabelData[], options: ComponentLabelOptions & { companyName?: string }) => Promise<void>;
  generatePreview: (labels: ComponentLabelData[], options: ComponentLabelOptions & { companyName?: string }) => Promise<string>;
  clearPrintHistory: () => void;
}

export function useThermalLabelPrint(): UseThermalLabelPrintResult {
  const { toast } = useToast();
  const [printState, setPrintState] = useState<PrintState>({
    isPrinting: false,
    lastPrintedCount: 0,
    printHistory: []
  });

  // Helper function to convert component labels to service labels
  const convertLabels = (labels: ComponentLabelData[]): ServiceLabelData[] => {
    return labels.map(label => {
      // CRITICAL: Preserve exact barcode - do not modify or generate fallbacks
      if (!label.barcode) {
        console.error('❌ convertLabels: Missing barcode for label:', label);
        throw new Error('Cannot print label without barcode');
      }
      
      return {
        id: label.barcode, // Use barcode as ID to maintain traceability
        productName: label.productName,
        brand: "GPMS", // Default brand
        model: label.productName,
        price: label.price,
        maxPrice: label.maxPrice, // Pass through maxPrice for print service
        barcode: label.barcode, // Preserve exact barcode from source
        serial: label.serialNumber,
        color: label.color,
        storage: label.storage?.toString(),
        ram: label.ram?.toString(),
        batteryLevel: label.batteryLevel // Now properly passed through
      };
    });
  };

  // Helper function to convert component options to service options
  const convertOptions = (options: ComponentLabelOptions & { companyName?: string }): ServiceLabelOptions => {
    console.log('🔄 useThermalLabelPrint: Converting options:', {
      includePrice: options.includePrice,
      isSupplierLabel: options.isSupplierLabel,
      companyName: options.companyName
    });
    
    return {
      copies: options.copies || 1,
      companyName: options.companyName,
      showPrice: options.includePrice,
      showSerial: true,
      isSupplierLabel: options.isSupplierLabel // CRITICAL: Pass through the supplier flag
    };
  };

  const printLabels = useCallback(async (labels: ComponentLabelData[], options: ComponentLabelOptions & { companyName?: string }) => {
    try {
      setPrintState(prev => ({ ...prev, isPrinting: true }));
      
      const serviceLabelData = convertLabels(labels);
      const serviceOptions = convertOptions(options);

      const printService = await Services.getPrintService();
      const result = await printService.printLabels(serviceLabelData, serviceOptions);

      const printRecord = {
        timestamp: new Date(),
        labelCount: result.totalLabels || 0,
        success: result.success
      };

      setPrintState(prev => ({
        ...prev,
        isPrinting: false,
        lastPrintedCount: result.totalLabels || 0,
        printHistory: [printRecord, ...prev.printHistory.slice(0, 9)] // Keep last 10 records
      }));

      if (result.success) {
        toast({
          title: "Print Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Print Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setPrintState(prev => ({ ...prev, isPrinting: false }));
      toast({
        title: "Print Error",
        description: `Failed to print labels: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const generatePreview = useCallback(async (labels: ComponentLabelData[], options: ComponentLabelOptions & { companyName?: string }): Promise<string> => {
    try {
      const serviceLabelData = convertLabels(labels);
      const serviceOptions = convertOptions(options);

      const printService = await Services.getPrintService();
      return printService.generateLabelHTML(serviceLabelData, serviceOptions);
    } catch (error) {
      console.error('Preview generation failed:', error);
      return '<div>Preview generation failed</div>';
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