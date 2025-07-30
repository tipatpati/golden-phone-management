import React from 'react';

export function PreviewDebugger() {
  const isPreview = typeof window !== 'undefined' && (
    window.location.hostname.includes('lovable.app') || 
    window.location.hostname.includes('localhost') ||
    window !== window.top
  );

  if (!isPreview) return null;

  return (
    <div 
      className="fixed top-0 right-0 z-[9999] bg-red-500 text-white p-2 text-xs max-w-xs"
      style={{ 
        backgroundColor: '#ff0000', 
        color: '#ffffff',
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        right: 0,
        padding: '8px',
        fontSize: '12px',
        maxWidth: '200px'
      }}
    >
      <div>Preview Debug Active</div>
      <div>Hostname: {window.location.hostname}</div>
      <div>In iframe: {window !== window.top ? 'Yes' : 'No'}</div>
      <div>Body class: {document.body.className}</div>
      <div>HTML class: {document.documentElement.className}</div>
    </div>
  );
}