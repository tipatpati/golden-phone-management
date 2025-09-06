// Re-export from services for backward compatibility
export type { ThermalLabelData, ThermalLabelOptions } from "@/services/labels/types";


export interface ThermalPrintSettings {
  width: number;   // 6cm in pixels at 203 DPI ≈ 472px (landscape)
  height: number;  // 5cm in pixels at 203 DPI ≈ 400px (landscape)
  dpi: number;
  margin: number;
}