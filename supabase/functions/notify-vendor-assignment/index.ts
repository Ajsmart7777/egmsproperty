import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyVendorRequest {
  vendorUserId: string;
  vendorName: string;
  requestId: string;
  requestTitle: string;
  issueType: string;
  building: string;
  apartment: string;
  priority: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      vendorUserId,
      vendorName,
      requestId,
      requestTitle,
      issueType,
      building,
      apartment,
      priority,
    }: NotifyVendorRequest = await req.json();

    // Get vendor's email from profiles
    const { data: vendorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", vendorUserId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching vendor profile:", profileError);
      throw new Error("Failed to fetch vendor profile");
    }

    if (!vendorProfile?.email) {
      console.error("Vendor email not found");
      return new Response(
        JSON.stringify({ error: "Vendor email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const priorityColors: Record<string, string> = {
      low: "#22c55e",
      medium: "#f59e0b",
      high: "#ef4444",
    };

    const priorityColor = priorityColors[priority.toLowerCase()] || "#6b7280";

    const emailResponse = await resend.emails.send({
      from: "EGMS Property Management <onboarding@resend.dev>",
      to: [vendorProfile.email],
      subject: `New Assignment: ${requestTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #18181b; margin: 0; font-size: 24px;">New Maintenance Request Assigned</h1>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Hello ${vendorName},
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">
                You have been assigned a new maintenance request. Please review the details below:
              </p>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Request Title</td>
                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; font-weight: 600; text-align: right;">${requestTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Issue Type</td>
                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right;">${issueType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Location</td>
                    <td style="padding: 8px 0; color: #18181b; font-size: 14px; text-align: right;">${building}, ${apartment}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Priority</td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="background-color: ${priorityColor}20; color: ${priorityColor}; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${priority}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Please log in to your vendor dashboard to view the full request details and take action.
              </p>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="${Deno.env.get("SITE_URL") || "https://egmspropertymng.lovable.app"}/vendor-dashboard" 
                   style="display: inline-block; background-color: #18181b; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  View Request
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                This is an automated message from EGMS Property Management.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Vendor notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-vendor-assignment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
