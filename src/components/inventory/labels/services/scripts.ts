// Generate the inline script used in the print window
export function generateBarcodeScript(config: any): string {
  return `
    let barcodeInitAttempts = 0;
    const maxAttempts = 10;
    
    function initializeBarcodes() {
      barcodeInitAttempts++;
      console.log('Barcode initialization attempt:', barcodeInitAttempts);
      
      if (typeof JsBarcode === 'undefined') {
        console.warn('JsBarcode library not loaded, attempt', barcodeInitAttempts);
        if (barcodeInitAttempts < maxAttempts) {
          setTimeout(initializeBarcodes, 500);
          return;
        } else {
          console.error('JsBarcode library failed to load after', maxAttempts, 'attempts');
          showBarcodeNumbers();
          return;
        }
      }
      
      const canvases = document.querySelectorAll('.barcode-canvas');
      console.log('Initializing barcodes for', canvases.length, 'elements');
      
      if (canvases.length === 0) {
        console.warn('No barcode canvases found');
        return;
      }
      
      let successCount = 0;
      canvases.forEach(function(canvas, index) {
        const barcodeValue = canvas.getAttribute('data-barcode');
        console.log('Processing canvas', index, 'with barcode value:', barcodeValue);
        
        if (!barcodeValue || barcodeValue.trim() === '') {
          console.warn('No barcode value found for canvas', index);
          canvas.style.display = 'none';
          return;
        }
        
        try {
          // Set canvas dimensions explicitly to prevent cropping
          canvas.width = 280;
          canvas.height = 80;
          
          // Use consistent barcode format detection
          let format = 'CODE128';
          if (/^\\d{13}$/.test(barcodeValue)) {
            format = 'EAN13';
          }
          
          JsBarcode(canvas, barcodeValue, {
            format: format,
            width: 1.8,
            height: 50,
            displayValue: true,
            fontSize: 10,
            font: 'Arial, sans-serif',
            textAlign: 'center',
            textPosition: 'bottom',
            textMargin: 6,
            margin: 4,
            background: '#ffffff',
            lineColor: '#000000'
          });
          
          console.log('Barcode generated successfully for:', barcodeValue);
          successCount++;
        } catch (error) {
          console.error('Barcode generation failed for:', barcodeValue, error);
          // Show barcode number as text fallback
          const fallbackDiv = document.createElement('div');
          fallbackDiv.style.cssText = 'font-family: monospace; font-size: 10px; text-align: center; padding: 20px; border: 1px solid #ccc;';
          fallbackDiv.textContent = barcodeValue;
          canvas.parentNode.replaceChild(fallbackDiv, canvas);
        }
      });
      
      console.log('Barcode initialization complete. Success:', successCount, 'Total:', canvases.length);
    }
    
    function showBarcodeNumbers() {
      // Fallback: show barcode numbers as text when library fails
      const canvases = document.querySelectorAll('.barcode-canvas');
      canvases.forEach(function(canvas) {
        const barcodeValue = canvas.getAttribute('data-barcode');
        if (barcodeValue) {
          const fallbackDiv = document.createElement('div');
          fallbackDiv.style.cssText = 'font-family: monospace; font-size: 12px; text-align: center; padding: 15px; border: 1px solid #333; background: #f9f9f9;';
          fallbackDiv.textContent = barcodeValue;
          canvas.parentNode.replaceChild(fallbackDiv, canvas);
        }
      });
    }
    
    function initiatePrint() {
      console.log('Initiating print process...');
      try {
        window.print();
      } catch (error) {
        console.error('Print initiation failed:', error);
        alert('Print failed. Please try using your browser\\'s print function (Ctrl+P)');
      }
    }
    
    // Multiple initialization strategies
    function startBarcodeInit() {
      console.log('Document loaded, starting barcode initialization...');
      initializeBarcodes();
    }
    
    // Wait for document load
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', startBarcodeInit);
    } else {
      startBarcodeInit();
    }
    
    // Also try on window load as backup
    window.addEventListener('load', function() {
      console.log('Window loaded, ensuring barcodes are initialized...');
      setTimeout(function() {
        const canvases = document.querySelectorAll('.barcode-canvas');
        let needsInit = false;
        canvases.forEach(function(canvas) {
          if (canvas.width === 0 || canvas.height === 0) {
            needsInit = true;
          }
        });
        if (needsInit) {
          console.log('Re-initializing barcodes...');
          initializeBarcodes();
        }
        // Start print after ensuring barcodes are ready
        setTimeout(initiatePrint, 1500);
      }, 500);
    });

    // Ensure the browser uses print styles without hacks
    window.addEventListener('beforeprint', function() {
      console.log('Before print: ensuring print styles are applied');
      document.documentElement.classList.add('printing');
    });

    window.addEventListener('afterprint', function() {
      document.documentElement.classList.remove('printing');
      console.log('Print completed');
    });
  `;
}
