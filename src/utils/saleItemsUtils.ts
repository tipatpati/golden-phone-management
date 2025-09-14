/**
 * Utility functions for managing sale items business logic
 */

export interface SaleItemControlsState {
  isQuantityDisabled: boolean;
  isSerialDisabled: boolean;
  quantityTooltip?: string;
  serialTooltip?: string;
}

/**
 * Determines which controls should be disabled for a sale item
 * @param hasSerial - Whether the product has serial numbers
 * @param currentSerial - Current serial number value
 * @returns Object indicating which controls should be disabled and tooltips
 */
export function getSaleItemControlsState(
  hasSerial: boolean,
  currentSerial?: string
): SaleItemControlsState {
  if (hasSerial) {
    return {
      isQuantityDisabled: true,
      isSerialDisabled: !!currentSerial,
      quantityTooltip: "La quantità per prodotti serializzati è sempre 1",
      serialTooltip: currentSerial 
        ? "Serial/IMEI selezionato. Rimuovi per cambiare."
        : "Seleziona un Serial/IMEI per questo prodotto"
    };
  }
  
  return {
    isQuantityDisabled: false,
    isSerialDisabled: false
  };
}

/**
 * Validates if a quantity change is allowed for a sale item
 * @param hasSerial - Whether the product has serial numbers
 * @param newQuantity - The new quantity value
 * @returns Whether the quantity change is valid
 */
export function isQuantityChangeValid(hasSerial: boolean, newQuantity: number): boolean {
  if (hasSerial && newQuantity !== 1) {
    return false;
  }
  return newQuantity > 0;
}

/**
 * Gets the enforced quantity for a serialized product
 * @param hasSerial - Whether the product has serial numbers
 * @param requestedQuantity - The requested quantity
 * @returns The actual quantity that should be used
 */
export function getEnforcedQuantity(hasSerial: boolean, requestedQuantity: number): number {
  return hasSerial ? 1 : requestedQuantity;
}