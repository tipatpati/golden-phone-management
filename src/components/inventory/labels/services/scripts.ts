// Generate the inline script used in the print window
export function generateBarcodeScript(config: any): string {
  return `
    function initializeBarcodes() {
      if (typeof JsBarcode === 'undefined') {
        console.warn('JsBarcode library not loaded, retrying...');
        setTimeout(initializeBarcodes, 400);
        return;
      }
      
      const canvases = document.querySelectorAll('.barcode-canvas');
      console.log('Initializing barcodes for', canvases.length, 'elements');
      
      canvases.forEach(function(canvas, index) {
        const barcodeValue = canvas.getAttribute('data-barcode');
        if (!barcodeValue) {
          console.warn('No barcode value found for canvas', index);
          return;
        }
        
        try {
          JsBarcode(canvas, barcodeValue, ${JSON.stringify({ ...{ background: '#ffffff', lineColor: '#000000' }, ...config })});
          console.log('Barcode generated successfully for:', barcodeValue);
        } catch (error) {
          console.error('Barcode generation failed for:', barcodeValue, error);
          (canvas as HTMLCanvasElement).style.display = 'none';
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
    
    window.addEventListener('load', function() {
      console.log('Document loaded, starting initialization...');
      initializeBarcodes();
      setTimeout(initiatePrint, 1200);
    });

    // Ensure the browser uses print styles without hacks
    window.addEventListener('beforeprint', function() {
      console.log('Before print: ensuring print styles are applied');
      // No transform hacks; rely on @page landscape and explicit sizes
      document.documentElement.classList.add('printing');
    });

    window.addEventListener('afterprint', function() {
      document.documentElement.classList.remove('printing');
    });
  `;
}
