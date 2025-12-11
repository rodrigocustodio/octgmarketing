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
      from: "OCTG Index <noreply@octgindex.com>",
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
    const { name, email, company, jobTitle, contactReason, message }: ContactRequest = await req.json();

    console.log(`[send-contact-email] Processing contact from ${email}, reason: ${contactReason}`);

    // Validate required fields
    if (!name || !email || !contactReason || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Send confirmation email to user
    const userEmailHtml = `
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
          <h2 style="color: #1a1a2e; margin: 0 0 20px 0;">Thank you for reaching out, ${name}!</h2>
          
          <p style="margin: 0 0 20px 0;">We've received your message regarding <strong>${reasonLabel}</strong> and our team will review it promptly.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Your Message:</strong></p>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="margin: 20px 0 0 0;">We typically respond within 1-2 business days. In the meantime, feel free to explore our latest industry insights on our website.</p>
          
          <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px;">
            Best regards,<br>
            <strong>The OCTG Index Team</strong>
          </p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} OCTG Index. All rights reserved.<br>
            <a href="https://octgindex.com" style="color: #d4a574;">octgindex.com</a>
          </p>
        </div>
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
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          ${company ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Company:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${company}</td>
          </tr>
          ` : ""}
          ${jobTitle ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Job Title:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${jobTitle}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Reason:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>${reasonLabel}</strong></td>
          </tr>
        </table>
        
        <h3 style="color: #1a1a2e; margin: 30px 0 15px 0;">Message:</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
        
        <p style="margin: 30px 0 0 0; font-size: 12px; color: #6b7280;">
          Submitted at: ${new Date().toISOString()}<br>
          Reply directly to this email to respond to ${name}.
        </p>
      </body>
      </html>
    `;

    await sendEmail(["info@octgindex.com"], `New Contact: ${reasonLabel} - ${name}`, teamEmailHtml, email);
    console.log("[send-contact-email] Team notification sent");

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
