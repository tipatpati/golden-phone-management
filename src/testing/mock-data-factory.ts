/**
 * Mock Data Factory for Comprehensive Testing
 * Generates realistic test data for all entities
 */

import type { Sale, CreateSaleData, SaleItem } from '@/services/sales/types';
import type { ProductFormData } from '@/components/inventory/forms/types';

export interface MockClient {
  id: string;
  type: 'individual' | 'business';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface MockEmployee {
  id: string;
  profile_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date: string;
  salary?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface MockProduct {
  id: string;
  brand: string;
  model: string;
  year?: number;
  category_id: number;
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  threshold: number;
  description?: string;
  supplier?: string;
  barcode?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  created_at: string;
  updated_at: string;
}

export interface MockRepair {
  id: string;
  repair_number: string;
  client_id?: string;
  technician_id?: string;
  device: string;
  imei?: string;
  issue: string;
  status: 'quoted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  cost: number;
  parts_cost: number;
  labor_cost: number;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MockSupplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface MockUserProfile {
  id: string;
  username?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'inventory_manager' | 'salesperson' | 'technician';
  created_at: string;
}

export class MockDataFactory {
  private static instance: MockDataFactory;
  private clientCounter = 1;
  private employeeCounter = 1;
  private productCounter = 1;
  private saleCounter = 1;
  private repairCounter = 1;
  private supplierCounter = 1;
  private userCounter = 1;

  static getInstance(): MockDataFactory {
    if (!MockDataFactory.instance) {
      MockDataFactory.instance = new MockDataFactory();
    }
    return MockDataFactory.instance;
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.clientCounter = 1;
    this.employeeCounter = 1;
    this.productCounter = 1;
    this.saleCounter = 1;
    this.repairCounter = 1;
    this.supplierCounter = 1;
    this.userCounter = 1;
  }

  /**
   * Generate a random date within the last year
   */
  private randomDate(daysBack: number = 365): string {
    const now = new Date();
    const pastDate = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
    return pastDate.toISOString();
  }

  /**
   * Generate a random UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a random phone number
   */
  private generatePhone(): string {
    const formats = [
      '+39 ### ### ####',
      '### ### ####',
      '+39-###-###-####'
    ];
    const format = formats[Math.floor(Math.random() * formats.length)];
    return format.replace(/#/g, () => Math.floor(Math.random() * 10).toString());
  }

  /**
   * Generate a random email
   */
  private generateEmail(firstName: string, lastName: string): string {
    const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    return `${username}@${domain}`;
  }

  /**
   * Create a mock client
   */
  createClient(overrides?: Partial<MockClient>): MockClient {
    const type = Math.random() > 0.6 ? 'business' : 'individual';
    const firstName = ['Mario', 'Luigi', 'Francesco', 'Giuseppe', 'Antonio'][Math.floor(Math.random() * 5)];
    const lastName = ['Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ricci'][Math.floor(Math.random() * 5)];
    const companyNames = ['Tech Solutions SRL', 'Digital Innovation SpA', 'Smart Systems', 'Future Tech', 'Digital Hub'];
    
    const baseClient: MockClient = {
      id: this.generateUUID(),
      type,
      status: 'active',
      created_at: this.randomDate(30),
      updated_at: this.randomDate(7),
      ...overrides
    };

    if (type === 'individual') {
      baseClient.first_name = firstName;
      baseClient.last_name = lastName;
      baseClient.email = this.generateEmail(firstName, lastName);
    } else {
      baseClient.company_name = companyNames[Math.floor(Math.random() * companyNames.length)];
      baseClient.contact_person = `${firstName} ${lastName}`;
      baseClient.email = this.generateEmail(firstName, lastName);
      baseClient.tax_id = `IT${Math.floor(Math.random() * 1000000000000).toString().padStart(11, '0')}`;
    }

    baseClient.phone = this.generatePhone();
    baseClient.address = `Via Roma ${Math.floor(Math.random() * 200) + 1}, Milano`;

    this.clientCounter++;
    return baseClient;
  }

  /**
   * Create multiple mock clients
   */
  createClients(count: number, overrides?: Partial<MockClient>): MockClient[] {
    return Array.from({ length: count }, () => this.createClient(overrides));
  }

  /**
   * Create a mock employee
   */
  createEmployee(overrides?: Partial<MockEmployee>): MockEmployee {
    const firstName = ['Marco', 'Luca', 'Alessandro', 'Andrea', 'Matteo'][Math.floor(Math.random() * 5)];
    const lastName = ['Ferrari', 'Conti', 'Galli', 'Martinelli', 'Esposito'][Math.floor(Math.random() * 5)];
    const departments = ['Sales', 'Technical', 'Administration', 'Management'];
    const positions = ['Sales Representative', 'Technician', 'Manager', 'Administrator'];

    const baseEmployee: MockEmployee = {
      id: this.generateUUID(),
      profile_id: this.generateUUID(),
      first_name: firstName,
      last_name: lastName,
      email: this.generateEmail(firstName, lastName),
      phone: this.generatePhone(),
      department: departments[Math.floor(Math.random() * departments.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      hire_date: this.randomDate(1000).split('T')[0],
      salary: Math.floor(Math.random() * 50000) + 25000,
      status: 'active',
      created_at: this.randomDate(100),
      updated_at: this.randomDate(10),
      ...overrides
    };

    this.employeeCounter++;
    return baseEmployee;
  }

  /**
   * Create multiple mock employees
   */
  createEmployees(count: number, overrides?: Partial<MockEmployee>): MockEmployee[] {
    return Array.from({ length: count }, () => this.createEmployee(overrides));
  }

  /**
   * Create a mock product
   */
  createProduct(overrides?: Partial<MockProduct>): MockProduct {
    const brands = ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'OnePlus'];
    const models = ['iPhone 15', 'Galaxy S24', 'P60 Pro', 'Mi 13', 'Nord 3'];
    const categories = [1, 2, 3, 4]; // Phones, Accessories, Spare Parts, Protection
    
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const price = Math.floor(Math.random() * 1000) + 100;
    const stock = Math.floor(Math.random() * 100) + 1;

    const baseProduct: MockProduct = {
      id: this.generateUUID(),
      brand,
      model,
      year: 2023 + Math.floor(Math.random() * 2),
      category_id: categories[Math.floor(Math.random() * categories.length)],
      price,
      min_price: price * 0.8,
      max_price: price * 1.2,
      stock,
      threshold: Math.floor(stock * 0.2),
      description: `${brand} ${model} - High quality device`,
      supplier: 'Tech Distributor SRL',
      barcode: Math.floor(Math.random() * 1000000000000).toString().padStart(13, '0'),
      has_serial: Math.random() > 0.5,
      created_at: this.randomDate(60),
      updated_at: this.randomDate(5),
      ...overrides
    };

    if (baseProduct.has_serial) {
      baseProduct.serial_numbers = Array.from({ length: Math.min(stock, 5) }, 
        () => `SN${Math.floor(Math.random() * 1000000).toString().padStart(8, '0')}`
      );
    }

    this.productCounter++;
    return baseProduct;
  }

  /**
   * Create multiple mock products
   */
  createProducts(count: number, overrides?: Partial<MockProduct>): MockProduct[] {
    return Array.from({ length: count }, () => this.createProduct(overrides));
  }

  /**
   * Create a mock sale
   */
  createSale(products: MockProduct[], clients: MockClient[], employees: MockEmployee[], overrides?: Partial<Sale>): Sale {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const salesperson = employees[Math.floor(Math.random() * employees.length)];
    const saleProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
    
    let subtotal = 0;
    const saleItems: SaleItem[] = saleProducts.map(product => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = product.price;
      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      return {
        id: this.generateUUID(),
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        serial_number: product.has_serial ? product.serial_numbers?.[0] : undefined,
        product: {
          id: product.id,
          brand: product.brand,
          model: product.model,
          year: product.year
        }
      };
    });

    const discountPercentage = Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * 0.22; // 22% VAT
    const totalAmount = discountedSubtotal + taxAmount;

    const paymentMethods = ['cash', 'card', 'bank_transfer', 'hybrid'];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    const baseSale: Sale = {
      id: this.generateUUID(),
      sale_number: `${new Date().getFullYear().toString().slice(-2)}${String(Date.now()).slice(-6)}`,
      client_id: client.id,
      salesperson_id: salesperson.profile_id || salesperson.id,
      status: 'completed',
      payment_method: paymentMethod as any,
      payment_type: paymentMethod === 'hybrid' ? 'hybrid' : 'single',
      subtotal,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      sale_date: this.randomDate(30),
      created_at: this.randomDate(30),
      updated_at: this.randomDate(5),
      client,
      salesperson: {
        id: salesperson.profile_id || salesperson.id,
        username: `${salesperson.first_name.toLowerCase()}.${salesperson.last_name.toLowerCase()}`
      },
      sale_items: saleItems,
      ...overrides
    };

    // Set payment amounts based on payment method
    if (paymentMethod === 'cash') {
      baseSale.cash_amount = totalAmount;
      baseSale.card_amount = 0;
      baseSale.bank_transfer_amount = 0;
    } else if (paymentMethod === 'card') {
      baseSale.cash_amount = 0;
      baseSale.card_amount = totalAmount;
      baseSale.bank_transfer_amount = 0;
    } else if (paymentMethod === 'bank_transfer') {
      baseSale.cash_amount = 0;
      baseSale.card_amount = 0;
      baseSale.bank_transfer_amount = totalAmount;
    } else {
      // Hybrid payment
      const cashPortion = Math.random() * totalAmount;
      const cardPortion = Math.random() * (totalAmount - cashPortion);
      const bankPortion = totalAmount - cashPortion - cardPortion;
      
      baseSale.cash_amount = Number(cashPortion.toFixed(2));
      baseSale.card_amount = Number(cardPortion.toFixed(2));
      baseSale.bank_transfer_amount = Number(bankPortion.toFixed(2));
    }

    this.saleCounter++;
    return baseSale;
  }

  /**
   * Create multiple mock sales
   */
  createSales(count: number, products: MockProduct[], clients: MockClient[], employees: MockEmployee[], overrides?: Partial<Sale>): Sale[] {
    return Array.from({ length: count }, () => this.createSale(products, clients, employees, overrides));
  }

  /**
   * Create a mock repair
   */
  createRepair(clients: MockClient[], technicians: MockEmployee[], overrides?: Partial<MockRepair>): MockRepair {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const technician = technicians[Math.floor(Math.random() * technicians.length)];
    const devices = ['iPhone 14', 'Samsung Galaxy S23', 'iPad Pro', 'MacBook Air', 'Samsung Tab'];
    const issues = ['Screen cracked', 'Battery replacement', 'Water damage', 'Software issue', 'Camera malfunction'];
    const statuses = ['quoted', 'in_progress', 'completed', 'cancelled'];
    const priorities = ['low', 'normal', 'high', 'urgent'];

    const laborCost = Math.floor(Math.random() * 200) + 50;
    const partsCost = Math.floor(Math.random() * 300) + 20;
    const totalCost = laborCost + partsCost;

    const baseRepair: MockRepair = {
      id: this.generateUUID(),
      repair_number: `RIP-${String(this.repairCounter).padStart(3, '0')}`,
      client_id: client.id,
      technician_id: technician.profile_id || technician.id,
      device: devices[Math.floor(Math.random() * devices.length)],
      imei: Math.floor(Math.random() * 1000000000000000).toString(),
      issue: issues[Math.floor(Math.random() * issues.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)] as any,
      priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
      cost: totalCost,
      parts_cost: partsCost,
      labor_cost: laborCost,
      estimated_completion_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Standard repair procedure',
      created_at: this.randomDate(60),
      updated_at: this.randomDate(5),
      ...overrides
    };

    if (baseRepair.status === 'completed') {
      baseRepair.actual_completion_date = this.randomDate(7);
    }

    this.repairCounter++;
    return baseRepair;
  }

  /**
   * Create multiple mock repairs
   */
  createRepairs(count: number, clients: MockClient[], technicians: MockEmployee[], overrides?: Partial<MockRepair>): MockRepair[] {
    return Array.from({ length: count }, () => this.createRepair(clients, technicians, overrides));
  }

  /**
   * Create a mock supplier
   */
  createSupplier(overrides?: Partial<MockSupplier>): MockSupplier {
    const names = ['Tech Distributors SRL', 'Mobile Parts SpA', 'Electronics Wholesale', 'Digital Supply Co', 'Smart Components'];
    const name = names[Math.floor(Math.random() * names.length)];
    const firstName = ['Marco', 'Alessandro', 'Giuseppe', 'Francesco', 'Antonio'][Math.floor(Math.random() * 5)];
    const lastName = ['Bianchi', 'Rossi', 'Ferrari', 'Romano', 'Greco'][Math.floor(Math.random() * 5)];

    const baseSupplier: MockSupplier = {
      id: this.generateUUID(),
      name,
      contact_person: `${firstName} ${lastName}`,
      email: this.generateEmail(firstName, lastName),
      phone: this.generatePhone(),
      address: `Via Industria ${Math.floor(Math.random() * 100) + 1}, Milano`,
      tax_id: `IT${Math.floor(Math.random() * 1000000000000).toString().padStart(11, '0')}`,
      payment_terms: '30 giorni',
      credit_limit: Math.floor(Math.random() * 100000) + 10000,
      notes: 'Fornitore affidabile',
      status: 'active',
      created_at: this.randomDate(365),
      updated_at: this.randomDate(30),
      ...overrides
    };

    this.supplierCounter++;
    return baseSupplier;
  }

  /**
   * Create multiple mock suppliers
   */
  createSuppliers(count: number, overrides?: Partial<MockSupplier>): MockSupplier[] {
    return Array.from({ length: count }, () => this.createSupplier(overrides));
  }

  /**
   * Create a mock user profile
   */
  createUserProfile(overrides?: Partial<MockUserProfile>): MockUserProfile {
    const roles = ['salesperson', 'technician', 'inventory_manager', 'manager', 'admin'];
    const role = roles[Math.floor(Math.random() * roles.length)];

    const baseProfile: MockUserProfile = {
      id: this.generateUUID(),
      username: `user${this.userCounter}`,
      role: role as any,
      created_at: this.randomDate(180),
      ...overrides
    };

    this.userCounter++;
    return baseProfile;
  }

  /**
   * Create multiple mock user profiles
   */
  createUserProfiles(count: number, overrides?: Partial<MockUserProfile>): MockUserProfile[] {
    return Array.from({ length: count }, () => this.createUserProfile(overrides));
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      clientsCreated: this.clientCounter - 1,
      employeesCreated: this.employeeCounter - 1,
      productsCreated: this.productCounter - 1,
      salesCreated: this.saleCounter - 1,
      repairsCreated: this.repairCounter - 1,
      suppliersCreated: this.supplierCounter - 1,
      usersCreated: this.userCounter - 1
    };
  }
}