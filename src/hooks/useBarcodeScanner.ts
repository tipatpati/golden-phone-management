import { useState, useCallback, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';

export interface BarcodeScannerOptions {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
}

export function useBarcodeScanner(options: BarcodeScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const checkCameraAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(device => device.kind === 'videoinput');
      setHasCamera(hasVideoInput);
      return hasVideoInput;
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setHasCamera(false);
      return false;
    }
  }, []);

  const startCameraScanner = useCallback(async () => {
    try {
      const hasCam = await checkCameraAvailability();
      if (!hasCam) {
        options.onError?.('No camera available');
        return false;
      }

      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      setIsScanning(true);

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        options.onError?.('No video input devices found');
        setIsScanning(false);
        return false;
      }

      // Use the first available camera, preferring back camera if available
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment')
      );
      const selectedDeviceId = backCamera?.deviceId || videoDevices[0].deviceId;

      const constraints = {
        video: {
          deviceId: selectedDeviceId,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Try to use back camera
        }
      };

      if (videoRef.current) {
        await codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              options.onScan(result.getText());
              if (!options.continuous) {
                stopScanner();
              }
            }
            if (error && !(error instanceof NotFoundException)) {
              console.error('Scanner error:', error);
              if (error instanceof ChecksumException || error instanceof FormatException) {
                // These are expected errors when scanning, don't show them to user
                return;
              }
              options.onError?.(error.message);
            }
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Error starting camera scanner:', error);
      options.onError?.('Failed to start camera scanner');
      setIsScanning(false);
      return false;
    }
  }, [options, checkCameraAvailability]);

  const stopScanner = useCallback(() => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  }, []);

  // Hardware scanner support (keyboard input detection)
  const setupHardwareScanner = useCallback((inputElement: HTMLInputElement) => {
    let scanBuffer = '';
    let scanTimeout: NodeJS.Timeout;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Hardware scanners typically send data quickly followed by Enter
      if (event.key === 'Enter') {
        if (scanBuffer.length > 3) { // Minimum barcode length
          options.onScan(scanBuffer.trim());
          scanBuffer = '';
        }
        event.preventDefault();
        return;
      }

      // Build the scan buffer
      if (event.key.length === 1) { // Only single characters
        scanBuffer += event.key;
        
        // Clear buffer after timeout (hardware scanners are fast)
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          scanBuffer = '';
        }, 100);
      }
    };

    inputElement.addEventListener('keypress', handleKeyPress);

    return () => {
      inputElement.removeEventListener('keypress', handleKeyPress);
      clearTimeout(scanTimeout);
    };
  }, [options]);

  return {
    isScanning,
    hasCamera,
    videoRef,
    startCameraScanner,
    stopScanner,
    setupHardwareScanner,
    checkCameraAvailability
  };
}