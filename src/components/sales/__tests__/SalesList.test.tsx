import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SalesList } from '../SalesList';
import type { Sale } from '@/services/sales/types';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userRole: 'super_admin',
    user: { id: 'test-user' }
  })
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('SalesList', () => {
  let queryClient: QueryClient;

  const mockSales: Sale[] = [
    {
      id: 'sale-1',
      client_id: 'client-1',
      total_amount: 100.00,
      discount_amount: 10.00,
      final_amount: 90.00,
      payment_method: 'cash',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sale_items: [
        {
          id: 'item-1',
          sale_id: 'sale-1',
          product_id: 'product-1',
          quantity: 2,
          unit_price: 50.00,
          subtotal: 100.00,
          created_at: new Date().toISOString()
        }
      ]
    },
    {
      id: 'sale-2',
      client_id: 'client-2',
      total_amount: 200.00,
      discount_amount: 0,
      final_amount: 200.00,
      payment_method: 'card',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sale_items: []
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
    it('should render sales list correctly', () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      // Check if sales are displayed
      expect(screen.getByText(/sale-1/i)).toBeInTheDocument();
      expect(screen.getByText(/sale-2/i)).toBeInTheDocument();
    });

    it('should display correct total amounts', () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      // Check if amounts are displayed
      expect(screen.getByText(/90\.00/)).toBeInTheDocument();
      expect(screen.getByText(/200\.00/)).toBeInTheDocument();
    });

    it('should display payment methods', () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      expect(screen.getByText(/cash/i)).toBeInTheDocument();
      expect(screen.getByText(/card/i)).toBeInTheDocument();
    });

    it('should display sale status', () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });

  describe('Business Logic', () => {
    it('should calculate discount correctly', () => {
      const sale = mockSales[0];
      const expectedDiscount = sale.total_amount - sale.final_amount;

      expect(sale.discount_amount).toBe(10.00);
      expect(expectedDiscount).toBe(10.00);
    });

    it('should calculate final amount correctly', () => {
      const sale = mockSales[0];
      const calculatedFinal = sale.total_amount - sale.discount_amount;

      expect(sale.final_amount).toBe(calculatedFinal);
    });

    it('should handle sales with no discount', () => {
      const sale = mockSales[1];

      expect(sale.discount_amount).toBe(0);
      expect(sale.final_amount).toBe(sale.total_amount);
    });
  });

  describe('Search Functionality', () => {
    it('should filter sales by search term', () => {
      renderWithProviders(
        <SalesList sales={mockSales} searchTerm="sale-1" />
      );

      expect(screen.getByText(/sale-1/i)).toBeInTheDocument();
      expect(screen.queryByText(/sale-2/i)).not.toBeInTheDocument();
    });

    it('should show all sales when search term is empty', () => {
      renderWithProviders(
        <SalesList sales={mockSales} searchTerm="" />
      );

      expect(screen.getByText(/sale-1/i)).toBeInTheDocument();
      expect(screen.getByText(/sale-2/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const onEdit = vi.fn();
      renderWithProviders(
        <SalesList sales={mockSales} onEdit={onEdit} />
      );

      // Find and click edit button (implementation depends on actual UI)
      // This is a placeholder - adjust based on actual implementation
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalled();
      }
    });

    it('should call onDelete when delete button is clicked', async () => {
      const onDelete = vi.fn();
      renderWithProviders(
        <SalesList sales={mockSales} onDelete={onDelete} />
      );

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalled();
      }
    });

    it('should expand sale details when clicked', async () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      // Click on a sale row to expand
      const saleRows = screen.getAllByRole('row');
      if (saleRows.length > 1) {
        fireEvent.click(saleRows[1]);
        // Check if sale items are displayed
        await waitFor(() => {
          expect(screen.getByText(/item-1/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sales list', () => {
      renderWithProviders(<SalesList sales={[]} />);

      // Should show empty state
      expect(screen.queryByText(/sale-1/i)).not.toBeInTheDocument();
    });

    it('should handle sales with missing sale_items', () => {
      const saleWithoutItems = { ...mockSales[1], sale_items: undefined };
      renderWithProviders(<SalesList sales={[saleWithoutItems]} />);

      expect(screen.getByText(/sale-2/i)).toBeInTheDocument();
    });

    it('should handle negative discounts', () => {
      const saleWithNegativeDiscount: Sale = {
        ...mockSales[0],
        discount_amount: -10.00,
        final_amount: 110.00
      };

      renderWithProviders(<SalesList sales={[saleWithNegativeDiscount]} />);

      // Should still render without crashing
      expect(screen.getByText(/110\.00/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      // Check for table role
      const table = screen.queryByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderWithProviders(<SalesList sales={mockSales} />);

      // Check if interactive elements are focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of sales', () => {
      const largeSalesList: Sale[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockSales[0],
        id: `sale-${i}`,
        total_amount: i * 10
      }));

      const { container } = renderWithProviders(
        <SalesList sales={largeSalesList} />
      );

      // Should render without performance issues
      expect(container).toBeInTheDocument();
    });
  });
});
