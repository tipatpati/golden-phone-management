import { useState, useEffect, useRef, useCallback } from 'react';

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

interface UseDropdownPortalProps {
  isOpen: boolean;
  offset?: number;
}

export function useDropdownPortal({ isOpen, offset = 4 }: UseDropdownPortalProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    setPosition({
      top: rect.bottom + scrollY + offset,
      left: rect.left,
      width: rect.width,
    });
  }, [offset]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, updatePosition]);

  return {
    triggerRef,
    position,
    updatePosition,
  };
}