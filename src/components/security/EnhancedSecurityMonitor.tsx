import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logSecurityEvent, logSuspiciousActivity } from '@/utils/securityAudit';

export function EnhancedSecurityMonitor() {
  const { user } = useAuth();

  useEffect(() => {
    // Monitor for suspicious browser activities
    const handleContextMenu = (e: MouseEvent) => {
      // Log suspicious right-click activities in sensitive areas
      const target = e.target as HTMLElement;
      if (target.closest('[data-sensitive]')) {
        logSuspiciousActivity('right_click_sensitive_area', {
          element: target.tagName,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Monitor for suspicious key combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      // Log attempts to open developer tools
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        e.key === 'F12'
      ) {
        logSuspiciousActivity('dev_tools_attempt', {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          timestamp: new Date().toISOString()
        });
      }

      // Log suspicious copy attempts
      if (e.ctrlKey && e.key === 'c') {
        const target = e.target as HTMLElement;
        if (target.closest('[data-sensitive]')) {
          logSuspiciousActivity('copy_sensitive_data', {
            element: target.tagName,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Monitor for tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          event_type: 'tab_hidden',
          event_data: { timestamp: new Date().toISOString() }
        });
      } else {
        logSecurityEvent({
          event_type: 'tab_visible',
          event_data: { timestamp: new Date().toISOString() }
        });
      }
    };

    // Monitor for focus changes (potential session hijacking)
    const handleFocusChange = () => {
      if (document.hasFocus()) {
        logSecurityEvent({
          event_type: 'window_focus_gained',
          event_data: { timestamp: new Date().toISOString() }
        });
      } else {
        logSecurityEvent({
          event_type: 'window_focus_lost',
          event_data: { timestamp: new Date().toISOString() }
        });
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);

    // Log session start
    if (user) {
      logSecurityEvent({
        event_type: 'security_monitor_started',
        event_data: { 
          userId: user.id,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      });
    }

    return () => {
      // Clean up event listeners
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);

      // Log session end
      if (user) {
        logSecurityEvent({
          event_type: 'security_monitor_stopped',
          event_data: { 
            userId: user.id,
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }, [user]);

  return null; // This component doesn't render anything
}