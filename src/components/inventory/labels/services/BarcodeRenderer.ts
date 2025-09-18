import JsBarcode from 'jsbarcode';
import { BARCODE_CONFIG } from './config';

/**
 * Phase 2: Enhanced Barcode Rendering Service
 * Provides crystal-clear, consistent barcodes optimized for thermal printing
 * Ensures perfect quality across preview, print, and thermal contexts
 */

interface BarcodeRenderOptions {
  width?: number;
  height?: number;
  format?: 'svg' | 'canvas';
  displayValue?: boolean;
  fontSize?: number;
  dpi?: number;
  quality?: 'preview' | 'print' | 'thermal';
  context?: 'preview' | 'print' | 'thermal';
}

export class BarcodeRenderer {
  /**
   * Generate high-quality SVG barcode with context-aware optimization
   * SVG provides perfect scalability and crisp rendering
   */
  static generateSVG(value: string, options: BarcodeRenderOptions = {}): string {
    try {
      // Determine quality context
      const context = options.context || options.quality || 'preview';
      const qualityConfig = BARCODE_CONFIG.quality[context as keyof typeof BARCODE_CONFIG.quality] || BARCODE_CONFIG.quality.preview;
      
      // Build optimized configuration
      const config = {
        ...BARCODE_CONFIG,
        // Override with context-specific settings
        width: options.width ?? qualityConfig.width,
        height: options.height ?? qualityConfig.height,
        fontSize: options.fontSize ?? qualityConfig.fontSize,
        margin: qualityConfig.margin ?? BARCODE_CONFIG.margin,
        displayValue: options.displayValue ?? BARCODE_CONFIG.displayValue,
      };

      console.log(`🎨 BarcodeRenderer: Generating SVG for context "${context}"`, {
        barcode: value,
        width: config.width,
        height: config.height,
        fontSize: config.fontSize
      });

      // Create temporary SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      JsBarcode(svg, value, {
        ...config,
        xmlDocument: document
      });

      const result = svg.outerHTML;
      console.log(`✅ BarcodeRenderer: SVG generated successfully (${result.length} chars)`);
      return result;
    } catch (error) {
      console.error('❌ BarcodeRenderer: SVG generation failed:', error);
      return this.generateErrorSVG(value);
    }
  }

  /**
   * Generate high-quality canvas barcode with context-aware optimization
   * Canvas provides pixel-perfect rendering for specific display needs
   */
  static generateCanvas(value: string, options: BarcodeRenderOptions = {}): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    
    try {
      // Determine quality context
      const context = options.context || options.quality || 'preview';
      const qualityConfig = BARCODE_CONFIG.quality[context as keyof typeof BARCODE_CONFIG.quality] || BARCODE_CONFIG.quality.preview;
      
      const config = {
        ...BARCODE_CONFIG,
        width: options.width ?? qualityConfig.width,
        height: options.height ?? qualityConfig.height,
        fontSize: options.fontSize ?? qualityConfig.fontSize,
        displayValue: options.displayValue ?? BARCODE_CONFIG.displayValue,
      };

      console.log(`🖼️ BarcodeRenderer: Generating Canvas for context "${context}"`);

      // High-DPI scaling for crisp rendering
      const scale = window.devicePixelRatio || 1;
      const estimatedWidth = 200; // Base width for barcode
      const canvasWidth = estimatedWidth * scale;
      const canvasHeight = (config.height + 20) * scale;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `${estimatedWidth}px`;
      canvas.style.height = `${config.height + 20}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = false; // Crisp pixel-perfect rendering
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, estimatedWidth, config.height + 20);
      }

      JsBarcode(canvas, value, config);
      
      console.log(`✅ BarcodeRenderer: Canvas generated successfully`);
      return canvas;
    } catch (error) {
      console.error('❌ BarcodeRenderer: Canvas generation failed:', error);
      return this.generateErrorCanvas(value);
    }
  }

  /**
   * Generate optimized barcode for thermal printing
   * Uses thermal-specific settings for maximum scanner compatibility
   */
  static generateThermalPrint(value: string): string {
    return this.generateSVG(value, {
      context: 'thermal',
      displayValue: true
    });
  }

  /**
   * Generate barcode for preview display
   * Matches thermal output but optimized for screen display
   */
  static generatePreview(value: string): string {
    return this.generateSVG(value, {
      context: 'preview',
      displayValue: true
    });
  }

  /**
   * Generate high-quality barcode for print documents
   * Enhanced resolution for non-thermal printers
   */
  static generatePrint(value: string): string {
    return this.generateSVG(value, {
      context: 'print',
      displayValue: true
    });
  }

  private static generateErrorSVG(value: string): string {
    return `
      <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="60" fill="#ffebee" stroke="#f44336" stroke-width="1"/>
        <text x="100" y="25" text-anchor="middle" font-family="Arial" font-size="10" fill="#d32f2f">
          Barcode Error
        </text>
        <text x="100" y="40" text-anchor="middle" font-family="monospace" font-size="8" fill="#666">
          ${value}
        </text>
      </svg>
    `;
  }

  private static generateErrorCanvas(value: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 60;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffebee';
      ctx.fillRect(0, 0, 200, 60);
      ctx.strokeStyle = '#f44336';
      ctx.strokeRect(0, 0, 200, 60);
      ctx.fillStyle = '#d32f2f';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Barcode Error', 100, 25);
      ctx.fillStyle = '#666';
      ctx.font = '8px monospace';
      ctx.fillText(value, 100, 40);
    }
    
    return canvas;
  }
}