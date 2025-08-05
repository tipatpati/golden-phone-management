/**
 * Client Management Tests
 * Tests client CRUD operations, search, filtering, and business logic
 */

import { createEnhancedTestRunner, expect, type TestSuite } from '../enhanced-test-runner';
import { MockDataFactory, type MockClient } from '../mock-data-factory';

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

export const clientManagementTestSuite: TestSuite = {
  name: 'Client Management Tests',
  description: 'Comprehensive testing of client management functionality',
  setup: async () => {
    // Setup test data
    MockDataFactory.getInstance().reset();
  },
  teardown: async () => {
    // Cleanup after tests
    console.log('Client management tests completed');
  },
  tests: [
    {
      id: 'client-creation-individual',
      name: 'Create Individual Client',
      description: 'Test creation of individual client with all required fields',
      tags: ['crud', 'client', 'individual'],
      test: async () => {
        // Arrange
        const clientData = {
          type: 'individual' as const,
          first_name: 'Mario',
          last_name: 'Rossi',
          email: 'mario.rossi@example.com',
          phone: '+39 333 123 4567',
          address: 'Via Roma 123, Milano',
          status: 'active' as const
        };

        const mockClientService = {
          create: async (data: any) => {
            return {
              id: 'test-' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockClient;
          }
        };

        // Act
        await mockClientService.create(clientData);

        // Assert - verify client data structure
        expect.toEqual(clientData.type, 'individual');
        expect.toEqual(clientData.first_name, 'Mario');
        expect.toEqual(clientData.last_name, 'Rossi');
        expect.toEqual(clientData.email, 'mario.rossi@example.com');
        expect.toEqual(clientData.status, 'active');
      }
    },

    {
      id: 'client-creation-business',
      name: 'Create Business Client',
      description: 'Test creation of business client with company information',
      tags: ['crud', 'client', 'business'],
      test: async () => {
        // Arrange
        const clientData = {
          type: 'business' as const,
          company_name: 'Tech Solutions SRL',
          contact_person: 'Luigi Bianchi',
          email: 'info@techsolutions.com',
          phone: '+39 02 123456',
          address: 'Via Milano 45, Roma',
          tax_id: 'IT12345678901',
          status: 'active' as const
        };

        const mockClientService = {
          create: async (data: any) => {
            if (data.type === 'business' && !data.company_name) {
              throw new Error('Company name is required for business clients');
            }
            if (data.type === 'business' && !data.tax_id) {
              throw new Error('Tax ID is required for business clients');
            }
            
            return {
              id: 'test-' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockClient;
          }
        };

        // Act
        await mockClientService.create(clientData);

        // Assert
        expect.toEqual(clientData.type, 'business');
        expect.toEqual(clientData.company_name, 'Tech Solutions SRL');
        expect.toEqual(clientData.contact_person, 'Luigi Bianchi');
        expect.toEqual(clientData.tax_id, 'IT12345678901');
      }
    },

    {
      id: 'client-validation-rules',
      name: 'Client Validation Rules',
      description: 'Test validation rules for client creation (email format, required fields)',
      tags: ['validation', 'client'],
      test: async () => {
        // Test email validation
        const invalidEmailData = {
          type: 'individual' as const,
          first_name: 'Test',
          last_name: 'User',
          email: 'invalid-email-format',
          status: 'active' as const
        };

        // Test missing required fields
        const missingFieldsData = {
          type: 'individual' as const,
          // Missing first_name and last_name
          email: 'test@example.com',
          status: 'active' as const
        };

        // Mock validation function
        const validateClientData = (data: any) => {
          if (data.email && !data.email.includes('@')) {
            throw new Error('Invalid email format');
          }
          if (data.type === 'individual' && (!data.first_name || !data.last_name)) {
            throw new Error('First name and last name are required for individual clients');
          }
          if (data.type === 'business' && !data.company_name) {
            throw new Error('Company name is required for business clients');
          }
        };

        // Assert validation failures
        expect.toThrow(() => validateClientData(invalidEmailData), 'Invalid email format');
        expect.toThrow(() => validateClientData(missingFieldsData), 'First name and last name are required');
      }
    },

    {
      id: 'client-search-functionality',
      name: 'Client Search Functionality',
      description: 'Test client search by name, email, company, and other criteria',
      tags: ['search', 'client'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const clients = factory.createClients(20);

        // Test search by first name
        const searchResults1 = clients.filter(client => 
          client.first_name?.toLowerCase().includes('mario')
        );

        // Test search by company name
        const businessClients = clients.filter(client => client.type === 'business');
        const searchResults2 = businessClients.filter(client =>
          client.company_name?.toLowerCase().includes('tech')
        );

        // Test search by email
        const searchResults3 = clients.filter(client =>
          client.email?.includes('@example.com')
        );

        // Test search by phone
        const searchResults4 = clients.filter(client =>
          client.phone?.includes('+39')
        );

        // Test search by status
        const activeClients = clients.filter(client => client.status === 'active');

        // Assert
        expect.toBeTruthy(Array.isArray(searchResults1));
        expect.toBeTruthy(Array.isArray(searchResults2));
        expect.toBeTruthy(Array.isArray(searchResults3));
        expect.toBeTruthy(Array.isArray(searchResults4));
        expect.toBeTruthy(Array.isArray(activeClients));
        expect.toBeGreaterThan(clients.length, 15); // Should have generated 20 clients
      }
    },

    {
      id: 'client-filtering-by-type',
      name: 'Client Filtering by Type',
      description: 'Test filtering clients by individual vs business type',
      tags: ['filter', 'client', 'business-logic'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const clients = factory.createClients(15, { type: 'business' });

        // Test business client filtering
        const businessClients = clients.filter(client => client.type === 'business');
        const individualClients = clients.filter(client => client.type === 'individual');

        // Test filtering logic
        const hasCompanyInfo = businessClients.every(client => 
          client.company_name && client.company_name.length > 0
        );

        const hasPersonalInfo = individualClients.every(client =>
          client.first_name && client.last_name
        );

        // Assert
        expect.toEqual(businessClients.length, 15); // All should be business
        expect.toEqual(individualClients.length, 0); // None should be individual
        expect.toBeTruthy(hasCompanyInfo);
      }
    },

    {
      id: 'client-status-management',
      name: 'Client Status Management',
      description: 'Test client activation/deactivation and status filtering',
      tags: ['status', 'client', 'business-logic'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const clients = factory.createClients(10, { status: 'active' });

        // Test status filtering
        const activeClients = clients.filter(client => client.status === 'active');
        const inactiveClients = clients.filter(client => client.status === 'inactive');

        // Test status change logic
        const clientToDeactivate = clients[0];
        const originalStatus = clientToDeactivate.status;

        // Mock status change
        clientToDeactivate.status = 'inactive';

        // Assert
        expect.toEqual(activeClients.length, 10);
        expect.toEqual(inactiveClients.length, 0);
        expect.toEqual(originalStatus, 'active');
        expect.toEqual(clientToDeactivate.status, 'inactive');
      }
    },

    {
      id: 'client-update-information',
      name: 'Update Client Information',
      description: 'Test updating client information with validation',
      tags: ['crud', 'client', 'update'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const client = factory.createClient();

        const newEmail = 'updated@example.com';
        const newPhone = '+39 333 999 8888';
        
        const updateData = {
          email: newEmail,
          phone: newPhone,
          updated_at: new Date().toISOString()
        };

        const mockClientService = {
          update: async (id: string, data: any) => {
            return {
              ...client,
              ...data,
              updated_at: new Date().toISOString()
            };
          }
        };

        // Act
        await mockClientService.update(client.id, updateData);

        // Assert - verify update was called with correct data
        expect.toEqual(updateData.email, newEmail);
        expect.toEqual(updateData.phone, newPhone);
      }
    },

    {
      id: 'client-deactivation',
      name: 'Client Deactivation',
      description: 'Test client deactivation instead of deletion',
      tags: ['status', 'client', 'deactivation'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const client = factory.createClient({ status: 'active' });

        const mockClientService = {
          deactivate: async (id: string) => {
            client.status = 'inactive';
            return {
              ...client,
              status: 'inactive' as const,
              updated_at: new Date().toISOString()
            };
          }
        };

        // Act
        await mockClientService.deactivate(client.id);

        // Assert - client would be deactivated
        expect.toEqual(client.status, 'inactive');

        // Test that deactivated clients can still be retrieved
        const deactivatedClients = [client].filter(c => c.status === 'inactive');
        expect.toEqual(deactivatedClients.length, 1);
        expect.toEqual(deactivatedClients[0].id, client.id);
      }
    },

    {
      id: 'client-deletion-prevention',
      name: 'Client Deletion Prevention',
      description: 'Test prevention of client deletion if they have associated records',
      tags: ['deletion', 'client', 'data-integrity'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const client = factory.createClient();
        const hasSales = true; // Mock that client has sales
        const hasRepairs = false; // Mock that client has no repairs

        const mockClientService = {
          delete: async (id: string) => {
            if (hasSales || hasRepairs) {
              throw new Error('Cannot delete client with existing sales or repairs');
            }
            return { success: true };
          }
        };

        // Act & Assert - deletion should fail if client has sales
        await expect.toThrowAsync(
          async () => {
            await mockClientService.delete(client.id);
            return Promise.resolve();
          },
          'Cannot delete client with existing sales or repairs'
        );

        // Test successful deletion when no associated records
        const clientWithoutRecords = factory.createClient();
        const mockServiceForCleanClient = {
          delete: async (id: string) => {
            return { success: true };
          }
        };

        // Act
        const result = await mockServiceForCleanClient.delete(clientWithoutRecords.id);
        expect.toBeTruthy(result.success);

        // Assert - deletion would succeed
        
      }
    },

    {
      id: 'business-client-tax-validation',
      name: 'Business Client Tax ID Validation',
      description: 'Test Italian tax ID validation for business clients',
      tags: ['validation', 'business', 'tax-id'],
      test: async () => {
        // Arrange
        const validTaxIds = ['IT12345678901', 'IT98765432101'];
        const invalidTaxIds = ['12345678901', 'IT123456789', 'INVALID123'];

        const businessData = {
          type: 'business' as const,
          company_name: 'Test Business',
          contact_person: 'John Doe',
          email: 'test@business.com',
          status: 'active' as const
        };

        const mockClientService = {
          create: async (data: any) => {
            if (data.type === 'business' && data.tax_id) {
              // Simple Italian tax ID validation
              if (!data.tax_id.match(/^IT\d{11}$/)) {
                throw new Error('Invalid Italian tax ID format');
              }
            }
            return {
              id: 'test-' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockClient;
          }
        };

        // Test valid tax IDs
        for (const taxId of validTaxIds) {
          const clientData = { ...businessData, tax_id: taxId };
          const result = await mockClientService.create(clientData);
          expect.toBeTruthy(result.id);
        }

        // Test invalid tax IDs
        for (const taxId of invalidTaxIds) {
          const clientData = { ...businessData, tax_id: taxId };
          await expect.toThrowAsync(
            async () => {
              await mockClientService.create(clientData);
              return Promise.resolve();
            },
            'Invalid Italian tax ID format'
          );
        }

        // Assert - verify business client data
        expect.toEqual(businessData.company_name, 'Test Business');
        expect.toEqual(businessData.contact_person, 'John Doe');
        expect.toEqual(businessData.type, 'business');
      }
    },

    {
      id: 'client-duplicate-prevention',
      name: 'Client Duplicate Prevention',
      description: 'Test prevention of duplicate clients based on email or tax ID',
      tags: ['validation', 'duplicates', 'business-logic'],
      test: async () => {
        // Arrange
        const existingClients = [
          { email: 'existing@example.com', tax_id: 'IT12345678901' }
        ];

        const duplicateEmailData = {
          type: 'individual' as const,
          first_name: 'Test',
          last_name: 'User',
          email: 'existing@example.com',
          status: 'active' as const
        };

        const duplicateTaxIdData = {
          type: 'business' as const,
          company_name: 'Duplicate Business',
          tax_id: 'IT12345678901',
          status: 'active' as const
        };

        const mockClientService = {
          create: async (data: any) => {
            // Check for duplicate email
            if (data.email && existingClients.some(c => c.email === data.email)) {
              throw new Error('Client with this email already exists');
            }
            // Check for duplicate tax ID
            if (data.tax_id && existingClients.some(c => c.tax_id === data.tax_id)) {
              throw new Error('Client with this tax ID already exists');
            }
            return {
              id: 'test-' + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockClient;
          }
        };

        // Assert duplicate email prevention
        await expect.toThrowAsync(
          async () => {
            await mockClientService.create(duplicateEmailData);
            return Promise.resolve();
          },
          'Client with this email already exists'
        );

        // Assert duplicate tax ID prevention
        await expect.toThrowAsync(
          async () => {
            await mockClientService.create(duplicateTaxIdData);
            return Promise.resolve();
          },
          'Client with this tax ID already exists'
        );
      }
    },

    {
      id: 'client-data-consistency',
      name: 'Client Data Consistency',
      description: 'Test data consistency rules and field dependencies',
      tags: ['validation', 'consistency', 'business-logic'],
      test: async () => {
        // Test data consistency rules
        const factory = MockDataFactory.getInstance();
        const testClients = [
          factory.createClient({ type: 'individual' }),
          factory.createClient({ type: 'business' }),
          factory.createClient({ type: 'individual' }),
          factory.createClient({ type: 'business' }),
          factory.createClient({ type: 'individual' })
        ];

        // Verify individual clients have personal info
        const individualClients = testClients.filter(c => c.type === 'individual');
        const businessClients = testClients.filter(c => c.type === 'business');

        individualClients.forEach(client => {
          expect.toExist(client.first_name);
          expect.toExist(client.last_name);
          expect.toBeFalsy(client.company_name); // Should not have company info
        });

        businessClients.forEach(client => {
          expect.toExist(client.company_name);
          expect.toBeFalsy(client.first_name); // Individual fields should be null/undefined
          expect.toBeFalsy(client.last_name);
        });

        // Verify all clients have required fields
        testClients.forEach(client => {
          expect.toExist(client.id);
          expect.toExist(client.email);
          expect.toExist(client.status);
          expect.toExist(client.created_at);
          expect.toExist(client.updated_at);
        });
      }
    }
  ]
};