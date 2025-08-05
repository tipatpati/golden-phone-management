/**
 * Inventory Management Test Suite
 * Tests product management, stock tracking, and barcode functionality
 */

import { createEnhancedTestRunner, expect, type TestSuite } from '../enhanced-test-runner';
import { MockDataFactory } from '../mock-data-factory';
import type { MockProduct } from '../mock-data-factory';

export const inventoryManagementTestSuite: TestSuite = {
  name: 'Inventory Management Tests',
  description: 'Comprehensive testing of inventory management functionality',
  setup: async () => {
    mockDataFactory.reset();
    console.log('Setting up inventory management tests...');
  },
  teardown: async () => {
    console.log('Inventory management tests completed');
  },
  tests: [
    {
      id: 'create-product-with-serial',
      name: 'Create Product with Serial Numbers',
      description: 'Test creation of products that require serial number tracking',
      tags: ['inventory', 'product', 'serial', 'critical'],
      test: async () => {
        // Arrange
        const productData = {
          brand: 'Apple',
          model: 'iPhone 15 Pro',
          year: 2024,
          category_id: 1,
          price: 1199.99,
          min_price: 1099.99,
          max_price: 1299.99,
          stock: 5,
          threshold: 2,
          has_serial: true,
          serial_numbers: ['SN001', 'SN002', 'SN003', 'SN004', 'SN005'],
          description: 'Latest iPhone model'
        };

        // Mock product service
        const mockProductService = {
          create: async (data: Partial<MockProduct>) => {
            // Validate serial numbers if has_serial is true
            if (data.has_serial) {
              if (!data.serial_numbers || data.serial_numbers.length === 0) {
                throw new Error('Serial numbers are required for products with serial tracking');
              }
              
              if (data.serial_numbers.length !== data.stock) {
                throw new Error('Number of serial numbers must match stock quantity');
              }
              
              // Check for duplicate serial numbers
              const uniqueSerials = new Set(data.serial_numbers);
              if (uniqueSerials.size !== data.serial_numbers.length) {
                throw new Error('Serial numbers must be unique');
              }
            }
            
            return {
              id: 'product-' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockProduct;
          }
        };

        // Act
        const result = await mockProductService.create(productData);

        // Assert
        expect.toExist(result.id);
        expect.toBeTruthy(result.has_serial);
        expect.toEqual(result.serial_numbers?.length, 5);
        expect.toEqual(result.stock, 5);
        expect.toContainElement(result.serial_numbers!, 'SN001');
        expect.toContainElement(result.serial_numbers!, 'SN005');
      }
    },

    {
      id: 'create-product-without-serial',
      name: 'Create Product without Serial Numbers',
      description: 'Test creation of products that do not require serial tracking',
      tags: ['inventory', 'product', 'no-serial'],
      test: async () => {
        // Arrange
        const productData = {
          brand: 'Samsung',
          model: 'USB Cable',
          category_id: 2,
          price: 15.99,
          min_price: 12.99,
          max_price: 19.99,
          stock: 100,
          threshold: 10,
          has_serial: false,
          description: 'Standard USB-C cable'
        };

        // Mock product service
        const mockProductService = {
          create: async (data: Partial<MockProduct>) => {
            // Validate that serial numbers are not provided if has_serial is false
            if (!data.has_serial && data.serial_numbers && data.serial_numbers.length > 0) {
              throw new Error('Serial numbers should not be provided for products without serial tracking');
            }
            
            return {
              id: mockDataFactory.getInstance()['generateUUID'](),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockProduct;
          }
        };

        // Act
        const result = await mockProductService.create(productData);

        // Assert
        expect.toExist(result.id);
        expect.toBeFalsy(result.has_serial);
        expect.toEqual(result.stock, 100);
        expect.toEqual(result.threshold, 10);
        expect.toBeTruthy(!result.serial_numbers || result.serial_numbers.length === 0);
      }
    },

    {
      id: 'stock-level-management',
      name: 'Stock Level Management',
      description: 'Test stock level updates and threshold alerts',
      tags: ['inventory', 'stock', 'threshold', 'critical'],
      test: async () => {
        // Arrange
        const product = mockDataFactory.createProduct({
          stock: 20,
          threshold: 5
        });

        // Mock stock service
        const mockStockService = {
          updateStock: async (productId: string, quantity: number, operation: 'add' | 'subtract') => {
            let newStock: number;
            
            if (operation === 'add') {
              newStock = product.stock + quantity;
            } else {
              newStock = product.stock - quantity;
              
              if (newStock < 0) {
                throw new Error('Insufficient stock');
              }
            }
            
            product.stock = newStock;
            
            return {
              ...product,
              stock: newStock,
              updated_at: new Date().toISOString()
            };
          },
          
          isLowStock: (product: MockProduct) => {
            return product.stock <= product.threshold;
          },
          
          getLowStockProducts: (products: MockProduct[]) => {
            return products.filter(p => mockStockService.isLowStock(p));
          }
        };

        // Act - Add stock
        let result = await mockStockService.updateStock(product.id, 10, 'add');
        expect.toEqual(result.stock, 30);

        // Act - Subtract stock
        result = await mockStockService.updateStock(product.id, 25, 'subtract');
        expect.toEqual(result.stock, 5);

        // Assert - Check low stock
        expect.toBeTruthy(mockStockService.isLowStock(result));

        // Act - Try to subtract more than available
        await expect.toThrowAsync(
          async () => await mockStockService.updateStock(product.id, 10, 'subtract'),
          'Insufficient stock'
        );

        // Test low stock detection
        const testProducts = [
          mockDataFactory.createProduct({ stock: 2, threshold: 5 }), // Low stock
          mockDataFactory.createProduct({ stock: 10, threshold: 5 }), // Normal stock
          mockDataFactory.createProduct({ stock: 1, threshold: 3 }) // Low stock
        ];

        const lowStockProducts = mockStockService.getLowStockProducts(testProducts);
        expect.toEqual(lowStockProducts.length, 2);
      }
    },

    {
      id: 'barcode-generation',
      name: 'Barcode Generation',
      description: 'Test automatic barcode generation for products',
      tags: ['inventory', 'barcode', 'generation'],
      test: async () => {
        // Mock barcode service
        const mockBarcodeService = {
          generatedBarcodes: new Set<string>(),
          
          generateBarcode: (type: 'EAN13' | 'CODE128' = 'EAN13') => {
            let barcode: string;
            
            if (type === 'EAN13') {
              // Generate 13-digit EAN barcode
              const countryCode = '800'; // Italy
              const manufacturerCode = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
              const productCode = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
              const baseCode = countryCode + manufacturerCode + productCode;
              
              // Calculate check digit
              let sum = 0;
              for (let i = 0; i < 12; i++) {
                const digit = parseInt(baseCode[i]);
                sum += (i % 2 === 0) ? digit : digit * 3;
              }
              const checkDigit = (10 - (sum % 10)) % 10;
              
              barcode = baseCode + checkDigit;
            } else {
              // Generate CODE128 barcode (alphanumeric)
              barcode = 'P' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
            }
            
            return barcode;
          },
          
          validateBarcode: (barcode: string, type: 'EAN13' | 'CODE128') => {
            if (type === 'EAN13') {
              return /^\d{13}$/.test(barcode);
            } else {
              return /^[A-Z0-9]{9,}$/.test(barcode);
            }
          },
          
          isUnique: (barcode: string) => {
            return !mockBarcodeService.generatedBarcodes.has(barcode);
          }
        };

        // Act - Generate EAN13 barcodes
        const ean13Barcode = mockBarcodeService.generateBarcode('EAN13');
        
        // Assert
        expect.toEqual(ean13Barcode.length, 13);
        expect.toBeTruthy(/^\d{13}$/.test(ean13Barcode));
        expect.toBeTruthy(mockBarcodeService.validateBarcode(ean13Barcode, 'EAN13'));
        expect.toBeTruthy(ean13Barcode.startsWith('800')); // Italy country code

        // Act - Generate CODE128 barcode
        const code128Barcode = mockBarcodeService.generateBarcode('CODE128');
        
        // Assert
        expect.toBeGreaterThan(code128Barcode.length, 8);
        expect.toBeTruthy(mockBarcodeService.validateBarcode(code128Barcode, 'CODE128'));
        expect.toBeTruthy(code128Barcode.startsWith('P'));

        // Test uniqueness
        mockBarcodeService.generatedBarcodes.add(ean13Barcode);
        expect.toBeFalsy(mockBarcodeService.isUnique(ean13Barcode));
        expect.toBeTruthy(mockBarcodeService.isUnique(code128Barcode));
      }
    },

    {
      id: 'serial-number-management',
      name: 'Serial Number Management',
      description: 'Test serial number assignment and tracking',
      tags: ['inventory', 'serial', 'tracking', 'critical'],
      test: async () => {
        // Arrange
        const product = mockDataFactory.createProduct({
          has_serial: true,
          stock: 5,
          serial_numbers: ['SN001', 'SN002', 'SN003', 'SN004', 'SN005']
        });

        // Mock serial service
        const mockSerialService = {
          assignSerial: (productId: string, quantity: number) => {
            if (!product.has_serial) {
              throw new Error('Product does not require serial numbers');
            }
            
            if (!product.serial_numbers || product.serial_numbers.length < quantity) {
              throw new Error('Not enough serial numbers available');
            }
            
            const assignedSerials = product.serial_numbers.slice(0, quantity);
            product.serial_numbers = product.serial_numbers.slice(quantity);
            product.stock -= quantity;
            
            return {
              assignedSerials,
              remainingStock: product.stock,
              remainingSerials: product.serial_numbers.length
            };
          },
          
          addSerials: (productId: string, newSerials: string[]) => {
            if (!product.has_serial) {
              throw new Error('Product does not require serial numbers');
            }
            
            // Check for duplicates
            const existingSerials = new Set(product.serial_numbers);
            const duplicates = newSerials.filter(serial => existingSerials.has(serial));
            
            if (duplicates.length > 0) {
              throw new Error(`Duplicate serial numbers: ${duplicates.join(', ')}`);
            }
            
            product.serial_numbers = [...product.serial_numbers!, ...newSerials];
            product.stock += newSerials.length;
            
            return {
              totalSerials: product.serial_numbers.length,
              totalStock: product.stock
            };
          },
          
          validateSerialFormat: (serial: string) => {
            // Serial should be alphanumeric, 3-20 characters
            return /^[A-Z0-9]{3,20}$/i.test(serial);
          }
        };

        // Act - Assign serial numbers
        let result = mockSerialService.assignSerial(product.id, 2);
        
        // Assert
        expect.toEqual(result.assignedSerials.length, 2);
        expect.toContainElement(result.assignedSerials, 'SN001');
        expect.toContainElement(result.assignedSerials, 'SN002');
        expect.toEqual(result.remainingStock, 3);
        expect.toEqual(result.remainingSerials, 3);

        // Act - Add new serial numbers
        const newSerials = ['SN006', 'SN007'];
        const addResult = mockSerialService.addSerials(product.id, newSerials);
        
        // Assert
        expect.toEqual(addResult.totalSerials, 5); // 3 remaining + 2 new
        expect.toEqual(addResult.totalStock, 5);

        // Test duplicate serial detection
        await expect.toThrow(
          () => mockSerialService.addSerials(product.id, ['SN006']),
          'Duplicate serial numbers'
        );

        // Test serial format validation
        expect.toBeTruthy(mockSerialService.validateSerialFormat('SN001'));
        expect.toBeTruthy(mockSerialService.validateSerialFormat('ABC123'));
        expect.toBeFalsy(mockSerialService.validateSerialFormat('SN')); // Too short
        expect.toBeFalsy(mockSerialService.validateSerialFormat('SN-001')); // Invalid character
      }
    },

    {
      id: 'product-price-validation',
      name: 'Product Price Validation',
      description: 'Test price validation and range constraints',
      tags: ['inventory', 'price', 'validation'],
      test: async () => {
        // Mock price validation service
        const mockPriceService = {
          validatePrices: (price: number, minPrice: number, maxPrice: number) => {
            const errors: string[] = [];
            
            if (price <= 0) {
              errors.push('Price must be greater than 0');
            }
            
            if (minPrice < 0) {
              errors.push('Minimum price cannot be negative');
            }
            
            if (maxPrice <= 0) {
              errors.push('Maximum price must be greater than 0');
            }
            
            if (minPrice > price) {
              errors.push('Minimum price cannot be greater than regular price');
            }
            
            if (maxPrice < price) {
              errors.push('Maximum price cannot be less than regular price');
            }
            
            if (minPrice > maxPrice) {
              errors.push('Minimum price cannot be greater than maximum price');
            }
            
            return {
              valid: errors.length === 0,
              errors
            };
          },
          
          calculatePriceRange: (basePrice: number, marginPercent: number = 20) => {
            const margin = (basePrice * marginPercent) / 100;
            return {
              minPrice: Number((basePrice - margin).toFixed(2)),
              maxPrice: Number((basePrice + margin).toFixed(2))
            };
          }
        };

        // Test valid prices
        let validation = mockPriceService.validatePrices(100, 80, 120);
        expect.toBeTruthy(validation.valid);
        expect.toEqual(validation.errors.length, 0);

        // Test invalid price (zero)
        validation = mockPriceService.validatePrices(0, 80, 120);
        expect.toBeFalsy(validation.valid);
        expect.toContain(validation.errors[0], 'greater than 0');

        // Test invalid range (min > max)
        validation = mockPriceService.validatePrices(100, 120, 80);
        expect.toBeFalsy(validation.valid);
        expect.toBeTruthy(validation.errors.some(error => error.includes('Minimum price cannot be greater than maximum price')));

        // Test price range calculation
        const priceRange = mockPriceService.calculatePriceRange(100, 20);
        expect.toEqual(priceRange.minPrice, 80);
        expect.toEqual(priceRange.maxPrice, 120);

        // Test with custom margin
        const customRange = mockPriceService.calculatePriceRange(50, 10);
        expect.toEqual(customRange.minPrice, 45);
        expect.toEqual(customRange.maxPrice, 55);
      }
    },

    {
      id: 'bulk-inventory-operations',
      name: 'Bulk Inventory Operations',
      description: 'Test bulk operations like stock updates and price changes',
      tags: ['inventory', 'bulk', 'operations'],
      test: async () => {
        // Arrange
        const products = mockDataFactory.createProducts(10);

        // Mock bulk operations service
        const mockBulkService = {
          bulkUpdateStock: async (updates: Array<{ productId: string; quantity: number; operation: 'add' | 'subtract' }>) => {
            const results: Array<{ productId: string; success: boolean; error?: string; newStock?: number }> = [];
            
            for (const update of updates) {
              const product = products.find(p => p.id === update.productId);
              
              if (!product) {
                results.push({
                  productId: update.productId,
                  success: false,
                  error: 'Product not found'
                });
                continue;
              }
              
              let newStock: number;
              if (update.operation === 'add') {
                newStock = product.stock + update.quantity;
              } else {
                newStock = product.stock - update.quantity;
                
                if (newStock < 0) {
                  results.push({
                    productId: update.productId,
                    success: false,
                    error: 'Insufficient stock'
                  });
                  continue;
                }
              }
              
              product.stock = newStock;
              results.push({
                productId: update.productId,
                success: true,
                newStock
              });
            }
            
            return {
              totalUpdates: updates.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
              results
            };
          },
          
          bulkUpdatePrices: async (updates: Array<{ productId: string; price: number; minPrice?: number; maxPrice?: number }>) => {
            const results: Array<{ productId: string; success: boolean; error?: string }> = [];
            
            for (const update of updates) {
              const product = products.find(p => p.id === update.productId);
              
              if (!product) {
                results.push({
                  productId: update.productId,
                  success: false,
                  error: 'Product not found'
                });
                continue;
              }
              
              if (update.price <= 0) {
                results.push({
                  productId: update.productId,
                  success: false,
                  error: 'Price must be greater than 0'
                });
                continue;
              }
              
              product.price = update.price;
              if (update.minPrice !== undefined) product.min_price = update.minPrice;
              if (update.maxPrice !== undefined) product.max_price = update.maxPrice;
              
              results.push({
                productId: update.productId,
                success: true
              });
            }
            
            return {
              totalUpdates: updates.length,
              successful: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
              results
            };
          }
        };

        // Act - Bulk stock update
        const stockUpdates = [
          { productId: products[0].id, quantity: 10, operation: 'add' as const },
          { productId: products[1].id, quantity: 5, operation: 'subtract' as const },
          { productId: 'non-existent', quantity: 1, operation: 'add' as const }
        ];

        const stockResult = await mockBulkService.bulkUpdateStock(stockUpdates);

        // Assert stock updates
        expect.toEqual(stockResult.totalUpdates, 3);
        expect.toEqual(stockResult.successful, 2);
        expect.toEqual(stockResult.failed, 1);

        const successfulStockUpdates = stockResult.results.filter(r => r.success);
        expect.toEqual(successfulStockUpdates.length, 2);

        // Act - Bulk price update
        const priceUpdates = [
          { productId: products[0].id, price: 199.99, minPrice: 179.99, maxPrice: 219.99 },
          { productId: products[1].id, price: -10 }, // Invalid price
          { productId: products[2].id, price: 99.99 }
        ];

        const priceResult = await mockBulkService.bulkUpdatePrices(priceUpdates);

        // Assert price updates
        expect.toEqual(priceResult.totalUpdates, 3);
        expect.toEqual(priceResult.successful, 2);
        expect.toEqual(priceResult.failed, 1);

        const failedPriceUpdate = priceResult.results.find(r => !r.success);
        expect.toContain(failedPriceUpdate?.error, 'greater than 0');
      }
    },

    {
      id: 'inventory-search-filtering',
      name: 'Inventory Search and Filtering',
      description: 'Test product search and filtering functionality',
      tags: ['inventory', 'search', 'filter'],
      test: async () => {
        // Arrange
        const products = [
          mockDataFactory.createProduct({ brand: 'Apple', model: 'iPhone 15', category_id: 1, stock: 10 }),
          mockDataFactory.createProduct({ brand: 'Samsung', model: 'Galaxy S24', category_id: 1, stock: 5 }),
          mockDataFactory.createProduct({ brand: 'Apple', model: 'USB Cable', category_id: 2, stock: 0 }),
          mockDataFactory.createProduct({ brand: 'Huawei', model: 'P60 Pro', category_id: 1, stock: 15 }),
          mockDataFactory.createProduct({ brand: 'Generic', model: 'Screen Protector', category_id: 4, stock: 2 })
        ];

        // Mock search service
        const mockSearchService = {
          searchProducts: (query: string) => {
            const lowerQuery = query.toLowerCase();
            return products.filter(product => {
              const searchableText = `${product.brand} ${product.model} ${product.description || ''}`.toLowerCase();
              return searchableText.includes(lowerQuery);
            });
          },
          
          filterProducts: (filters: {
            brand?: string;
            categoryId?: number;
            inStock?: boolean;
            lowStock?: boolean;
            priceRange?: { min: number; max: number };
          }) => {
            return products.filter(product => {
              // Brand filter
              if (filters.brand && product.brand.toLowerCase() !== filters.brand.toLowerCase()) {
                return false;
              }
              
              // Category filter
              if (filters.categoryId && product.category_id !== filters.categoryId) {
                return false;
              }
              
              // Stock filters
              if (filters.inStock && product.stock <= 0) {
                return false;
              }
              
              if (filters.lowStock && product.stock > product.threshold) {
                return false;
              }
              
              // Price range filter
              if (filters.priceRange) {
                if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
                  return false;
                }
              }
              
              return true;
            });
          }
        };

        // Act & Assert - Search by brand
        let results = mockSearchService.searchProducts('apple');
        expect.toEqual(results.length, 2);
        expect.toBeTruthy(results.every(p => p.brand.toLowerCase() === 'apple'));

        // Act & Assert - Search by model
        results = mockSearchService.searchProducts('iphone');
        expect.toEqual(results.length, 1);
        expect.toEqual(results[0].model, 'iPhone 15');

        // Act & Assert - Filter by brand
        results = mockSearchService.filterProducts({ brand: 'Samsung' });
        expect.toEqual(results.length, 1);
        expect.toEqual(results[0].brand, 'Samsung');

        // Act & Assert - Filter by category (phones)
        results = mockSearchService.filterProducts({ categoryId: 1 });
        expect.toEqual(results.length, 3);
        expect.toBeTruthy(results.every(p => p.category_id === 1));

        // Act & Assert - Filter in stock products
        results = mockSearchService.filterProducts({ inStock: true });
        expect.toEqual(results.length, 4);
        expect.toBeTruthy(results.every(p => p.stock > 0));

        // Act & Assert - Filter low stock products
        results = mockSearchService.filterProducts({ lowStock: true });
        const lowStockProducts = results.filter(p => p.stock <= p.threshold);
        expect.toBeGreaterThan(lowStockProducts.length, 0);

        // Act & Assert - Filter by price range
        results = mockSearchService.filterProducts({ 
          priceRange: { min: 100, max: 500 } 
        });
        expect.toBeTruthy(results.every(p => p.price >= 100 && p.price <= 500));
      }
    }
  ]
};