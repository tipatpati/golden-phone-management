import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityHeaders } from './SecurityHeaders';
import { logSecurityEvent } from '@/utils/securityAudit';

interface SecurityContextType {
  securityLevel: 'low' | 'medium' | 'high';
  threatCount: number;
  isSecure: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [threatCount, setThreatCount] = useState(0);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // Initialize security monitoring
    const initSecurity = async () => {
      try {
        // Log application start (only if we're not in a preview environment)
        const isPreview = window.location.hostname.includes('lovable.app') || 
                         window.location.hostname.includes('localhost') ||
                         window !== window.top;
        
        if (!isPreview) {
          await logSecurityEvent({
            event_type: 'application_start',
            event_data: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              location: window.location.href
            }
          });
        }

        // Check for security features
        checkSecurityFeatures();
        
        // Set up security monitoring (but don't log in preview)
        setupSecurityMonitoring();
      } catch (error) {
        // Don't let security logging errors break the app
        console.warn('Security initialization failed:', error);
        
        // Still initialize basic security features
        checkSecurityFeatures();
        setupSecurityMonitoring();
      }
    };

    initSecurity();
  }, []);

  const checkSecurityFeatures = () => {
    let secureFeatures = 0;
    let level: 'low' | 'medium' | 'high' = 'low';

    // Check HTTPS
    if (window.location.protocol === 'https:') {
      secureFeatures++;
    }

    // Check for CSP header
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      secureFeatures++;
    }

    // Check for secure storage
    try {
      if (window.crypto && window.crypto.subtle) {
        secureFeatures++;
      }
    } catch (e) {
      // Web Crypto API not available
    }

    // Determine security level
    if (secureFeatures >= 3) {
      level = 'high';
    } else if (secureFeatures >= 2) {
      level = 'medium';
    }

    setSecurityLevel(level);
    setIsSecure(level !== 'low');
  };

  const setupSecurityMonitoring = () => {
    // Skip monitoring setup in preview environments to avoid interference
    const isPreview = window.location.hostname.includes('lovable.app') || 
                     window.location.hostname.includes('localhost') ||
                     window !== window.top;
    
    if (isPreview) {
      console.log('Security monitoring disabled in preview environment');
      return;
    }
    
    // Monitor for suspicious activity
    let suspiciousActivityCount = 0;
    const suspiciousActivityThreshold = 5;

    // Monitor console access (potential developer tools usage)
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      suspiciousActivityCount++;
      if (suspiciousActivityCount > suspiciousActivityThreshold) {
        logSecurityEvent({
          event_type: 'suspicious_console_activity',
          event_data: { count: suspiciousActivityCount }
        }).catch(err => console.warn('Security logging failed:', err));
        suspiciousActivityCount = 0; // Reset counter
      }
      originalConsoleLog.apply(console, args);
    };

    // Monitor for right-click context menu (potential inspection attempts)
    document.addEventListener('contextmenu', (e) => {
      // In production, you might want to prevent this entirely
      logSecurityEvent({
        event_type: 'context_menu_access',
        event_data: { 
          target: e.target instanceof Element ? e.target.tagName : 'unknown',
          timestamp: new Date().toISOString()
        }
      }).catch(err => console.warn('Security logging failed:', err));
    });

    // Monitor for F12 key press (developer tools)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        logSecurityEvent({
          event_type: 'developer_tools_attempt',
          event_data: { 
            key: e.key,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            timestamp: new Date().toISOString()
          }
        }).catch(err => console.warn('Security logging failed:', err));
      }
    });

    // Monitor for tab visibility changes (potential multi-tab attacks)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        logSecurityEvent({
          event_type: 'tab_hidden',
          event_data: { timestamp: new Date().toISOString() }
        }).catch(err => console.warn('Security logging failed:', err));
      }
    });

    // Monitor for page unload (potential session hijacking detection)
    window.addEventListener('beforeunload', () => {
      logSecurityEvent({
        event_type: 'page_unload',
        event_data: { timestamp: new Date().toISOString() }
      }).catch(err => console.warn('Security logging failed:', err));
    });
  };

  return (
    <SecurityContext.Provider value={{
      securityLevel,
      threatCount,
      isSecure
    }}>
      <SecurityHeaders />
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}