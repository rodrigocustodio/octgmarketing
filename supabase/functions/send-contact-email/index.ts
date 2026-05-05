import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
  contactReason: string;
  message: string;
  subscribeNewsletter?: boolean;
}

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

async function syncToBrevo(email: string, name?: string) {
  if (!BREVO_API_KEY) {
    console.log("[send-contact-email] BREVO_API_KEY not set, skipping Brevo sync");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        listIds: [2],
        updateEnabled: true,
        attributes: {
          FIRSTNAME: name || "",
          SOURCE: "OCTG Index Contact Form",
          SUBSCRIBED_AT: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[send-contact-email] Brevo sync error:", error);
    } else {
      console.log("[send-contact-email] Synced to Brevo successfully");
    }
  } catch (error) {
    console.error("[send-contact-email] Brevo sync failed:", error);
  }
}

const reasonLabels: Record<string, string> = {
  advertisement: "Advertisement & Sponsorship",
  media_partnership: "Media Partnership",
  article_promotion: "Article Promotion / Press Release",
  questions: "Questions & General Inquiries",
  event_coverage: "Event Coverage Request",
  expert_contribution: "Industry Expert Contribution",
  data_access: "Data & Research Access",
};

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "OCTG Index <info@octgindex.com>",
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, jobTitle, contactReason, message, subscribeNewsletter }: ContactRequest = await req.json();

    console.log(`[send-contact-email] Processing contact from ${email}, reason: ${contactReason}, newsletter: ${subscribeNewsletter}`);

    // Validate required fields
    if (!name || !email || !contactReason || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side length validation (defense in depth — bypasses client Zod)
    const lengthChecks: Array<[string, unknown, number]> = [
      ["name", name, 200],
      ["email", email, 255],
      ["company", company, 200],
      ["jobTitle", jobTitle, 200],
      ["contactReason", contactReason, 100],
      ["message", message, 5000],
    ];
    for (const [field, value, max] of lengthChecks) {
      if (typeof value === "string" && value.length > max) {
        return new Response(
          JSON.stringify({ error: `${field} exceeds maximum length of ${max} characters` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // Basic email shape check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("contact_submissions").insert({
      name,
      email,
      company: company || null,
      job_title: jobTitle || null,
      contact_reason: contactReason,
      message,
    });

    if (dbError) {
      console.error("[send-contact-email] Database error:", dbError);
      throw dbError;
    }

    const reasonLabel = reasonLabels[contactReason] || contactReason;

    // HTML-escape all user-supplied values before embedding into email templates.
    const escapeHtml = (s: string): string =>
      s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const eName = escapeHtml(name);
    const eEmail = escapeHtml(email);
    const eCompany = company ? escapeHtml(company) : "";
    const eJobTitle = jobTitle ? escapeHtml(jobTitle) : "";
    const eMessage = escapeHtml(message);
    const eReasonLabel = escapeHtml(reasonLabel);

    // Send confirmation email to user
    const userEmailHtml = `
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
                
                <!-- Main Content -->
                <tr>
                  <td style="background: #ffffff; padding: 48px 40px;">
                    <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #0f172a;">Thank you for reaching out, ${eName}!</h2>
                    
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #475569;">
                      We've received your inquiry regarding <span style="color: #d4a574; font-weight: 600;">${eReasonLabel}</span>. Our team is reviewing your message and will respond within 1-2 business days.
                    </p>
                    
                    <!-- Message Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #faf5f0 0%, #f5ebe0 100%); border-left: 4px solid #d4a574; border-radius: 0 12px 12px 0; padding: 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Your Message</p>
                          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #1e293b; white-space: pre-wrap;">${eMessage}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="https://octgindex.com" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c9956a 100%); color: #0f172a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(212, 165, 116, 0.35);">
                            Explore Industry Insights
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 32px 0 0 0; font-size: 15px; line-height: 1.7; color: #64748b;">
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
                            This email was sent to ${eEmail} in response to your contact request.
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

    await sendEmail([email], "We've received your message - OCTG Index", userEmailHtml);
    console.log("[send-contact-email] User confirmation sent");

    // Send notification email to team
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">New Contact Form Submission</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 140px;">Name:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${eName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${eEmail}">${eEmail}</a></td>
          </tr>
          ${company ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Company:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${eCompany}</td>
          </tr>
          ` : ""}
          ${jobTitle ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Job Title:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${eJobTitle}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Reason:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${eReasonLabel}</strong></td>
          </tr>
        </table>
        
        <h3 style="color: #1a1a2e; margin: 30px 0 15px 0;">Message:</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">${eMessage}</div>
        
        <p style="margin: 30px 0 0 0; font-size: 12px; color: #6b7280;">
          Submitted at: ${new Date().toISOString()}<br>
          Reply directly to this email to respond to ${eName}.
        </p>
      </body>
      </html>
    `;

    await sendEmail(["info@octgindex.com"], `New Contact: ${reasonLabel} - ${name}`, teamEmailHtml, email);
    console.log("[send-contact-email] Team notification sent");

    // Handle newsletter subscription if opted in
    if (subscribeNewsletter) {
      console.log("[send-contact-email] User opted in to newsletter, syncing to Brevo...");
      
      // Add to newsletter_subscribers table
      const { error: newsletterError } = await supabase.from("newsletter_subscribers").insert({
        email,
      });

      if (newsletterError) {
        // If duplicate, that's fine - they're already subscribed
        if (newsletterError.code !== "23505") {
          console.error("[send-contact-email] Newsletter insert error:", newsletterError);
        }
      }

      // Sync to Brevo
      await syncToBrevo(email, name);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contact form submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[send-contact-email] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
