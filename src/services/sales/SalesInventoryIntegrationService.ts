import { supabase } from '@/integrations/supabase/client';
import type { CreateSaleData } from './types';

// Validates sale items against current inventory state before creating a sale
export class SalesInventoryIntegrationService {
  static async validatePreSale(saleData: CreateSaleData): Promise<void> {
    const items = saleData.sale_items || [];
    if (!items.length) return;

    // Collect product ids and serials
    const productIds = Array.from(new Set(items.map(i => i.product_id)));
    const serials = items
      .filter(i => i.serial_number)
      .map(i => (i.serial_number || '').trim())
      .filter(Boolean);

    // Fetch products
    const { data: products, error: prodErr } = await supabase
      .from('products' as any)
      .select('id, has_serial, stock, min_price, max_price')
      .in('id', productIds);
    if (prodErr) throw new Error(`Impossibile leggere i prodotti: ${prodErr.message}`);

    const productsMap = new Map(((products as any[]) || []).map((p: any) => [p.id, p]));

    // Fetch effective stock for all involved products via database function
    const stockMap = new Map<string, number>();
    for (const productId of productIds) {
      const { data: effectiveStock, error: stockErr } = await supabase
        .rpc('get_product_effective_stock', { product_uuid: productId });
      if (stockErr) throw new Error(`Impossibile leggere lo stock per ${productId}: ${stockErr.message}`);
      stockMap.set(productId, Number(effectiveStock) || 0);
    }

    // Fetch product units for serial validation (batch by serial)
    let units: Array<any> = [];
    if (serials.length) {
      const { data: unitsData, error: unitsErr } = await supabase
        .from('product_units' as any)
        .select('id, product_id, serial_number, status, price, min_price, max_price')
        .in('product_id', productIds)
        .in('serial_number', serials);
      if (unitsErr) throw new Error(`Impossibile validare i seriali: ${unitsErr.message}`);
      units = unitsData || [];
    }

    const errors: string[] = [];

    // Local helper to find unit by product and serial
    const findUnit = (productId: string, serial?: string) =>
      units.find(u => u.product_id === productId && (u.serial_number || '').trim() === (serial || '').trim());

    // Validate each item
    for (const item of items) {
      const p: any = productsMap.get(item.product_id);
      if (!p) {
        errors.push(`Prodotto non trovato (ID: ${item.product_id})`);
        continue;
      }

      if (item.quantity <= 0) {
        errors.push(`Quantità non valida per ${item.product_id}`);
      }
      if (item.unit_price <= 0) {
        errors.push(`Prezzo non valido per ${item.product_id}`);
      }

      // Price guardrails using product-level if unit-level not present
      const checkPriceRange = (min?: number | null, max?: number | null) => {
        if (typeof min === 'number' && item.unit_price < min) {
          errors.push(`Prezzo inferiore al minimo per ${item.product_id} (min: ${min})`);
        }
        if (typeof max === 'number' && max > 0 && item.unit_price > max) {
          errors.push(`Prezzo superiore al massimo per ${item.product_id} (max: ${max})`);
        }
      };

      if (item.serial_number) {
        // Serialized unit must exist and be available
        const unit = findUnit(item.product_id, item.serial_number);
        if (!unit) {
          errors.push(`Unità non trovata per ${item.product_id} - seriale ${item.serial_number}`);
          continue;
        }
        if (unit.status !== 'available') {
          errors.push(`Unità non disponibile (stato: ${unit.status}) per seriale ${item.serial_number}`);
        }
        // Prefer unit-level min/max, fallback to product-level
        const min = typeof unit.min_price === 'number' ? unit.min_price : p.min_price;
        const max = typeof unit.max_price === 'number' ? unit.max_price : p.max_price;
        checkPriceRange(min, max);
        // Serialized items should be quantity 1 by design
        if (item.quantity !== 1) {
          errors.push(`Le unità serializzate devono avere quantità = 1 (seriale: ${item.serial_number})`);
        }
      } else {
        // Non-serialized: enforce stock >= quantity using effective stock
        const effectiveStock = stockMap.get(item.product_id) ?? 0;
        if (item.quantity > effectiveStock) {
          errors.push(`Stock insufficiente per il prodotto ${item.product_id}. Disponibile: ${effectiveStock}, Richiesto: ${item.quantity}`);
        }
        // Product-level price range
        checkPriceRange(p.min_price, p.max_price);
      }
    }

    // Prevent duplicate serials inside the same sale
    const serialSet = new Set<string>();
    for (const i of items) {
      const s = (i.serial_number || '').trim();
      if (!s) continue;
      if (serialSet.has(`${i.product_id}:${s}`)) {
        errors.push(`Numero seriale duplicato nello stesso ordine: ${s}`);
      }
      serialSet.add(`${i.product_id}:${s}`);
    }

    if (errors.length) {
      throw new Error(errors.join(' \n'));
    }
  }
}

export default SalesInventoryIntegrationService;
