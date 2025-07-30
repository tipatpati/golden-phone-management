import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

console.log('=== MAIN.TSX STARTING ===');

// Test if basic React works
function TestApp() {
  console.log('TestApp component rendering...');
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      color: 'black', 
      fontFamily: 'Arial',
      minHeight: '100vh'
    }}>
      <h1>Test App Loading...</h1>
      <p>If you see this, React is working.</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
}

// Add more detailed error catching
window.addEventListener('error', (event) => {
  console.error('=== GLOBAL ERROR ===', event.error);
  console.error('Error details:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    line: event.lineno,
    col: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===', event.reason);
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
  
  console.log('About to render TestApp component...');
  root.render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  );
  
  console.log('TestApp render initiated successfully');
  
  // After 2 seconds, try to load the real app
  setTimeout(() => {
    console.log('=== ATTEMPTING TO LOAD REAL APP ===');
    try {
      import('./App.tsx').then((AppModule) => {
        console.log('App module loaded successfully');
        const App = AppModule.default;
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
        console.log('Real App rendered successfully');
      }).catch((error) => {
        console.error('Failed to load App module:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      });
    } catch (syncError) {
      console.error('Synchronous error loading App:', syncError);
    }
  }, 2000);
  
} catch (error) {
  console.error('=== FAILED TO INITIALIZE ===', error);
  console.error('Error stack:', error?.stack);
  
  // Show error on screen
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding: 20px; color: red; font-family: Arial; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999;';
  errorDiv.innerHTML = `
    <h2>Critical Initialization Error</h2>
    <p><strong>Error:</strong> ${error?.message}</p>
    <p><strong>Stack:</strong></p>
    <pre style="background: #f0f0f0; padding: 10px; overflow: auto; white-space: pre-wrap;">${error?.stack || 'No stack trace available'}</pre>
    <p>Check console for additional details.</p>
  `;
  document.body.appendChild(errorDiv);
}