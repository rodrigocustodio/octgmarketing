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
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); padding: 48px 40px; text-align: center; border-radius: 16px 16px 0 0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #d4a574 0%, #c9956a 100%); border-radius: 12px; margin-bottom: 20px; display: inline-block;">
                          <span style="font-size: 32px; line-height: 60px; color: #0f172a;">⬡</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">OCTG Index</h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">Industry Intelligence Platform</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Welcome Message -->
              <tr>
                <td style="background: #ffffff; padding: 48px 40px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <span style="display: inline-block; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); color: #166534; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 20px;">✓ Subscription Confirmed</span>
                      </td>
                    </tr>
                  </table>
                  
                  <h2 style="margin: 0 0 24px 0; font-size: 26px; font-weight: 600; color: #0f172a; text-align: center;">Welcome to OCTG Index!</h2>
                  
                  <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.7; color: #475569; text-align: center;">
                    You're now connected to the leading source of OCTG industry intelligence. Get ready to receive exclusive insights directly to your inbox.
                  </p>
                  
                  <!-- What to Expect -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0; background: linear-gradient(135deg, #faf5f0 0%, #f5ebe0 100%); border-radius: 12px;">
                    <tr>
                      <td style="padding: 28px;">
                        <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">What You'll Receive</h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(212, 165, 116, 0.2);">
                              <span style="color: #d4a574; font-size: 16px; margin-right: 12px;">📊</span>
                              <span style="color: #1e293b; font-size: 15px;">Market analysis and pricing trends</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(212, 165, 116, 0.2);">
                              <span style="color: #d4a574; font-size: 16px; margin-right: 12px;">📰</span>
                              <span style="color: #1e293b; font-size: 15px;">Breaking industry news and developments</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(212, 165, 116, 0.2);">
                              <span style="color: #d4a574; font-size: 16px; margin-right: 12px;">🎯</span>
                              <span style="color: #1e293b; font-size: 15px;">Exclusive insights and expert commentary</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0;">
                              <span style="color: #d4a574; font-size: 16px; margin-right: 12px;">📅</span>
                              <span style="color: #1e293b; font-size: 15px;">Event coverage and announcements</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="https://octgindex.com" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c9956a 100%); color: #0f172a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(212, 165, 116, 0.35);">
                          Explore Latest Articles
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 32px 0 0 0; font-size: 15px; line-height: 1.7; color: #64748b; text-align: center;">
                    Best regards,<br>
                    <strong style="color: #0f172a;">The OCTG Index Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #0f172a; padding: 32px 40px; border-radius: 0 0 16px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <a href="https://octgindex.com" style="color: #d4a574; text-decoration: none; font-size: 14px; margin: 0 12px;">Website</a>
                        <span style="color: #475569;">•</span>
                        <a href="https://octgindex.com/events" style="color: #d4a574; text-decoration: none; font-size: 14px; margin: 0 12px;">Events</a>
                        <span style="color: #475569;">•</span>
                        <a href="https://octgindex.com/ceo-directory" style="color: #d4a574; text-decoration: none; font-size: 14px; margin: 0 12px;">Leadership</a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="margin: 0; font-size: 12px; color: #64748b;">
                          © ${new Date().getFullYear()} OCTG Index. All rights reserved.
                        </p>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #475569;">
                          You received this email because you subscribed to the OCTG Index newsletter.<br>
                          <a href="https://octgindex.com/newsletter-terms" style="color: #d4a574;">Newsletter Terms</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
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
      from: "OCTG Index <info@octgindex.com>",
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
