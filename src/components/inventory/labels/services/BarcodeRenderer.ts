import JsBarcode from 'jsbarcode';
import { BARCODE_CONFIG } from './config';

/**
 * High-quality barcode rendering service for thermal labels
 * Provides crisp, consistent barcodes for both preview and print
 */

interface BarcodeRenderOptions {
  width?: number;
  height?: number;
  format?: 'svg' | 'canvas';
  displayValue?: boolean;
  fontSize?: number;
  dpi?: number;
  quality?: 'standard' | 'high' | 'print';
}

export class BarcodeRenderer {
  /**
   * Generate high-quality SVG barcode
   * SVG provides perfect quality at any scale
   */
  static generateSVG(value: string, options: BarcodeRenderOptions = {}): string {
    try {
      const config = {
        ...BARCODE_CONFIG,
        width: options.width ?? BARCODE_CONFIG.width,
        height: options.height ?? BARCODE_CONFIG.height,
        displayValue: options.displayValue ?? BARCODE_CONFIG.displayValue,
        fontSize: options.fontSize ?? BARCODE_CONFIG.fontSize,
      };

      // Quality adjustments based on use case
      if (options.quality === 'print') {
        config.width = config.width * 1.5; // Higher resolution for printing
        config.height = config.height * 1.2;
        config.fontSize = config.fontSize * 1.1;
      } else if (options.quality === 'high') {
        config.width = config.width * 1.2;
        config.fontSize = config.fontSize * 1.05;
      }

      // Create temporary SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      JsBarcode(svg, value, {
        ...config,
        xmlDocument: document
      });

      return svg.outerHTML;
    } catch (error) {
      console.error('SVG barcode generation failed:', error);
      return this.generateErrorSVG(value);
    }
  }

  /**
   * Generate high-quality canvas barcode with proper scaling
   */
  static generateCanvas(value: string, options: BarcodeRenderOptions = {}): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    
    try {
      const config = {
        ...BARCODE_CONFIG,
        width: options.width ?? BARCODE_CONFIG.width,
        height: options.height ?? BARCODE_CONFIG.height,
        displayValue: options.displayValue ?? BARCODE_CONFIG.displayValue,
        fontSize: options.fontSize ?? BARCODE_CONFIG.fontSize,
      };

      // High-DPI scaling for crisp rendering
      const scale = window.devicePixelRatio || 1;
      const canvasWidth = 220 * scale;
      const canvasHeight = (config.height + 20) * scale;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = `220px`;
      canvas.style.height = `${config.height + 20}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = false; // Crisp pixel-perfect rendering
      }

      JsBarcode(canvas, value, config);
      
      return canvas;
    } catch (error) {
      console.error('Canvas barcode generation failed:', error);
      return this.generateErrorCanvas(value);
    }
  }

  /**
   * Generate optimized barcode for thermal printing
   */
  static generateThermalPrint(value: string): string {
    return this.generateSVG(value, {
      quality: 'print',
      displayValue: true,
      fontSize: 8
    });
  }

  /**
   * Generate barcode for preview display
   */
  static generatePreview(value: string): string {
    return this.generateSVG(value, {
      quality: 'high',
      displayValue: true,
      fontSize: 7
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