import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx starting...');
console.log('React version:', React.version);

// Add more detailed error catching
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  console.error('Error details:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    line: event.lineno,
    col: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  console.log('Looking for root element...');
  const rootElement = document.getElementById("root");
  console.log('Root element found:', !!rootElement);
  console.log('Root element details:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('Creating React root...');
  const root = createRoot(rootElement);
  console.log('React root created successfully');
  
  console.log('About to render App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('App render initiated successfully');
} catch (error) {
  console.error('Failed to initialize app:', error);
  console.error('Error stack:', error?.stack);
  
  // Show error on screen
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding: 20px; color: red; font-family: Arial; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999;';
  errorDiv.innerHTML = `
    <h2>Application Failed to Start</h2>
    <p><strong>Error:</strong> ${error?.message}</p>
    <p><strong>Stack:</strong></p>
    <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error?.stack || 'No stack trace available'}</pre>
    <p>Check console for additional details.</p>
  `;
  document.body.appendChild(errorDiv);
}
