import React, { useEffect, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Scan } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Barcode Scanner",
  description = "Position the barcode within the camera frame"
}: BarcodeScannerProps) {
  const { 
    isScanning, 
    hasCamera, 
    videoRef, 
    startCameraScanner, 
    stopScanner,
    checkCameraAvailability
  } = useBarcodeScanner({
    onScan: (result) => {
      onScan(result);
      onClose();
    },
    onError: (error) => {
      console.error('Scanner error:', error);
    },
    continuous: false
  });

  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability();
    }
  }, [isOpen, checkCameraAvailability]);

  useEffect(() => {
    if (isOpen && hasCamera) {
      startCameraScanner();
    }

    return () => {
      if (isScanning) {
        stopScanner();
      }
    };
  }, [isOpen, hasCamera, startCameraScanner, stopScanner, isScanning]);

  const handleClose = () => {
    if (isScanning) {
      stopScanner();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {!hasCamera ? (
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-4">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Camera not available or permission denied
              </p>
              <p className="text-xs text-muted-foreground">
                You can still use a hardware barcode scanner in search fields
              </p>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-w-sm rounded-lg border"
                style={{ 
                  maxHeight: '300px',
                  objectFit: 'cover'
                }}
                autoPlay
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 border-2 border-primary rounded-lg animate-pulse">
                  <div className="absolute inset-4 border border-white/50 rounded">
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {hasCamera && !isScanning && (
              <Button 
                onClick={startCameraScanner}
                className="w-full min-h-[44px] text-base"
              >
                <Scan className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="w-full min-h-[44px] text-base"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BarcodeScannerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onScan: (result: string) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const BarcodeScannerTrigger = forwardRef<HTMLButtonElement, BarcodeScannerTriggerProps>(
  ({ onScan, variant = "outline", size = "icon", className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <>
        <Button
          ref={ref}
          variant={variant}
          size={size}
          onClick={() => setIsOpen(true)}
          className={cn("flex-shrink-0", className)}
          {...props}
        >
          {children || <Scan className="h-4 w-4" />}
        </Button>
        
        <BarcodeScanner
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onScan={onScan}
        />
      </>
    );
  }
);

BarcodeScannerTrigger.displayName = "BarcodeScannerTrigger";