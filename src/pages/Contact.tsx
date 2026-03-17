import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle2,
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
  Store,
  ShoppingBag,
  PenTool,
  LayoutGrid,
  Mail,
  Instagram,
  Facebook,
} from "lucide-react";

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
  { icon: Store, label: "Trade Show Design" },
  { icon: ShoppingBag, label: "Merch" },
  { icon: PenTool, label: "Signage" },
  { icon: LayoutGrid, label: "Billboards" },
];

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Norway",
  "Netherlands",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Brazil",
  "Argentina",
  "Mexico",
  "Colombia",
  "Venezuela",
  "China",
  "Japan",
  "South Korea",
  "India",
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Australia",
  "Nigeria",
  "Angola",
  "Egypt",
  "Algeria",
  "Libya",
  "Russia",
  "Kazakhstan",
  "Azerbaijan",
  "Other",
];

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email").max(255),
  company: z.string().trim().min(1, "Company is required").max(100),
  phoneNumber: z.string().trim().max(30).optional(),
  country: z.string().min(1, "Please select a country"),
  contactReason: z.string().min(1, "Please select a reason for contact"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  subscribeNewsletter: z.boolean().optional(),
});

export default function Contact() {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phoneNumber: "",
    country: "",
    message: "",
    subscribeNewsletter: false,
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
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          company: formData.company,
          phoneNumber: formData.phoneNumber || undefined,
          country: formData.country,
          contactReason: selectedReason,
          message: formData.message,
          subscribeNewsletter: formData.subscribeNewsletter,
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
              <h1 className="text-3xl font-bold text-foreground mb-6">
                Contact Us
              </h1>
              <h2 className="text-xl font-semibold text-foreground mb-4">
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

        {/* About Us / Team Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Meet Our Team
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                The professionals behind OCTG Index, dedicated to delivering industry intelligence.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {/* Rodrigo Santos */}
              <div className="bg-card/50 rounded-xl p-6 border border-border/50 text-center">
                <img
                  src="/images/team/rodrigo-santos.jpg"
                  alt="Rodrigo Santos"
                  className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground">Rodrigo Santos</h3>
                <p className="text-sm text-octg-gold mb-3">CEO, OCTG Marketing</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Rodrigo leads OCTG Marketing as CEO, driving the strategic vision behind the OCTG Index platform with deep expertise in energy sector communications.
                </p>
              </div>

              {/* Franklin Clarke */}
              <div className="bg-card/50 rounded-xl p-6 border border-border/50 text-center">
                <img
                  src="/images/team/franklin-clarke.jpg"
                  alt="Franklin Clarke"
                  className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground">Franklin Clarke</h3>
                <p className="text-sm text-octg-gold mb-3">Regional Coverage Director</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Franklin oversees OCTG Index's global regional coverage, ensuring comprehensive news and analysis from every major oil and gas market.
                </p>
              </div>

              {/* Oliver Duncan */}
              <div className="bg-card/50 rounded-xl p-6 border border-border/50 text-center">
                <img
                  src="/images/team/oliver-duncan.jpg"
                  alt="Oliver Duncan"
                  className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground">Oliver Duncan</h3>
                <p className="text-sm text-octg-gold mb-3">Events & Calendar Director</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Oliver manages the OCTG Index events calendar, tracking 60+ industry conferences and connecting professionals with networking opportunities.
                </p>
              </div>

              {/* Maria Oliveira */}
              <div className="bg-card/50 rounded-xl p-6 border border-border/50 text-center">
                <img
                  src="/images/team/maria-oliveira.jpg"
                  alt="Maria Oliveira"
                  className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground">Maria Oliveira</h3>
                <p className="text-sm text-octg-gold mb-3">Latin America Correspondent</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Maria covers the South American OCTG market, providing in-depth analysis of Brazil, Argentina, and regional developments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/images/bg-offshore.jpg')` }}
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70 dark:bg-black/80" />

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-card/95 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-display">Get In Touch</CardTitle>
                    <div className="flex items-center gap-2">
                      <a
                        href="mailto:info@octgindex.com"
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Email us"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                      <a
                        href="https://instagram.com/octgindex"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                      <a
                        href="https://facebook.com/octgindex"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                      <h3 className="text-lg font-semibold mb-1">Thank You!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your message has been received. We'll be in touch soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Contact Reason */}
                      <div>
                        <Select value={selectedReason} onValueChange={setSelectedReason}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Reason for contact *" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {contactReasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.contactReason && (
                          <p className="text-destructive text-sm mt-1">{errors.contactReason}</p>
                        )}
                      </div>

                      {/* Name Row */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="First name *"
                            className="bg-background"
                          />
                          {errors.firstName && (
                            <p className="text-destructive text-sm mt-1">{errors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Last name *"
                            className="bg-background"
                          />
                          {errors.lastName && (
                            <p className="text-destructive text-sm mt-1">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      {/* Email + Phone Row */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Email address *"
                            className="bg-background"
                          />
                          {errors.email && (
                            <p className="text-destructive text-sm mt-1">{errors.email}</p>
                          )}
                        </div>
                        <div>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="Phone number"
                            className="bg-background"
                          />
                        </div>
                      </div>

                      {/* Company + Country Row */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Company *"
                            className="bg-background"
                          />
                          {errors.company && (
                            <p className="text-destructive text-sm mt-1">{errors.company}</p>
                          )}
                        </div>
                        <div>
                          <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Country *" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover max-h-60">
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.country && (
                            <p className="text-destructive text-sm mt-1">{errors.country}</p>
                          )}
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Your message *"
                          rows={4}
                          className="bg-background resize-none"
                        />
                        {errors.message && (
                          <p className="text-destructive text-sm mt-1">{errors.message}</p>
                        )}
                      </div>

                      {/* Newsletter Checkbox */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="subscribeNewsletter"
                          checked={formData.subscribeNewsletter}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, subscribeNewsletter: checked === true })
                          }
                        />
                        <Label htmlFor="subscribeNewsletter" className="text-sm text-muted-foreground cursor-pointer">
                          Subscribe to our newsletter
                        </Label>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Submit Message"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
