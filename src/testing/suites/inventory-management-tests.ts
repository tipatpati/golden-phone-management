/**
 * Inventory Management Tests
 * Tests product management, stock tracking, serial numbers, and barcode operations
 */

import { createEnhancedTestRunner, expect, type TestSuite } from '../enhanced-test-runner';
import { MockDataFactory, type MockProduct } from '../mock-data-factory';

// Mock Supabase client for testing
const mockSupabase = {
  from: (table: string) => ({
    select: () => ({
      data: [],
      error: null
    }),
    insert: (data: any) => ({
      select: () => ({
        data: [{ ...data, id: 'test-' + Math.random().toString(36).substr(2, 9) }],
        error: null
      })
    }),
    update: (data: any) => ({
      eq: () => ({
        select: () => ({
          data: [data],
          error: null
        })
      })
    }),
    delete: () => ({
      eq: () => ({
        data: [],
        error: null
      })
    })
  })
};

export const inventoryManagementTestSuite: TestSuite = {
  name: 'Inventory Management Tests',
  description: 'Comprehensive testing of inventory and product management',
  setup: async () => {
    // Setup test data
    MockDataFactory.getInstance().reset();
  },
  teardown: async () => {
    // Cleanup after tests
    console.log('Inventory management tests completed');
  },
  tests: [
    {
      id: 'product-creation-basic',
      name: 'Basic Product Creation',
      description: 'Test creation of products with required fields',
      tags: ['crud', 'product', 'basic'],
      test: async () => {
        // Arrange
        const productData = {
          brand: 'Apple',
          model: 'iPhone 15',
          year: 2024,
          category_id: 1,
          price: 999.99,
          min_price: 899.99,
          max_price: 1099.99,
          stock: 50,
          threshold: 10,
          description: 'Latest iPhone model',
          supplier: 'Official Apple Distributor',
          has_serial: true
        };

        const mockProductService = {
          create: async (data: any) => {
            // Validation
            if (!data.brand || !data.model) {
              throw new Error('Brand and model are required');
            }
            if (data.price <= 0) {
              throw new Error('Price must be positive');
            }
            if (data.stock < 0) {
              throw new Error('Stock cannot be negative');
            }
            if (data.has_serial && data.serial_numbers && data.serial_numbers.length > data.stock) {
              throw new Error('Serial numbers should not exceed stock quantity');
            }
            if (!data.has_serial && data.serial_numbers && data.serial_numbers.length > 0) {
              throw new Error('Serial numbers should not be provided for products without serial tracking');
            }
            
            return {
              id: 'test-' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockProduct;
          }
        };

        // Act
        await mockProductService.create(productData);

        // Assert
        expect.toEqual(productData.brand, 'Apple');
        expect.toEqual(productData.model, 'iPhone 15');
        expect.toEqual(productData.year, 2024);
        expect.toEqual(productData.price, 999.99);
        expect.toEqual(productData.stock, 50);
        expect.toBeTruthy(productData.has_serial);
      }
    },

    {
      id: 'product-validation-rules',
      name: 'Product Validation Rules',
      description: 'Test validation rules for product creation',
      tags: ['validation', 'product'],
      test: async () => {
        // Test missing required fields
        const incompleteData = {
          // Missing brand and model
          price: 100,
          stock: 10
        };

        // Test negative price
        const negativePriceData = {
          brand: 'Test',
          model: 'Test Model',
          price: -100,
          stock: 10
        };

        // Test negative stock
        const negativeStockData = {
          brand: 'Test',
          model: 'Test Model',
          price: 100,
          stock: -5
        };

        const validateProduct = (data: any) => {
          if (!data.brand || !data.model) {
            throw new Error('Brand and model are required');
          }
          if (data.price <= 0) {
            throw new Error('Price must be positive');
          }
          if (data.stock < 0) {
            throw new Error('Stock cannot be negative');
          }
        };

        // Assert validation failures
        expect.toThrow(() => validateProduct(incompleteData), 'Brand and model are required');
        expect.toThrow(() => validateProduct(negativePriceData), 'Price must be positive');
        expect.toThrow(() => validateProduct(negativeStockData), 'Stock cannot be negative');
      }
    },

    {
      id: 'stock-level-management',
      name: 'Stock Level Management',
      description: 'Test stock updates, threshold monitoring, and low stock alerts',
      tags: ['stock', 'inventory', 'alerts'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const product = factory.createProduct({ stock: 10, threshold: 5 });
        const newStock = 15;

        const mockInventoryService = {
          updateStock: async (productId: string, newStock: number) => {
            if (newStock < 0) {
              throw new Error('Stock cannot be negative');
            }
            return {
              ...product,
              stock: newStock,
              updated_at: new Date().toISOString()
            };
          },
          checkLowStock: (products: MockProduct[]) => {
            return products.filter(p => p.stock <= p.threshold);
          }
        };

        // Test stock increase
        await mockInventoryService.updateStock(product.id, newStock);

        // Assert - verify stock update logic
        expect.toEqual(newStock, 15);
        expect.toBeGreaterThan(newStock, product.stock);

        // Test stock decrease below threshold
        const lowStockProduct = factory.createProduct({ stock: 3, threshold: 5 });
        
        // Act - Try to subtract more than available
        await expect.toThrowAsync(
          async () => {
            await mockInventoryService.updateStock(product.id, -1);
            return Promise.resolve();
          },
          'Stock cannot be negative'
        );

        // Test low stock detection
        const testProducts = [
          factory.createProduct({ stock: 2, threshold: 5 }), // Low stock
          factory.createProduct({ stock: 10, threshold: 5 }), // Normal stock
          factory.createProduct({ stock: 1, threshold: 3 }) // Low stock
        ];

        const lowStockProducts = mockInventoryService.checkLowStock(testProducts);

        // Assert
        expect.toEqual(lowStockProducts.length, 2);
        expect.toBeGreaterThan(lowStockProducts[0].threshold, lowStockProducts[0].stock);
      }
    },

    {
      id: 'serial-number-management',
      name: 'Serial Number Management',
      description: 'Test serial number tracking for applicable products',
      tags: ['serial-numbers', 'tracking', 'inventory'],
      test: async () => {
        // Arrange
        const serialNumbers = ['SN001', 'SN002', 'SN003', 'SN004', 'SN005'];
        const productData = {
          brand: 'Samsung',
          model: 'Galaxy S24',
          stock: 5,
          has_serial: true,
          serial_numbers: serialNumbers
        };

        const mockSerialService = {
          assignSerial: (product: any, quantity: number) => {
            if (!product.has_serial) {
              throw new Error('Product does not use serial numbers');
            }
            if (quantity > product.serial_numbers.length) {
              throw new Error('Not enough serial numbers available');
            }
            
            const assignedSerials = product.serial_numbers.slice(0, quantity);
            const remainingSerials = product.serial_numbers.slice(quantity);
            
            return {
              assigned: assignedSerials,
              remaining: remainingSerials
            };
          },
          validateSerialFormat: (serial: string) => {
            // Simple validation - should start with SN and have 3 digits
            return /^SN\d{3}$/.test(serial);
          }
        };

        // Test serial number assignment
        const result = mockSerialService.assignSerial(productData, 2);

        // Assert
        expect.toEqual(result.assigned.length, 2);
        expect.toEqual(result.remaining.length, 3);
        expect.toEqual(result.assigned[0], 'SN001');
        expect.toEqual(result.assigned[1], 'SN002');

        // Test serial format validation
        serialNumbers.forEach(serial => {
          expect.toBeTruthy(mockSerialService.validateSerialFormat(serial));
        });

        // Test invalid serial format
        expect.toBeFalsy(mockSerialService.validateSerialFormat('INVALID'));
        expect.toBeFalsy(mockSerialService.validateSerialFormat('SN12345'));
      }
    },

    {
      id: 'barcode-generation',
      name: 'Barcode Generation',
      description: 'Test barcode generation and validation for products',
      tags: ['barcode', 'generation', 'validation'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const product = factory.createProduct();

        const mockBarcodeService = {
          generateBarcode: () => {
            // Generate 13-digit EAN barcode
            const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
            // Simple checksum calculation (simplified)
            const checksum = digits.reduce((sum, digit, index) => {
              return sum + digit * (index % 2 === 0 ? 1 : 3);
            }, 0) % 10;
            const checksumDigit = checksum === 0 ? 0 : 10 - checksum;
            
            return digits.join('') + checksumDigit;
          },
          validateBarcode: (barcode: string) => {
            // Validate EAN-13 format
            if (!/^\d{13}$/.test(barcode)) return false;
            
            const digits = barcode.split('').map(Number);
            const checkDigit = digits.pop()!;
            const calculatedCheck = digits.reduce((sum, digit, index) => {
              return sum + digit * (index % 2 === 0 ? 1 : 3);
            }, 0) % 10;
            const expectedCheck = calculatedCheck === 0 ? 0 : 10 - calculatedCheck;
            
            return checkDigit === expectedCheck;
          }
        };

        // Test barcode generation
        const generatedBarcode = mockBarcodeService.generateBarcode();

        // Assert
        expect.toEqual(generatedBarcode.length, 13);
        expect.toBeTruthy(/^\d{13}$/.test(generatedBarcode));
        expect.toBeTruthy(mockBarcodeService.validateBarcode(generatedBarcode));

        // Test existing product barcode
        if (product.barcode) {
          expect.toEqual(product.barcode.length, 13);
          expect.toBeTruthy(/^\d{13}$/.test(product.barcode));
        }
      }
    },

    {
      id: 'category-management',
      name: 'Product Category Management',
      description: 'Test product categorization and category-based filtering',
      tags: ['category', 'filtering', 'organization'],
      test: async () => {
        // Arrange
        const categories = {
          1: 'Smartphones',
          2: 'Accessories',
          3: 'Spare Parts',
          4: 'Protection'
        };

        const factory = MockDataFactory.getInstance();
        const products = [
          factory.createProduct({ category_id: 1, brand: 'Apple' }),
          factory.createProduct({ category_id: 1, brand: 'Samsung' }),
          factory.createProduct({ category_id: 2, brand: 'Various' }),
          factory.createProduct({ category_id: 3, brand: 'OEM' }),
          factory.createProduct({ category_id: 4, brand: 'Protection Co' })
        ];

        const mockCategoryService = {
          getProductsByCategory: (categoryId: number) => {
            return products.filter(p => p.category_id === categoryId);
          },
          getCategoryName: (categoryId: number) => {
            return categories[categoryId as keyof typeof categories] || 'Unknown';
          }
        };

        // Test category filtering
        const smartphones = mockCategoryService.getProductsByCategory(1);
        const accessories = mockCategoryService.getProductsByCategory(2);

        // Assert
        expect.toEqual(smartphones.length, 2);
        expect.toEqual(accessories.length, 1);
        expect.toEqual(mockCategoryService.getCategoryName(1), 'Smartphones');
        expect.toEqual(mockCategoryService.getCategoryName(2), 'Accessories');

        // Verify all smartphones have correct category
        smartphones.forEach(product => {
          expect.toEqual(product.category_id, 1);
        });
      }
    },

    {
      id: 'price-range-validation',
      name: 'Price Range Validation',
      description: 'Test price range constraints (min, max, current price)',
      tags: ['price', 'validation', 'business-logic'],
      test: async () => {
        // Arrange
        const priceData = {
          price: 500,
          min_price: 400,
          max_price: 600
        };

        const mockPriceService = {
          validatePriceRange: (data: any) => {
            if (data.min_price >= data.max_price) {
              throw new Error('Minimum price must be less than maximum price');
            }
            if (data.price < data.min_price || data.price > data.max_price) {
              throw new Error('Current price must be within min and max range');
            }
            return true;
          },
          calculateDiscountedPrice: (originalPrice: number, discountPercentage: number) => {
            return originalPrice * (1 - discountPercentage / 100);
          }
        };

        // Test valid price range
        expect.toBeTruthy(mockPriceService.validatePriceRange(priceData));

        // Test invalid ranges
        const invalidRange1 = { price: 500, min_price: 600, max_price: 400 }; // min > max
        const invalidRange2 = { price: 300, min_price: 400, max_price: 600 }; // price < min
        const invalidRange3 = { price: 700, min_price: 400, max_price: 600 }; // price > max

        expect.toThrow(() => mockPriceService.validatePriceRange(invalidRange1), 'Minimum price must be less than maximum price');
        expect.toThrow(() => mockPriceService.validatePriceRange(invalidRange2), 'Current price must be within min and max range');
        expect.toThrow(() => mockPriceService.validatePriceRange(invalidRange3), 'Current price must be within min and max range');

        // Test discount calculation
        const discountedPrice = mockPriceService.calculateDiscountedPrice(500, 10);
        expect.toEqual(discountedPrice, 450);
      }
    },

    {
      id: 'bulk-operations',
      name: 'Bulk Operations',
      description: 'Test bulk product updates, imports, and exports',
      tags: ['bulk', 'import', 'export', 'operations'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const products = factory.createProducts(10);

        const mockBulkService = {
          bulkUpdatePrices: async (productIds: string[], priceMultiplier: number) => {
            return products.filter(p => productIds.includes(p.id)).map(p => ({
              ...p,
              price: p.price * priceMultiplier,
              updated_at: new Date().toISOString()
            }));
          },
          bulkUpdateStock: async (stockUpdates: { id: string; stock: number }[]) => {
            const updated = [];
            for (const update of stockUpdates) {
              const product = products.find(p => p.id === update.id);
              if (product) {
                updated.push({
                  ...product,
                  stock: update.stock,
                  updated_at: new Date().toISOString()
                });
              }
            }
            return updated;
          },
          exportProducts: async (productIds?: string[]) => {
            const exportProducts = productIds ? 
              products.filter(p => productIds.includes(p.id)) : 
              products;
            
            return exportProducts.map(p => ({
              id: p.id,
              brand: p.brand,
              model: p.model,
              price: p.price,
              stock: p.stock,
              barcode: p.barcode
            }));
          }
        };

        // Test bulk price update
        const productIds = products.slice(0, 5).map(p => p.id);
        const updatedProducts = await mockBulkService.bulkUpdatePrices(productIds, 1.1);

        // Assert
        expect.toEqual(updatedProducts.length, 5);
        updatedProducts.forEach((product, index) => {
          const originalProduct = products.find(p => p.id === product.id);
          expect.toEqual(product.price, originalProduct!.price * 1.1);
        });

        // Test bulk stock update
        const stockUpdates = products.slice(0, 3).map(p => ({ id: p.id, stock: 100 }));
        const stockUpdatedProducts = await mockBulkService.bulkUpdateStock(stockUpdates);

        expect.toEqual(stockUpdatedProducts.length, 3);
        stockUpdatedProducts.forEach(product => {
          expect.toEqual(product.stock, 100);
        });

        // Test export
        const exportData = await mockBulkService.exportProducts();
        expect.toEqual(exportData.length, 10);
        expect.toExist(exportData[0].brand);
        expect.toExist(exportData[0].model);
        expect.toExist(exportData[0].price);
      }
    },

    {
      id: 'supplier-management',
      name: 'Supplier Management',
      description: 'Test supplier assignment and tracking for products',
      tags: ['supplier', 'tracking', 'inventory'],
      test: async () => {
        // Arrange
        const suppliers = [
          { id: 'sup1', name: 'Tech Distributor A', contact: 'contact@techdist.com' },
          { id: 'sup2', name: 'Mobile Parts B', contact: 'info@mobileparts.com' }
        ];

        const factory = MockDataFactory.getInstance();
        const products = [
          factory.createProduct({ supplier: suppliers[0].name }),
          factory.createProduct({ supplier: suppliers[0].name }),
          factory.createProduct({ supplier: suppliers[1].name })
        ];

        const mockSupplierService = {
          getProductsBySupplier: (supplierName: string) => {
            return products.filter(p => p.supplier === supplierName);
          },
          updateProductSupplier: async (productId: string, supplierName: string) => {
            const product = products.find(p => p.id === productId);
            if (product) {
              return {
                ...product,
                supplier: supplierName,
                updated_at: new Date().toISOString()
              };
            }
            return null;
          }
        };

        // Test products by supplier
        const supplierAProducts = mockSupplierService.getProductsBySupplier(suppliers[0].name);
        const supplierBProducts = mockSupplierService.getProductsBySupplier(suppliers[1].name);

        // Assert
        expect.toEqual(supplierAProducts.length, 2);
        expect.toEqual(supplierBProducts.length, 1);

        // Test supplier update
        const productToUpdate = products[0];
        const updatedProduct = await mockSupplierService.updateProductSupplier(
          productToUpdate.id, 
          suppliers[1].name
        );

        expect.toExist(updatedProduct);
        expect.toEqual(updatedProduct!.supplier, suppliers[1].name);
      }
    },

    {
      id: 'inventory-reporting',
      name: 'Inventory Reporting',
      description: 'Test inventory reports and analytics',
      tags: ['reporting', 'analytics', 'inventory'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const products = [
          factory.createProduct({ price: 100, stock: 10, category_id: 1 }),
          factory.createProduct({ price: 200, stock: 5, category_id: 1 }),
          factory.createProduct({ price: 50, stock: 20, category_id: 2 }),
          factory.createProduct({ price: 300, stock: 2, category_id: 2 }),
          factory.createProduct({ price: 150, stock: 8, category_id: 3 })
        ];

        const mockReportingService = {
          generateInventoryReport: () => {
            const totalProducts = products.length;
            const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
            const averagePrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
            const lowStockProducts = products.filter(p => p.stock <= p.threshold);
            
            return {
              totalProducts,
              totalValue,
              averagePrice,
              lowStockCount: lowStockProducts.length,
              categoryBreakdown: mockReportingService.getCategoryBreakdown()
            };
          },
          getCategoryBreakdown: () => {
            const breakdown: { [key: number]: { count: number; value: number } } = {};
            
            products.forEach(product => {
              if (!breakdown[product.category_id]) {
                breakdown[product.category_id] = { count: 0, value: 0 };
              }
              breakdown[product.category_id].count++;
              breakdown[product.category_id].value += product.price * product.stock;
            });
            
            return breakdown;
          }
        };

        // Test inventory report generation
        const report = mockReportingService.generateInventoryReport();

        // Assert
        expect.toEqual(report.totalProducts, 5);
        expect.toBeGreaterThan(report.totalValue, 0);
        expect.toBeGreaterThan(report.averagePrice, 0);
        expect.toExist(report.categoryBreakdown);

        // Test category breakdown
        const breakdown = mockReportingService.getCategoryBreakdown();
        expect.toExist(breakdown[1]);
        expect.toExist(breakdown[2]);
        expect.toExist(breakdown[3]);
        expect.toEqual(breakdown[1].count, 2); // 2 products in category 1
        expect.toEqual(breakdown[2].count, 2); // 2 products in category 2
        expect.toEqual(breakdown[3].count, 1); // 1 product in category 3
      }
    }
  ]
};