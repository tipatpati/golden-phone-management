import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  supplier: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = "https://joiwowvlujajwbarpsuc.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaXdvd3ZsdWphandiYXJwc3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NjY5NDEsImV4cCI6MjA2NTQ0Mjk0MX0.0zl0V76SCadbeuFw7VfzaKfvKdMb18KuEji26VbU3mw";
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authorization token from request
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      supabase.auth.setAuth(authHeader.replace("Bearer ", ""));
    }

    console.log("Fetching low stock items...");

    // Fetch products where stock is at or below threshold
    const { data: lowStockItems, error: fetchError } = await supabase
      .from("products")
      .select("id, name, sku, stock, threshold, supplier")
      .lte("stock", "threshold")
      .not("supplier", "is", null);

    if (fetchError) {
      console.error("Error fetching low stock items:", fetchError);
      throw new Error(`Failed to fetch low stock items: ${fetchError.message}`);
    }

    if (!lowStockItems || lowStockItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No low stock items found",
          contactedSuppliers: []
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${lowStockItems.length} low stock items`);

    // Group items by supplier
    const supplierGroups = lowStockItems.reduce((groups: Record<string, LowStockItem[]>, item) => {
      const supplier = item.supplier || "Unknown Supplier";
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(item);
      return groups;
    }, {});

    const contactedSuppliers: string[] = [];

    // Send email to each supplier
    for (const [supplierName, items] of Object.entries(supplierGroups)) {
      try {
        // Get supplier email from database
        const { data: supplierData } = await supabase
          .from("suppliers")
          .select("email, name")
          .eq("name", supplierName)
          .single();

        const supplierEmail = supplierData?.email;
        
        if (!supplierEmail) {
          console.warn(`No email found for supplier: ${supplierName}`);
          continue;
        }

        // Create email content
        const itemsList = items
          .map(item => `• ${item.name} (SKU: ${item.sku}) - Stock: ${item.stock}, Threshold: ${item.threshold}`)
          .join("\n");

        const emailHTML = `
          <h2>Low Stock Alert</h2>
          <p>Dear ${supplierData.name || supplierName},</p>
          <p>We are running low on the following items that you supply:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <pre style="margin: 0; white-space: pre-wrap; font-family: monospace;">${itemsList}</pre>
          </div>
          <p>Please contact us to arrange restocking of these items.</p>
          <p>Best regards,<br>Phone Management System</p>
        `;

        const emailResponse = await resend.emails.send({
          from: "Phone Management <inventory@your-domain.com>",
          to: [supplierEmail],
          subject: `Low Stock Alert - ${items.length} items need restocking`,
          html: emailHTML,
        });

        console.log(`Email sent to ${supplierName}:`, emailResponse);
        contactedSuppliers.push(supplierName);

      } catch (emailError) {
        console.error(`Failed to send email to ${supplierName}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully contacted ${contactedSuppliers.length} suppliers`,
        contactedSuppliers,
        lowStockItems: lowStockItems.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in contact-suppliers function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);