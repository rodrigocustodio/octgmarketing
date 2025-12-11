import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
}

async function sendWelcomeEmail(email: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #d4a574; margin: 0; font-size: 28px;">OCTG Index</h1>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 14px;">Industry Intelligence Platform</p>
      </div>
      
      <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1a1a2e; margin: 0 0 20px 0;">Welcome to the OCTG Index Newsletter!</h2>
        
        <p style="margin: 0 0 20px 0;">Thank you for subscribing to our newsletter. You're now connected to the leading source of OCTG industry intelligence.</p>
        
        <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 16px;">What to Expect:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
            <li style="margin-bottom: 8px;">Market analysis and pricing trends</li>
            <li style="margin-bottom: 8px;">Industry news and developments</li>
            <li style="margin-bottom: 8px;">Event coverage and announcements</li>
            <li style="margin-bottom: 8px;">Expert insights and commentary</li>
          </ul>
        </div>
        
        <p style="margin: 20px 0;">While you wait for our next newsletter, explore our latest articles and industry insights:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://octgindex.com" style="display: inline-block; background: #d4a574; color: #1a1a2e; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600;">Visit OCTG Index</a>
        </div>
        
        <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px;">
          Best regards,<br>
          <strong>The OCTG Index Team</strong>
        </p>
      </div>
      
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
          © ${new Date().getFullYear()} OCTG Index. All rights reserved.
        </p>
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">
          You received this email because you subscribed to the OCTG Index newsletter.<br>
          <a href="https://octgindex.com/newsletter-terms" style="color: #d4a574;">Newsletter Terms</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OCTG Index <noreply@octgindex.com>",
      to: [email],
      subject: "Welcome to OCTG Index Newsletter",
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[newsletter-subscribe] Resend error:", error);
  } else {
    console.log("[newsletter-subscribe] Welcome email sent successfully");
  }
}

async function syncToBrevo(email: string) {
  if (!BREVO_API_KEY) {
    console.log("[newsletter-subscribe] Brevo API key not configured, skipping sync");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [2], // Default list ID - adjust as needed
        updateEnabled: true,
        attributes: {
          SOURCE: "OCTG Index Website",
          SUBSCRIBED_AT: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[newsletter-subscribe] Brevo sync error:", error);
    } else {
      console.log("[newsletter-subscribe] Successfully synced to Brevo");
    }
  } catch (err) {
    console.error("[newsletter-subscribe] Brevo sync exception:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SubscribeRequest = await req.json();

    console.log(`[newsletter-subscribe] Processing subscription for ${email}`);

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to Supabase database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    if (dbError) {
      if (dbError.code === "23505") {
        // Already subscribed - still sync to Brevo
        console.log("[newsletter-subscribe] Email already in database, syncing to Brevo");
        await syncToBrevo(email);
        return new Response(
          JSON.stringify({ success: true, message: "You're already subscribed!" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("[newsletter-subscribe] Database error:", dbError);
        throw dbError;
      }
    }

    // Sync to Brevo for campaign management
    await syncToBrevo(email);

    // Send welcome email via Resend
    await sendWelcomeEmail(email);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully subscribed to newsletter" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[newsletter-subscribe] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
