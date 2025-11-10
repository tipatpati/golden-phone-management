import React, { useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface DropdownItem<T = any> {
  id: string | number;
  label: string;
  value: T;
  icon?: ReactNode;
  badge?: ReactNode;
  description?: string;
  disabled?: boolean;
  group?: string;
}

export interface ScrollableDropdownProps<T = any> {
  /** Whether dropdown is open */
  isOpen: boolean;

  /** Items to display */
  items: DropdownItem<T>[];

  /** Currently selected index */
  selectedIndex: number;

  /** Callback when item is clicked */
  onItemSelect: (item: DropdownItem<T>, index: number) => void;

  /** Callback when selected index changes (for keyboard nav) */
  onSelectedIndexChange?: (index: number) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Loading message */
  loadingMessage?: string;

  /** Custom item renderer */
  renderItem?: (item: DropdownItem<T>, isSelected: boolean, isHighlighted: boolean) => ReactNode;

  /** Maximum height */
  maxHeight?: 'sm' | 'md' | 'lg' | 'xl' | string;

  /** Z-index */
  zIndex?: number;

  /** Additional className for dropdown container */
  className?: string;

  /** Additional className for items */
  itemClassName?: string;

  /** Use Card wrapper (shadcn style) vs plain div */
  variant?: 'card' | 'plain';

  /** Show group headers */
  showGroups?: boolean;

  /** Position relative to trigger */
  position?: 'bottom' | 'top';

  /** Full width or auto width */
  fullWidth?: boolean;
}

const heightClasses = {
  sm: 'max-h-40',   // 160px
  md: 'max-h-60',   // 240px
  lg: 'max-h-96',   // 384px
  xl: 'max-h-[32rem]', // 512px
};

/**
 * Unified scrollable dropdown component
 *
 * Replaces:
 * - AutocompleteInput dropdowns
 * - ProductSearchSelector dropdown
 * - SearchInput dropdown
 * - Custom suggestion dropdowns
 *
 * Features:
 * - Keyboard navigation with scroll-into-view
 * - Loading and empty states
 * - Grouped items
 * - Custom rendering
 * - Consistent styling
 * - Accessible
 */
export function ScrollableDropdown<T = any>({
  isOpen,
  items,
  selectedIndex,
  onItemSelect,
  onSelectedIndexChange,
  isLoading = false,
  emptyMessage = 'No items found',
  loadingMessage = 'Loading...',
  renderItem,
  maxHeight = 'md',
  zIndex = 50,
  className,
  itemClassName,
  variant = 'plain',
  showGroups = false,
  position = 'bottom',
  fullWidth = true,
}: ScrollableDropdownProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-dropdown-index="${selectedIndex}"]`
      ) as HTMLElement;

      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group items if needed
  const groupedItems = showGroups
    ? items.reduce((acc, item, index) => {
        const group = item.group || 'default';
        if (!acc[group]) acc[group] = [];
        acc[group].push({ item, index });
        return acc;
      }, {} as Record<string, Array<{ item: DropdownItem<T>; index: number }>>)
    : { default: items.map((item, index) => ({ item, index })) };

  const heightClass = typeof maxHeight === 'string' && maxHeight in heightClasses
    ? heightClasses[maxHeight as keyof typeof heightClasses]
    : maxHeight;

  // Map zIndex prop to Tailwind classes (Tailwind requires static class names)
  const zIndexClass = zIndex === 40 ? 'z-40'
    : zIndex === 50 ? 'z-50'
    : zIndex === 60 ? 'z-[60]'
    : 'z-50'; // Default to z-50

  const dropdownClasses = cn(
    // Positioning
    'absolute mt-1',
    position === 'bottom' ? 'top-full' : 'bottom-full',
    fullWidth ? 'left-0 right-0' : 'min-w-[200px]',

    // Styling
    'bg-background border rounded-md shadow-lg',
    'overflow-auto',
    heightClass,
    zIndexClass,

    // Variant specific
    variant === 'card' && 'bg-background/95 backdrop-blur-sm',

    className
  );

  const renderDefaultItem = (item: DropdownItem<T>, isSelected: boolean, isHighlighted: boolean) => (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "truncate",
            item.disabled && "text-muted-foreground opacity-50"
          )}>
            {item.label}
          </div>
          {item.description && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {item.description}
            </div>
          )}
        </div>
      </div>
      {item.badge && <span className="flex-shrink-0">{item.badge}</span>}
    </div>
  );

  return (
    <div className={dropdownClasses} ref={listRef}>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-3 gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{loadingMessage}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
          {emptyMessage}
        </div>
      )}

      {/* Items */}
      {!isLoading && items.length > 0 && (
        <div>
          {Object.entries(groupedItems).map(([groupName, groupItems]) => (
            <div key={groupName}>
              {/* Group Header */}
              {showGroups && groupName !== 'default' && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                  {groupName}
                </div>
              )}

              {/* Group Items */}
              {groupItems.map(({ item, index }) => {
                const isSelected = index === selectedIndex;
                const isHighlighted = item.value === items[selectedIndex]?.value;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-dropdown-index={index}
                    disabled={item.disabled}
                    onClick={() => !item.disabled && onItemSelect(item, index)}
                    onMouseEnter={() => !item.disabled && onSelectedIndexChange?.(index)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      "focus:outline-none",
                      isSelected && !item.disabled && "bg-accent text-accent-foreground",
                      !isSelected && !item.disabled && "hover:bg-accent/50",
                      item.disabled && "cursor-not-allowed opacity-50",
                      "border-b border-border/50 last:border-b-0",
                      itemClassName
                    )}
                  >
                    {renderItem
                      ? renderItem(item, isSelected, isHighlighted)
                      : renderDefaultItem(item, isSelected, isHighlighted)
                    }
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage dropdown keyboard navigation
 */
export function useDropdownKeyboard(
  isOpen: boolean,
  itemCount: number,
  onSelect: () => void,
  onClose: () => void
) {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  // Reset when opened/closed
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || itemCount === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < itemCount - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : itemCount - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          onSelect();
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      case 'Tab':
        // Allow default tab behavior but close dropdown
        onClose();
        break;
    }
  };

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown
  };
}
