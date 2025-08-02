import React from 'react';

export function EmergencyFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>
        🚨 Emergency Mode
      </h1>
      <p style={{ color: '#374151', marginBottom: '24px' }}>
        The application encountered a critical error and switched to emergency mode.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        🔄 Reload Application
      </button>
    </div>
  );
}