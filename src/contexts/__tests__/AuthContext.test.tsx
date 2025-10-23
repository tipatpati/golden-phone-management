import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { AuthProvider, useAuth } from '../AuthContext';
import type { User, Session } from '@supabase/supabase-js';

// Mock Supabase
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: mockSession }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { role: 'super_admin', username: 'TestUser' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock hooks
vi.mock('@/hooks/useSessionSecurity', () => ({
  useSessionSecurity: () => ({
    isSessionValid: true,
    resetActivity: vi.fn()
  })
}));

vi.mock('@/hooks/usePeriodicReminder', () => ({
  usePeriodicReminder: () => {}
}));

describe('AuthContext', () => {
  // Test component to use the auth context
  function TestComponent() {
    const auth = useAuth();
    return (
      <div>
        <div data-testid="is-logged-in">{String(auth.isLoggedIn)}</div>
        <div data-testid="user-role">{auth.userRole || 'no-role'}</div>
        <div data-testid="username">{auth.username || 'no-username'}</div>
        <div data-testid="user-id">{auth.user?.id || 'no-user'}</div>
      </div>
    );
  }

  describe('Provider Initialization', () => {
    it('should provide auth context to children', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('is-logged-in')).toBeInTheDocument();
    });

    it('should initialize with user session', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
      });
    });

    it('should fetch user profile data', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('super_admin');
        expect(screen.getByTestId('username')).toHaveTextContent('TestUser');
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should set correct user role from profile', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const roleElement = screen.getByTestId('user-role');
        expect(roleElement).toHaveTextContent('super_admin');
      });
    });

    it('should handle users with different roles', async () => {
      // Mock different role
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'salesperson', username: 'SalesUser' },
              error: null
            }))
          }))
        }))
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-role')).toHaveTextContent('salesperson');
      });
    });
  });

  describe('Authentication State', () => {
    it('should show logged in when session exists', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
      });
    });

    it('should provide user data when authenticated', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id');
      });
    });
  });

  describe('Security', () => {
    it('should handle missing session gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should not crash
      expect(screen.getByTestId('is-logged-in')).toBeInTheDocument();
    });

    it('should handle authentication errors', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { 
          message: 'Auth error', 
          name: 'AuthError', 
          status: 401
        } as any
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should handle error gracefully
      expect(screen.getByTestId('is-logged-in')).toBeInTheDocument();
    });

    it('should not expose sensitive session data', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const component = screen.getByTestId('user-id');
        // Should only show user ID, not access tokens
        expect(component.textContent).not.toContain('mock-access-token');
      });
    });
  });

  describe('Context Usage', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Role Validation', () => {
    const validRoles = ['super_admin', 'admin', 'manager', 'inventory_manager', 'technician', 'salesperson'];

    validRoles.forEach(role => {
      it(`should accept valid role: ${role}`, async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        vi.mocked(supabase.from).mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { role, username: 'TestUser' },
                error: null
              }))
            }))
          }))
        } as any);

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('user-role')).toHaveTextContent(role);
        });
      });
    });
  });

  describe('Profile Data', () => {
    it('should fetch username from profile', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('username')).toHaveTextContent('TestUser');
      });
    });

    it('should handle missing profile gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Not found', details: '', hint: '', code: '404' }
            }))
          }))
        }))
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should not crash
      expect(screen.getByTestId('username')).toBeInTheDocument();
    });
  });
});
