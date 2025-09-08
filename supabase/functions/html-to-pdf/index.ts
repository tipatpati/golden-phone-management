import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, options = {} } = await req.json();
    
    if (!html) {
      return new Response(
        JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Converting HTML to PDF...');

    // Use Puppeteer via API service (alternative to running Puppeteer in Deno)
    const puppeteerApiUrl = 'https://api.html-pdf-api.com/v1/generate';
    const apiKey = Deno.env.get('HTML_PDF_API_KEY');
    
    if (!apiKey) {
      // Fallback: create a simple PDF placeholder response
      console.warn('No PDF API key found, returning HTML response');
      
      const htmlWithStyles = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @page { margin: 0; size: A4; }
              body { margin: 8px; font-family: 'Courier New', monospace; }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `;
      
      return new Response(htmlWithStyles, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
        },
      });
    }

    // Convert HTML to PDF using external service
    const pdfResponse = await fetch(puppeteerApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html,
        options: {
          format: options.format || 'A4',
          printBackground: true,
          margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
          ...options
        }
      })
    });

    if (!pdfResponse.ok) {
      throw new Error(`PDF generation failed: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${options.filename || 'document'}.pdf"`,
      },
    });

  } catch (error) {
    console.error('HTML to PDF conversion failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to convert HTML to PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});