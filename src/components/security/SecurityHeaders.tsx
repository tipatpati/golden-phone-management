import { useEffect } from 'react';

export function SecurityHeaders() {
  useEffect(() => {
    // Detect if we're in a preview/iframe environment
    const isInIframe = window !== window.top;
    const isLovablePreview = window.location.hostname.includes('lovable.app') || 
                            window.location.hostname.includes('localhost') ||
                            isInIframe;
    
    console.log('SecurityHeaders: Preview environment detected:', isLovablePreview);
    
    // Skip all security header modifications in preview environments
    if (isLovablePreview) {
      console.log('SecurityHeaders: Skipping security headers in preview environment');
      return;
    }
    
    // Only apply security headers in production environments
    console.log('SecurityHeaders: Applying production security headers');
    
    // Add Content Security Policy meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.gpteng.co https://cdn.jsdelivr.net",
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

    // Log frame status for production monitoring
    if (isInIframe) {
      console.warn('Page is running in iframe in production - potential security concern');
    }
  }, []);

  return null; // This component doesn't render anything
}