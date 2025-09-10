/**
 * Production build configuration and optimizations
 * Integrates with Vite for optimal production builds
 */

export default {
  build: {
    // Bundle optimization
    rollupOptions: {
      output: {
        // Code splitting configuration
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-query': ['@tanstack/react-query'],
          
          // Feature chunks
          'feature-inventory': [
            './src/components/inventory',
            './src/services/inventory'
          ],
          'feature-sales': [
            './src/components/sales',
            './src/services/sales'
          ],
          'feature-auth': [
            './src/contexts/auth',
            './src/components/auth'
          ]
        }
      }
    },
    
    // Minification and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      mangle: {
        safari10: true
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,
    
    // Source maps for debugging (can be disabled for security)
    sourcemap: false
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ]
  },
  
  // Security headers configuration
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
};