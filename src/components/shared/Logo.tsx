
import React from "react";

interface LogoProps {
  className?: string;
  size?: number | string;
}

export function Logo({ className = "", size = 48 }: LogoProps) {
  // Responsive width: if size is a number, treat as px. Otherwise use string directly (e.g., '3rem').
  const width = typeof size === "number" ? `${size}px` : size;
  return (
    <img
      src="/lovable-uploads/1c674f52-56e5-4464-9c2e-7c97347b4ccc.png"
      alt="Golden Phone Logo"
      style={{ width: "85%", height: "85%", display: "block", objectFit: "contain" }}
      className={className}
      loading="lazy"
    />
  );
}
