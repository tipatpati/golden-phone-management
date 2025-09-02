/**
 * @deprecated Use ThermalLabelService instead
 * Legacy thermal label utilities - maintained for backward compatibility
 */

import { ThermalLabelService } from "../services/ThermalLabelService";
import { ThermalLabelData, ThermalLabelOptions, ThermalPrintSettings } from "../types";

// Legacy settings - use ThermalLabelService for new implementations
export const THERMAL_SETTINGS: ThermalPrintSettings = {
  width: 472,
  height: 400,  
  dpi: 203,
  margin: 16
};

/**
 * @deprecated Use ThermalLabelService.generateThermalLabels instead
 */
export function generateThermalLabels(
  labels: ThermalLabelData[],
  options: ThermalLabelOptions & { companyName?: string }
): string {
  // Delegate to new service
  return ThermalLabelService.generateThermalLabels(labels, options);
}