
import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { PreviewDebugger } from "@/components/debug/PreviewDebugger";

export default function App() {
  // Force light mode in preview environments
  React.useEffect(() => {
    const isPreview = typeof window !== 'undefined' && (
      window.location.hostname.includes('lovable.app') || 
      window.location.hostname.includes('localhost') ||
      window !== window.top
    );
    
    if (isPreview) {
      // Force remove dark class and ensure light mode
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
      
      console.log('Forced light mode for preview environment');
    }
  }, []);

  return (
    <AppProviders includeAuth>
      <PreviewDebugger />
      <AppRouter />
    </AppProviders>
  );
}
