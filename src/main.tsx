import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🎬 Starting React application...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('📦 Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🚀 Rendering App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('💥 CRITICAL ERROR in main.tsx:', error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">
    <h1>Application Failed to Start</h1>
    <p>Error: ${error.message}</p>
  </div>`;
}
