import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const { html, type, filename, sale_id } = await req.json();
    
    if (!html || !type) {
      return new Response(
        JSON.stringify({ error: 'HTML content and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${type} conversion for ${filename || 'document'}`);

    // Initialize Supabase client for storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let convertedContent: ArrayBuffer;
    let contentType: string;
    let fileExtension: string;

    if (type === 'pdf') {
      // Convert HTML to PDF using html-to-pdf function
      const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/html-to-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          options: {
            format: 'A4',
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            filename: filename || 'document'
          }
        })
      });

      if (!pdfResponse.ok) {
        throw new Error('PDF conversion failed');
      }

      convertedContent = await pdfResponse.arrayBuffer();
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      // For other types, return HTML directly
      convertedContent = new TextEncoder().encode(html);
      contentType = 'text/html';
      fileExtension = 'html';
    }

    // Store in Supabase Storage if needed
    if (sale_id) {
      const storageFileName = `${filename || 'document'}.${fileExtension}`;
      const storagePath = `receipts/${sale_id}/${storageFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, convertedContent, {
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.warn('Storage upload failed:', uploadError);
        // Continue without storage - return the content directly
      } else {
        console.log(`Stored ${type} at: ${storagePath}`);
      }
    }

    // Return the converted content
    return new Response(convertedContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename || 'document'}.${fileExtension}"`
      },
    });

  } catch (error) {
    console.error('Capture and convert failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to capture and convert content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});