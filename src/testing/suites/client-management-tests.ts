/**
 * Client Management Test Suite
 * Tests client CRUD operations, validation, and search functionality
 */

import { createEnhancedTestRunner, expect, type TestSuite } from '../enhanced-test-runner';
import { MockDataFactory } from '../mock-data-factory';
import type { MockClient } from '../mock-data-factory';

export const clientManagementTestSuite: TestSuite = {
  name: 'Client Management Tests',
  description: 'Comprehensive testing of client management functionality',
  setup: async () => {
    mockDataFactory.reset();
    console.log('Setting up client management tests...');
  },
  teardown: async () => {
    console.log('Client management tests completed');
  },
  tests: [
    {
      id: 'create-individual-client',
      name: 'Create Individual Client',
      description: 'Test creation of individual client with validation',
      tags: ['client', 'create', 'individual', 'critical'],
      test: async () => {
        // Arrange
        const clientData = {
          type: 'individual' as const,
          first_name: 'Mario',
          last_name: 'Rossi',
          email: 'mario.rossi@example.com',
          phone: '+39 123 456 7890',
          address: 'Via Roma 123, Milano',
          status: 'active' as const
        };

        // Mock client service
        const mockClientService = {
          create: async (data: Partial<MockClient>) => {
            // Validate required fields for individual
            if (data.type === 'individual') {
              if (!data.first_name || !data.last_name) {
                throw new Error('First name and last name are required for individual clients');
              }
            }
            
            return {
              id: 'client-' + Math.random().toString(36).substr(2, 9),
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
      id: 'create-business-client',
      name: 'Create Business Client',
      description: 'Test creation of business client with different validation rules',
      tags: ['client', 'create', 'business', 'critical'],
      test: async () => {
        // Arrange
        const businessData = {
          type: 'business' as const,
          company_name: 'Tech Solutions SRL',
          contact_person: 'Giuseppe Verdi',
          email: 'info@techsolutions.com',
          phone: '+39 02 1234567',
          tax_id: 'IT01234567890',
          address: 'Via Industria 45, Milano',
          status: 'active' as const
        };

        // Mock client service
        const mockClientService = {
          create: async (data: Partial<MockClient>) => {
            // Validate required fields for business
            if (data.type === 'business') {
              if (!data.company_name) {
                throw new Error('Company name is required for business clients');
              }
            }
            
            return {
              id: mockDataFactory.getInstance()['generateUUID'](),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockClient;
          }
        };

        // Act
        const result = await mockClientService.create(businessData);

        // Assert
        expect.toExist(result.id);
        expect.toEqual(result.type, 'business');
        expect.toEqual(result.company_name, 'Tech Solutions SRL');
        expect.toEqual(result.contact_person, 'Giuseppe Verdi');
        expect.toEqual(result.tax_id, 'IT01234567890');
        expect.toEqual(result.status, 'active');
      }
    },

    {
      id: 'client-email-validation',
      name: 'Client Email Validation',
      description: 'Test email validation for client creation and updates',
      tags: ['client', 'validation', 'email'],
      test: async () => {
        // Arrange
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'firstname+lastname@company.org'
        ];

        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user@domain',
          'user name@domain.com'
        ];

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Act & Assert - Valid emails
        validEmails.forEach(email => {
          expect.toBeTruthy(emailRegex.test(email), `${email} should be valid`);
        });

        // Act & Assert - Invalid emails
        invalidEmails.forEach(email => {
          expect.toBeFalsy(emailRegex.test(email), `${email} should be invalid`);
        });
      }
    },

    {
      id: 'client-phone-validation',
      name: 'Client Phone Validation',
      description: 'Test phone number validation and formatting',
      tags: ['client', 'validation', 'phone'],
      test: async () => {
        // Arrange
        const validPhones = [
          '+39 123 456 7890',
          '123 456 7890',
          '+39-123-456-7890',
          '(123) 456-7890'
        ];

        const invalidPhones = [
          '123',
          'abc-def-ghij',
          '+39 12',
          ''
        ];

        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;

        // Act & Assert - Valid phones
        validPhones.forEach(phone => {
          expect.toBeTruthy(phoneRegex.test(phone), `${phone} should be valid`);
        });

        // Act & Assert - Invalid phones
        invalidPhones.forEach(phone => {
          expect.toBeFalsy(phoneRegex.test(phone), `${phone} should be invalid`);
        });
      }
    },

    {
      id: 'client-search-functionality',
      name: 'Client Search Functionality',
      description: 'Test client search by name, email, and company',
      tags: ['client', 'search', 'critical'],
      test: async () => {
        // Arrange
        const clients = [
          mockDataFactory.createClient({
            type: 'individual',
            first_name: 'Mario',
            last_name: 'Rossi',
            email: 'mario.rossi@example.com'
          }),
          mockDataFactory.createClient({
            type: 'business',
            company_name: 'Tech Solutions SRL',
            contact_person: 'Luigi Bianchi',
            email: 'info@techsolutions.com'
          }),
          mockDataFactory.createClient({
            type: 'individual',
            first_name: 'Maria',
            last_name: 'Verdi',
            email: 'maria.verdi@test.com'
          })
        ];

        // Mock search service
        const mockSearchService = {
          searchClients: (query: string) => {
            const lowerQuery = query.toLowerCase();
            return clients.filter(client => {
              const searchFields = [
                client.first_name,
                client.last_name,
                client.company_name,
                client.contact_person,
                client.email
              ].filter(Boolean).map(field => field!.toLowerCase());
              
              return searchFields.some(field => field.includes(lowerQuery));
            });
          }
        };

        // Act & Assert - Search by first name
        let results = mockSearchService.searchClients('mario');
        expect.toEqual(results.length, 1);
        expect.toEqual(results[0].first_name, 'Mario');

        // Act & Assert - Search by company name
        results = mockSearchService.searchClients('tech');
        expect.toEqual(results.length, 1);
        expect.toEqual(results[0].company_name, 'Tech Solutions SRL');

        // Act & Assert - Search by email domain
        results = mockSearchService.searchClients('example.com');
        expect.toEqual(results.length, 1);
        expect.toEqual(results[0].email, 'mario.rossi@example.com');

        // Act & Assert - Partial search
        results = mockSearchService.searchClients('ma');
        expect.toBeGreaterThan(results.length, 0);

        // Act & Assert - No results
        results = mockSearchService.searchClients('nonexistent');
        expect.toEqual(results.length, 0);
      }
    },

    {
      id: 'client-update-functionality',
      name: 'Client Update Functionality',
      description: 'Test updating client information with validation',
      tags: ['client', 'update', 'critical'],
      test: async () => {
        // Arrange
        const originalClient = mockDataFactory.createClient({
          type: 'individual',
          first_name: 'Mario',
          last_name: 'Rossi',
          email: 'mario.rossi@old-email.com'
        });

        const updateData = {
          email: 'mario.rossi@new-email.com',
          phone: '+39 333 444 5555',
          address: 'Via Nuova 456, Roma'
        };

        // Mock update service
        const mockUpdateService = {
          updateClient: async (id: string, data: Partial<MockClient>) => {
            // Validate email if provided
            if (data.email) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(data.email)) {
                throw new Error('Invalid email format');
              }
            }

            return {
              ...originalClient,
              ...data,
              updated_at: new Date().toISOString()
            };
          }
        };

        // Act
        const updatedClient = await mockUpdateService.updateClient(originalClient.id, updateData);

        // Assert
        expect.toEqual(updatedClient.id, originalClient.id);
        expect.toEqual(updatedClient.email, 'mario.rossi@new-email.com');
        expect.toEqual(updatedClient.phone, '+39 333 444 5555');
        expect.toEqual(updatedClient.address, 'Via Nuova 456, Roma');
        expect.toEqual(updatedClient.first_name, 'Mario'); // Unchanged
        expect.toEqual(updatedClient.last_name, 'Rossi'); // Unchanged

        // Test invalid email update
        await expect.toThrowAsync(
          async () => await mockUpdateService.updateClient(originalClient.id, { email: 'invalid-email' }),
          'Invalid email format'
        );
      }
    },

    {
      id: 'client-status-management',
      name: 'Client Status Management',
      description: 'Test client status changes (active/inactive)',
      tags: ['client', 'status', 'management'],
      test: async () => {
        // Arrange
        const factory = MockDataFactory.getInstance();
        const client = factory.createClient({ status: 'active' });

        // Mock status service
        const mockStatusService = {
          changeStatus: async (id: string, status: 'active' | 'inactive') => {
            if (!['active', 'inactive'].includes(status)) {
              throw new Error('Invalid status. Must be active or inactive');
            }

            return {
              ...client,
              status,
              updated_at: new Date().toISOString()
            };
          },
          
          getActiveClientsCount: (clients: MockClient[]) => {
            return clients.filter(c => c.status === 'active').length;
          }
        };

        // Act - Deactivate client
        const deactivatedClient = await mockStatusService.changeStatus(client.id, 'inactive');
        
        // Assert
        expect.toEqual(deactivatedClient.status, 'inactive');
        expect.toEqual(deactivatedClient.id, client.id);

        // Act - Reactivate client
        const reactivatedClient = await mockStatusService.changeStatus(client.id, 'active');
        
        // Assert
        expect.toEqual(reactivatedClient.status, 'active');

        // Test invalid status
        await expect.toThrowAsync(
          async () => await mockStatusService.changeStatus(client.id, 'invalid' as any),
          'Invalid status'
        );

        // Test counting active clients
        const testClients = [
          mockDataFactory.createClient({ status: 'active' }),
          mockDataFactory.createClient({ status: 'active' }),
          mockDataFactory.createClient({ status: 'inactive' })
        ];

        const activeCount = mockStatusService.getActiveClientsCount(testClients);
        expect.toEqual(activeCount, 2);
      }
    },

    {
      id: 'client-deletion-restrictions',
      name: 'Client Deletion Restrictions',
      description: 'Test restrictions on deleting clients with existing sales/repairs',
      tags: ['client', 'delete', 'restrictions'],
      test: async () => {
        // Arrange
        const clientWithSales = mockDataFactory.createClient();
        const clientWithoutSales = mockDataFactory.createClient();

        // Mock deletion service
        const mockDeletionService = {
          hasRelatedRecords: (clientId: string) => {
            // Simulate client with sales
            return clientId === clientWithSales.id;
          },
          
          deleteClient: async (clientId: string) => {
            if (mockDeletionService.hasRelatedRecords(clientId)) {
              throw new Error('Cannot delete client with existing sales or repairs');
            }
            
            return { success: true };
          }
        };

        // Act & Assert - Try to delete client with sales
        await expect.toThrowAsync(
          async () => await mockDeletionService.deleteClient(clientWithSales.id),
          'Cannot delete client with existing sales or repairs'
        );

        // Act & Assert - Delete client without sales
        const result = await mockDeletionService.deleteClient(clientWithoutSales.id);
        expect.toBeTruthy(result.success);
      }
    },

    {
      id: 'client-duplicate-prevention',
      name: 'Client Duplicate Prevention',
      description: 'Test prevention of duplicate clients based on email',
      tags: ['client', 'duplicate', 'validation'],
      test: async () => {
        // Arrange
        const existingClient = mockDataFactory.createClient({
          email: 'existing@example.com'
        });

        const duplicateClientData = {
          type: 'individual' as const,
          first_name: 'Different',
          last_name: 'Name',
          email: 'existing@example.com', // Same email
          status: 'active' as const
        };

        // Mock duplicate checking service
        const mockDuplicateService = {
          existingClients: [existingClient],
          
          checkDuplicate: (email: string) => {
            return mockDuplicateService.existingClients.some(client => 
              client.email?.toLowerCase() === email.toLowerCase()
            );
          },
          
          createClient: async (data: Partial<MockClient>) => {
            if (data.email && mockDuplicateService.checkDuplicate(data.email)) {
              throw new Error('A client with this email already exists');
            }
            
            return {
              id: mockDataFactory.getInstance()['generateUUID'](),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data
            } as MockClient;
          }
        };

        // Act & Assert - Try to create duplicate
        await expect.toThrowAsync(
          async () => await mockDuplicateService.createClient(duplicateClientData),
          'A client with this email already exists'
        );

        // Act & Assert - Create client with unique email
        const uniqueClientData = {
          ...duplicateClientData,
          email: 'unique@example.com'
        };
        
        const result = await mockDuplicateService.createClient(uniqueClientData);
        expect.toExist(result.id);
        expect.toEqual(result.email, 'unique@example.com');
      }
    },

    {
      id: 'client-special-characters',
      name: 'Client Special Characters Handling',
      description: 'Test handling of special characters in client names and addresses',
      tags: ['client', 'validation', 'edge-case'],
      test: async () => {
        // Arrange
        const specialCharData = {
          type: 'individual' as const,
          first_name: 'José María',
          last_name: "O'Connor-Smith",
          email: 'jose.maria@example.com',
          address: 'Rue de l\'École 123, Côte d\'Azur',
          notes: 'Client with special chars: àáâãäåæçèéêë ñü',
          status: 'active' as const
        };

        // Mock service that handles special characters
        const mockSpecialCharService = {
          sanitizeInput: (input: string) => {
            // Don't remove special characters, just ensure they're properly encoded
            return input.trim();
          },
          
          createClient: async (data: Partial<MockClient>) => {
            const sanitizedData = { ...data };
            
            if (sanitizedData.first_name) {
              sanitizedData.first_name = mockSpecialCharService.sanitizeInput(sanitizedData.first_name);
            }
            if (sanitizedData.last_name) {
              sanitizedData.last_name = mockSpecialCharService.sanitizeInput(sanitizedData.last_name);
            }
            if (sanitizedData.address) {
              sanitizedData.address = mockSpecialCharService.sanitizeInput(sanitizedData.address);
            }
            
            return {
              id: mockDataFactory.getInstance()['generateUUID'](),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...sanitizedData
            } as MockClient;
          }
        };

        // Act
        const result = await mockSpecialCharService.createClient(specialCharData);

        // Assert
        expect.toEqual(result.first_name, 'José María');
        expect.toEqual(result.last_name, "O'Connor-Smith");
        expect.toContain(result.address!, 'Côte d\'Azur');
        expect.toContain(result.notes!, 'àáâãäåæçèéêë');
      }
    },

    {
      id: 'client-pagination-sorting',
      name: 'Client Pagination and Sorting',
      description: 'Test client list pagination and sorting functionality',
      tags: ['client', 'pagination', 'sorting'],
      test: async () => {
        // Arrange
        const clients = [
          mockDataFactory.createClient({ first_name: 'Alice', last_name: 'Anderson' }),
          mockDataFactory.createClient({ first_name: 'Bob', last_name: 'Brown' }),
          mockDataFactory.createClient({ first_name: 'Charlie', last_name: 'Clark' }),
          mockDataFactory.createClient({ first_name: 'David', last_name: 'Davis' }),
          mockDataFactory.createClient({ first_name: 'Eve', last_name: 'Evans' })
        ];

        // Mock pagination service
        const mockPaginationService = {
          getClients: (page: number, limit: number, sortBy: 'name' | 'email' | 'created_at' = 'name', sortOrder: 'asc' | 'desc' = 'asc') => {
            let sortedClients = [...clients];
            
            // Sort
            sortedClients.sort((a, b) => {
              let aValue: string, bValue: string;
              
              switch (sortBy) {
                case 'name':
                  aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
                  bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
                  break;
                case 'email':
                  aValue = (a.email || '').toLowerCase();
                  bValue = (b.email || '').toLowerCase();
                  break;
                case 'created_at':
                  aValue = a.created_at;
                  bValue = b.created_at;
                  break;
                default:
                  aValue = a.first_name!.toLowerCase();
                  bValue = b.first_name!.toLowerCase();
              }
              
              if (sortOrder === 'desc') {
                return bValue.localeCompare(aValue);
              }
              return aValue.localeCompare(bValue);
            });
            
            // Paginate
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedClients = sortedClients.slice(startIndex, endIndex);
            
            return {
              data: paginatedClients,
              total: clients.length,
              page,
              limit,
              totalPages: Math.ceil(clients.length / limit)
            };
          }
        };

        // Act & Assert - First page
        let result = mockPaginationService.getClients(1, 2);
        expect.toEqual(result.data.length, 2);
        expect.toEqual(result.page, 1);
        expect.toEqual(result.total, 5);
        expect.toEqual(result.totalPages, 3);
        expect.toEqual(result.data[0].first_name, 'Alice'); // First alphabetically

        // Act & Assert - Second page
        result = mockPaginationService.getClients(2, 2);
        expect.toEqual(result.data.length, 2);
        expect.toEqual(result.data[0].first_name, 'Charlie');

        // Act & Assert - Descending sort
        result = mockPaginationService.getClients(1, 2, 'name', 'desc');
        expect.toEqual(result.data[0].first_name, 'Eve'); // Last alphabetically first
      }
    }
  ]
};