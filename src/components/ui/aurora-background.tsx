import React, { useEffect, useRef } from 'react';

interface AuroraBackgroundProps {
  colorStops?: [string, string, string];
  speed?: number;
  blend?: number;
  amplitude?: number;  
  className?: string;
}

export function AuroraBackground({ 
  colorStops = ["#3A29FF", "#FF94B4", "#FF3232"],
  speed = 1.0,
  blend = 0.5,
  amplitude = 1.0,
  className = ""
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Set CSS custom properties for animation
    container.style.setProperty('--aurora-speed', `${20 / speed}s`);
    container.style.setProperty('--aurora-blend', blend.toString());
    container.style.setProperty('--aurora-amplitude', amplitude.toString());
    container.style.setProperty('--color-1', colorStops[0]);
    container.style.setProperty('--color-2', colorStops[1]);
    container.style.setProperty('--color-3', colorStops[2]);
  }, [colorStops, speed, blend, amplitude]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 aurora-background ${className}`}
    />
  );
}