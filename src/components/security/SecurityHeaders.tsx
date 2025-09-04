import { useEffect } from 'react';

export function SecurityHeaders() {
  useEffect(() => {
    // Set security headers via meta tags
    const setSecurityHeaders = () => {
      // Content Security Policy
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://joiwowvlujajwbarpsuc.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://joiwowvlujajwbarpsuc.supabase.co wss://joiwowvlujajwbarpsuc.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      
      // X-Frame-Options
      const frameMeta = document.createElement('meta');
      frameMeta.httpEquiv = 'X-Frame-Options';
      frameMeta.content = 'DENY';
      
      // X-Content-Type-Options
      const contentTypeMeta = document.createElement('meta');
      contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
      contentTypeMeta.content = 'nosniff';
      
      // Referrer Policy
      const referrerMeta = document.createElement('meta');
      referrerMeta.name = 'referrer';
      referrerMeta.content = 'strict-origin-when-cross-origin';
      
      // Remove existing security headers
      document.querySelectorAll('meta[http-equiv*="Content-Security-Policy"], meta[http-equiv*="X-Frame-Options"], meta[http-equiv*="X-Content-Type-Options"], meta[name="referrer"]')
        .forEach(meta => meta.remove());
      
      // Add new headers
      document.head.appendChild(cspMeta);
      document.head.appendChild(frameMeta);
      document.head.appendChild(contentTypeMeta);
      document.head.appendChild(referrerMeta);
    };

    setSecurityHeaders();
  }, []);

  return null;
}