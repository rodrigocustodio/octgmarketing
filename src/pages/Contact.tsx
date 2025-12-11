import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Megaphone,
  Handshake,
  Newspaper,
  HelpCircle,
  Calendar,
  UserCheck,
  Database,
  Globe,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Users,
  Building2,
  Loader2,
  MessageSquare,
  Palette,
  Monitor,
  Cpu,
  Video,
  Smartphone,
  Presentation,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import heroOctg from "@/assets/hero-octg.jpg";

const contactReasons = [
  {
    id: "advertisement",
    label: "Advertisement & Sponsorship",
    description: "Promote your brand to OCTG industry professionals",
    icon: Megaphone,
  },
  {
    id: "media_partnership",
    label: "Media Partnership",
    description: "Collaborate on content and cross-promotion",
    icon: Handshake,
  },
  {
    id: "article_promotion",
    label: "Article Promotion / Press Release",
    description: "Share your company news with our audience",
    icon: Newspaper,
  },
  {
    id: "questions",
    label: "Questions & General Inquiries",
    description: "Get answers about our platform and services",
    icon: HelpCircle,
  },
  {
    id: "event_coverage",
    label: "Event Coverage Request",
    description: "Invite us to cover your industry event",
    icon: Calendar,
  },
  {
    id: "expert_contribution",
    label: "Industry Expert Contribution",
    description: "Contribute articles and expert insights",
    icon: UserCheck,
  },
  {
    id: "data_access",
    label: "Data & Research Access",
    description: "Access industry data and analytics",
    icon: Database,
  },
  {
    id: "consulting",
    label: "Communication Consulting",
    description: "Strategic communication consulting for energy companies",
    icon: MessageSquare,
  },
];

const marketingServices = [
  { icon: Palette, label: "Graphic Design" },
  { icon: Monitor, label: "Web Design" },
  { icon: Cpu, label: "AI Services & Automation" },
  { icon: Video, label: "Video Production" },
  { icon: Smartphone, label: "App Development" },
  { icon: Presentation, label: "C-Level Presentations" },
  { icon: GraduationCap, label: "Training Videos & Systems" },
  { icon: Sparkles, label: "Branding & Consulting" },
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  company: z.string().trim().max(100).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  contactReason: z.string().min(1, "Please select a reason for contact"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export default function Contact() {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse({
      ...formData,
      contactReason: selectedReason,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          jobTitle: formData.jobTitle || undefined,
          contactReason: selectedReason,
          message: formData.message,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Your message has been sent successfully!");
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Contact Us | OCTG Index"
        description="Get in touch with OCTG Index for advertising, media partnerships, press releases, event coverage, and industry inquiries. Connect with the leading OCTG intelligence platform."
        canonical="https://octgindex.com/contact"
      />
      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroOctg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
          <div className="relative z-10 container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with the leading source of OCTG industry intelligence. We're here to help you succeed.
            </p>
          </div>
        </section>

        {/* Why OCTG Index Section */}
        <section className="relative py-20 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/images/bg-octg-index.jpg')` }}
          />
          {/* Gradient Overlay - dark on left, revealing image on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Why OCTG Index Exists
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                OCTG Index is the leading news and intelligence platform serving the global Energy sector, providing comprehensive coverage of Oil & Gas, Solar, and OCTG Supply Chain Management industries.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our platform features an extensive OCTG Product directory with detailed technical specifications, a company database profiling over 200 industry players with their operations and contact information, and a Global CEO Leadership directory connecting executives and decision-makers across the worldwide OCTG ecosystem. We deliver real-time market intelligence, industry analysis, and event coverage to professionals driving the future of energy.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Reasons Selection */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
                How Can We Help?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Select the reason that best describes your inquiry, and we'll make sure it reaches the right team.
              </p>
            </div>

            {/* OCTG Marketing Services Banner */}
            <div className="relative max-w-6xl mx-auto mb-8">
              {/* Animated gradient border */}
              <div 
                className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-octg-bronze via-octg-gold to-octg-copper animate-gradient-flow opacity-80"
                style={{ backgroundSize: "200% 200%" }}
              />
              <div className="relative bg-card rounded-xl overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  {/* Left side - Content */}
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-octg-bronze to-octg-gold flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold">OCTG Marketing Services</h3>
                        <p className="text-sm text-muted-foreground">Full-Service Agency for Energy & Oil Gas</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      OCTG Index is part of OCTG Marketing — a full-service agency supporting Energy, Oil & Gas companies with their Marketing and Creative needs.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {marketingServices.map((service) => {
                        const Icon = service.icon;
                        return (
                          <div 
                            key={service.label}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm"
                          >
                            <Icon className="h-3.5 w-3.5 text-octg-bronze" />
                            <span>{service.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <a
                      href="https://octgmarketing.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-octg-bronze to-octg-gold text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Explore Our Services
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  {/* Right side - Image */}
                  <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
                    <img
                      src="/images/octg-marketing-team.jpg"
                      alt="OCTG Marketing Team"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
              {contactReasons.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <Card
                    key={reason.id}
                    className={`cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:bg-card/80"
                    }`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <CardTitle className="text-base mt-3">{reason.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{reason.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {errors.contactReason && (
              <p className="text-center text-destructive text-sm mb-8">{errors.contactReason}</p>
            )}
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {isSubmitted ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-4">Message Sent Successfully!</h2>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We've sent a confirmation to your email and our team will respond within 1-2 business days.
                    </p>
                    <Button onClick={() => { setIsSubmitted(false); setFormData({ name: "", email: "", company: "", jobTitle: "", message: "" }); setSelectedReason(""); }}>
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="John Smith"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            placeholder="Company Name"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input
                            id="jobTitle"
                            placeholder="Your Position"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          />
                        </div>
                      </div>

                      {selectedReason && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              {contactReasons.find((r) => r.id === selectedReason)?.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {contactReasons.find((r) => r.id === selectedReason)?.description}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="message">Your Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us about your inquiry in detail..."
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                      </div>

                      <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Quick Contact Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Email Us</h3>
                  <a
                    href="mailto:info@octgindex.com"
                    className="text-primary hover:underline"
                  >
                    info@octgindex.com
                  </a>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Global Coverage</h3>
                  <p className="text-muted-foreground text-sm">
                    Americas, Europe, Asia-Pacific, Middle East, Africa, Australia
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Headquarters</h3>
                  <p className="text-muted-foreground text-sm">
                    Houston, Texas, USA
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <NewsletterSignup />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
