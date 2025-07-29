import React, { createContext, useContext, useEffect, useState } from 'react';
import { logSecurityEvent } from '@/utils/securityAudit';
import { enhancedRateLimiter } from '@/utils/securityEnhancements';

interface SecurityContextType {
  securityLevel: 'low' | 'medium' | 'high';
  threatCount: number;
  isSecure: boolean;
  reportSuspiciousActivity: (activity: string, metadata?: Record<string, any>) => void;
  checkRateLimit: (key: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function EnhancedSecurityProvider({ children }: { children: React.ReactNode }) {
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [threatCount, setThreatCount] = useState(0);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    initializeSecurity();
    setupAdvancedMonitoring();
  }, []);

  const initializeSecurity = async () => {
    try {
      await logSecurityEvent({
        event_type: 'security_init',
        event_data: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          location: window.location.href,
          features: {
            https: window.location.protocol === 'https:',
            serviceWorker: 'serviceWorker' in navigator,
            localStorage: 'localStorage' in window,
            sessionStorage: 'sessionStorage' in window
          }
        }
      });

      const level = determineSecurityLevel();
      setSecurityLevel(level);
      setIsSecure(level !== 'low');
    } catch (error) {
      console.error('Security initialization failed:', error);
      setSecurityLevel('low');
      setIsSecure(false);
    }
  };

  const determineSecurityLevel = (): 'low' | 'medium' | 'high' => {
    let score = 0;
    
    // HTTPS check
    if (window.location.protocol === 'https:') score += 2;
    
    // Service Worker check
    if ('serviceWorker' in navigator) score += 1;
    
    // Secure context check
    if (window.isSecureContext) score += 1;
    
    // CSP check
    const metaTags = document.getElementsByTagName('meta');
    for (let i = 0; i < metaTags.length; i++) {
      if (metaTags[i].getAttribute('http-equiv')?.toLowerCase() === 'content-security-policy') {
        score += 2;
        break;
      }
    }

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  const setupAdvancedMonitoring = () => {
    // Monitor for suspicious DOM manipulation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check for suspicious script injections
              if (element.tagName?.toLowerCase() === 'script') {
                reportSuspiciousActivity('script_injection', {
                  src: element.getAttribute('src'),
                  content: element.textContent?.substring(0, 100)
                });
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Monitor for unusual network patterns
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0] as string;
      
      // Check for suspicious external requests
      if (typeof url === 'string' && !url.startsWith(window.location.origin)) {
        if (!url.includes('supabase.co') && !url.includes('googleapis.com')) {
          reportSuspiciousActivity('external_request', { url });
        }
      }
      
      return originalFetch.apply(this, args);
    };

    // Monitor for clipboard access
    if ('clipboard' in navigator) {
      const originalRead = navigator.clipboard.read;
      navigator.clipboard.read = function() {
        reportSuspiciousActivity('clipboard_access', { action: 'read' });
        return originalRead.apply(this);
      };
    }

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
    };
  };

  const reportSuspiciousActivity = async (activity: string, metadata?: Record<string, any>) => {
    try {
      setThreatCount(prev => prev + 1);
      
      await logSecurityEvent({
        event_type: 'suspicious_activity',
        event_data: {
          activity,
          metadata,
          severity: 'high',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          location: window.location.href
        }
      });

      // Escalate if too many threats
      if (threatCount > 5) {
        setSecurityLevel('low');
        setIsSecure(false);
      }
    } catch (error) {
      console.error('Failed to report suspicious activity:', error);
    }
  };

  const checkRateLimit = (key: string): boolean => {
    return enhancedRateLimiter.checkRateLimit(key).allowed;
  };

  return (
    <SecurityContext.Provider value={{
      securityLevel,
      threatCount,
      isSecure,
      reportSuspiciousActivity,
      checkRateLimit
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within EnhancedSecurityProvider');
  }
  return context;
}