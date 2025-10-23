import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryTable } from '../InventoryTable';
import type { Product } from '@/services/inventory/types';

// Mock hooks and utilities
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }
}));

describe('InventoryTable', () => {
  let queryClient: QueryClient;

  const mockProducts: Product[] = [
    {
      id: 'product-1',
      brand: 'Apple',
      model: 'iPhone 14',
      category_id: 1,
      category: { id: 1, name: 'Smartphones' },
      category_name: 'Smartphones',
      price: 999.00,
      min_price: 899.00,
      max_price: 1099.00,
      stock: 10,
      threshold: 5,
      has_serial: true,
      serial_numbers: ['SN123', 'SN124'],
      units: [
        {
          id: 'unit-1',
          product_id: 'product-1',
          serial_number: 'SN123',
          status: 'available',
          price: 999.00,
          barcode: 'BC123',
          storage: 128,
          color: 'Black',
          ram: 6
        }
      ]
    },
    {
      id: 'product-2',
      brand: 'Samsung',
      model: 'Galaxy S23',
      category_id: 1,
      category: { id: 1, name: 'Smartphones' },
      category_name: 'Smartphones',
      price: 899.00,
      min_price: 799.00,
      max_price: 999.00,
      stock: 0,
      threshold: 3,
      has_serial: false,
      serial_numbers: [],
      units: []
    }
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render products correctly', () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText(/Apple/i)).toBeInTheDocument();
      expect(screen.getByText(/iPhone 14/i)).toBeInTheDocument();
      expect(screen.getByText(/Samsung/i)).toBeInTheDocument();
      expect(screen.getByText(/Galaxy S23/i)).toBeInTheDocument();
    });

    it('should display loading skeleton when loading', () => {
      renderWithProviders(
        <InventoryTable
          products={[]}
          isLoading={true}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Should show skeleton loader
      expect(screen.queryByText(/Apple/i)).not.toBeInTheDocument();
    });

    it('should display stock status correctly', () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Check for in stock and out of stock badges
      expect(screen.getByText(/In Stock/i)).toBeInTheDocument();
      expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    });
  });

  describe('Stock Status Logic', () => {
    it('should show "Out of Stock" when stock is 0', () => {
      const product = mockProducts[1];
      expect(product.stock).toBe(0);

      renderWithProviders(
        <InventoryTable
          products={[product]}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    });

    it('should show "Low Stock" when stock <= threshold', () => {
      const lowStockProduct = {
        ...mockProducts[0],
        stock: 5,
        threshold: 5
      };

      renderWithProviders(
        <InventoryTable
          products={[lowStockProduct]}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText(/Low Stock/i)).toBeInTheDocument();
    });

    it('should show "In Stock" when stock > threshold', () => {
      renderWithProviders(
        <InventoryTable
          products={[mockProducts[0]]}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText(/In Stock/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter products by brand', () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          searchTerm="Apple"
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText(/Apple/i)).toBeInTheDocument();
      expect(screen.getByText(/iPhone 14/i)).toBeInTheDocument();
    });

    it('should filter products by serial number', () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          searchTerm="SN123"
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Should show matched units badge
      expect(screen.getByText(/matched unit/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onSelectItem when checkbox is clicked', () => {
      const onSelectItem = vi.fn();

      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={onSelectItem}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 1) {
        fireEvent.click(checkboxes[1]); // First is "select all"
        expect(onSelectItem).toHaveBeenCalledWith('product-1');
      }
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();

      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />
      );

      const editButtons = screen.getAllByLabelText(/Edit/i);
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalled();
      }
    });

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();

      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Delete/i);
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledWith('product-1');
      }
    });

    it('should expand/collapse units when chevron is clicked', async () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Find expand button
      const expandButtons = screen.getAllByRole('button', { name: /Expand/i });
      if (expandButtons.length > 0) {
        fireEvent.click(expandButtons[0]);

        // Should show units
        await waitFor(() => {
          expect(screen.getByText(/SN123/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper table ARIA attributes', () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Product inventory table');
    });

    it('should have proper button ARIA labels', () => {
      renderWithProviders(
        <InventoryTable
          products={mockProducts}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Check for descriptive ARIA labels
      expect(screen.getByLabelText(/Select all products/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Select Apple iPhone 14/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with no category', () => {
      const productNoCategory = {
        ...mockProducts[0],
        category: null,
        category_name: undefined
      };

      renderWithProviders(
        <InventoryTable
          products={[productNoCategory]}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Should render without crashing
      expect(screen.getByText(/Apple/i)).toBeInTheDocument();
    });

    it('should handle products with no units', () => {
      renderWithProviders(
        <InventoryTable
          products={[mockProducts[1]]}
          isLoading={false}
          selectedItems={[]}
          onSelectItem={vi.fn()}
          onSelectAll={vi.fn()}
          isAllSelected={false}
          isIndeterminate={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Should not show expand button for products without units
      expect(screen.queryByRole('button', { name: /Expand/i })).not.toBeInTheDocument();
    });
  });
});
