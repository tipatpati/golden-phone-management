import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, MapPin } from 'lucide-react';
import { useStore, useHasMultipleStores } from '@/contexts/store/StoreContext';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { useMemo } from 'react';

interface StoreSelectorProps {
  className?: string;
  compact?: boolean;
}

export function StoreSelector({ className, compact = false }: StoreSelectorProps) {
  const { currentStore, userStores, setCurrentStore, isLoading, isSuperAdmin } = useStore();

  // Visibility rules (simplified):
  // 1. Always show for super admins (even with 1 store)
  // 2. Show for regular users only if they have 2+ stores
  // 3. Hide during loading unless super admin
  const shouldShow = useMemo(() => {
    if (isSuperAdmin) return true;
    return userStores.length > 1;
  }, [isSuperAdmin, userStores.length]);

  // Early returns for clarity
  if (!shouldShow) {
    return null;
  }

  // Show loading state only if stores aren't loaded yet
  if (isLoading && userStores.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading stores...</span>
      </div>
    );
  }

  // Safety check - if no stores available, don't render
  if (userStores.length === 0) {
    logger.warn('StoreSelector visible but no stores available', { isSuperAdmin }, 'StoreSelector');
    return null;
  }

  const handleStoreChange = async (storeId: string) => {
    const selectedStore = userStores.find(s => s.id === storeId);
    if (selectedStore && selectedStore.id !== currentStore?.id) {
      try {
        logger.debug('User changing store', {
          from: currentStore?.name,
          to: selectedStore.name
        }, 'StoreSelector');
        await setCurrentStore(selectedStore);
      } catch (error) {
        logger.error('Failed to change store', { error }, 'StoreSelector');
      }
    }
  };


  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />}

      <Select
        value={currentStore?.id || ''}
        onValueChange={handleStoreChange}
      >
        <SelectTrigger
          className={cn(
            'border-primary/20 bg-surface/80 backdrop-blur-sm',
            compact ? 'h-9 min-w-[140px]' : 'h-10 min-w-[180px]'
          )}
        >
          <SelectValue placeholder="Select store...">
            {currentStore && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="font-medium truncate">{currentStore.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {userStores.map((store) => (
            <SelectItem
              key={store.id}
              value={store.id}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MapPin className={cn(
                  'h-3 w-3',
                  store.id === currentStore?.id ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className="font-medium">{store.name}</span>
                {store.code && (
                  <span className="text-xs text-muted-foreground">({store.code})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Compact version for mobile/tight spaces
export function CompactStoreSelector({ className }: { className?: string }) {
  return <StoreSelector compact className={className} />;
}
