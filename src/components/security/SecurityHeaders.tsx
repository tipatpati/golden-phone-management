import { useEffect } from 'react';

export function SecurityHeaders() {
  useEffect(() => {
    // Set security headers programmatically where possible
    // Note: Most security headers need to be set server-side, but we can add meta tags
    
    // Add Content Security Policy meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.gpteng.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      document.head.appendChild(cspMeta);
    }

    // Add X-Frame-Options
    if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
      const frameOptionsMeta = document.createElement('meta');
      frameOptionsMeta.httpEquiv = 'X-Frame-Options';
      frameOptionsMeta.content = 'DENY';
      document.head.appendChild(frameOptionsMeta);
    }

    // Add X-Content-Type-Options
    if (!document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
      const contentTypeMeta = document.createElement('meta');
      contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
      contentTypeMeta.content = 'nosniff';
      document.head.appendChild(contentTypeMeta);
    }

    // Add Referrer Policy
    if (!document.querySelector('meta[name="referrer"]')) {
      const referrerMeta = document.createElement('meta');
      referrerMeta.name = 'referrer';
      referrerMeta.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrerMeta);
    }

    // Add Permissions Policy
    if (!document.querySelector('meta[http-equiv="Permissions-Policy"]')) {
      const permissionsMeta = document.createElement('meta');
      permissionsMeta.httpEquiv = 'Permissions-Policy';
      permissionsMeta.content = [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'fullscreen=(self)'
      ].join(', ');
      document.head.appendChild(permissionsMeta);
    }

    // Prevent clickjacking by removing any iframe that might be containing this page
    if (window !== window.top) {
      console.warn('Page is running in iframe - potential clickjacking attempt');
      // In production, you might want to break out of frames:
      // window.top.location = window.location;
    }

    // Add security event listener for suspicious activities
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('CSP violation detected:', event.violatedDirective, event.sourceFile);
      
      // In production, you would report this to your security monitoring system
      // logSecurityEvent({
      //   event_type: 'csp_violation',
      //   event_data: {
      //     violatedDirective: event.violatedDirective,
      //     sourceFile: event.sourceFile,
      //     lineNumber: event.lineNumber
      //   }
      // });
    };

    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };
  }, []);

  return null; // This component doesn't render anything
}