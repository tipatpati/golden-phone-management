
// Secure storage utilities to replace direct localStorage usage
import { toast } from '@/components/ui/sonner';

class SecureStorage {
  private prefix = 'golden_phone_';
  
  // Encrypt sensitive data before storing (basic implementation)
  private encrypt(data: string): string {
    // In production, use proper encryption library
    return btoa(data);
  }
  
  private decrypt(data: string): string {
    try {
      return atob(data);
    } catch {
      return '';
    }
  }
  
  setItem(key: string, value: string, sensitive = false): void {
    try {
      const prefixedKey = this.prefix + key;
      const finalValue = sensitive ? this.encrypt(value) : value;
      localStorage.setItem(prefixedKey, finalValue);
    } catch (error) {
      console.error('Failed to store item:', error);
      toast.error('Storage error occurred');
    }
  }
  
  getItem(key: string, sensitive = false): string | null {
    try {
      const prefixedKey = this.prefix + key;
      const value = localStorage.getItem(prefixedKey);
      if (!value) return null;
      
      return sensitive ? this.decrypt(value) : value;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  }
  
  removeItem(key: string): void {
    try {
      const prefixedKey = this.prefix + key;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }
  
  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

export const secureStorage = new SecureStorage();
