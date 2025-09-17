// Re-export from services for backward compatibility
export type { ThermalLabelData, ThermalLabelOptions } from "@/services/labels/types";


export interface ThermalPrintSettings {
  width: number;   // 6cm in pixels at 96 DPI ≈ 227px (landscape)
  height: number;  // 3cm in pixels at 96 DPI ≈ 113px (landscape)
  dpi: number;
  margin: number;
}