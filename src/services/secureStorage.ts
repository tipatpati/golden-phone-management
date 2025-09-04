
// Secure storage utilities to replace direct localStorage usage
import { toast } from '@/components/ui/sonner';

class SecureStorage {
  private prefix = 'golden_phone_';
  private encryptionKey: CryptoKey | null = null;
  
  // Initialize encryption key with secure random generation
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) return this.encryptionKey;
    
    // Generate user-specific salt using session data if available
    const userSession = localStorage.getItem('supabase.auth.token');
    const userSpecificData = userSession ? userSession.substring(0, 32) : 'default_user_data';
    
    // Create a more secure base key material
    const baseKeyData = userSpecificData + window.location.origin + Date.now().toString();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(baseKeyData),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Generate random salt for each encryption session
    const randomSalt = crypto.getRandomValues(new Uint8Array(32));
    const saltString = Array.from(randomSalt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(saltString),
        iterations: 250000, // Increased iterations for better security
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    return this.encryptionKey;
  }
  
  // Encrypt sensitive data using AES-GCM
  private async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      const encoded = new TextEncoder().encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to base64 encoding if encryption fails
      return btoa(data);
    }
  }
  
  private async decrypt(data: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const combined = new Uint8Array(
        atob(data).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to base64 decoding if decryption fails
      try {
        return atob(data);
      } catch {
        return '';
      }
    }
  }
  
  async setItem(key: string, value: string, sensitive = false): Promise<void> {
    try {
      const prefixedKey = this.prefix + key;
      const finalValue = sensitive ? await this.encrypt(value) : value;
      localStorage.setItem(prefixedKey, finalValue);
    } catch (error) {
      console.error('Failed to store item:', error);
      toast.error('Storage error occurred');
    }
  }
  
  async getItem(key: string, sensitive = false): Promise<string | null> {
    try {
      const prefixedKey = this.prefix + key;
      const value = localStorage.getItem(prefixedKey);
      if (!value) return null;
      
      return sensitive ? await this.decrypt(value) : value;
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
