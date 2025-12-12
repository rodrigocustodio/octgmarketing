import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Check, Mail } from "lucide-react";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
});

interface NewsletterSignupProps {
  variant?: 'default' | 'compact';
}

export function NewsletterSignup({ variant = 'default' }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message || "Invalid email");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-subscribe", {
        body: { email: result.data.email },
      });

      if (error) {
        throw error;
      }

      if (data?.alreadySubscribed) {
        toast.info("You're already subscribed!");
      } else {
        setIsSubscribed(true);
      }
      setEmail("");
    } catch (err) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Compact variant for sidebar usage
  if (variant === 'compact') {
    return (
      <section className="bg-gradient-card border border-border rounded-lg p-6">
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold tracking-tight">
            Stay Informed
          </h3>
          <p className="text-sm text-muted-foreground">
            Get weekly OCTG industry insights delivered to your inbox.
          </p>
          
          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                variant="bronze"
                aria-invalid={!!error}
              />
              <Button type="submit" variant="bronze" className="w-full" disabled={loading}>
                {loading ? "Subscribing..." : "Subscribe"}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-octg-bronze via-octg-gold to-octg-copper flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-octg-gold">You're In!</p>
              <p className="text-sm text-muted-foreground mt-1">Welcome to the newsletter.</p>
            </div>
          )}
          
          {!isSubscribed && (
            <p className="text-xs text-muted-foreground">
              No spam • Unsubscribe anytime
            </p>
          )}
        </div>
      </section>
    );
  }

  // Default full-width variant - Clean corporate card design
  return (
    <section className="bg-gradient-card border border-border rounded-xl p-8 sm:p-10">
      <div className="max-w-xl mx-auto text-center space-y-6">
        {/* Heading with accent icon */}
        <div className="flex items-center justify-center gap-3">
          <Mail className="h-6 w-6 text-accent" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            Stay Informed
          </h2>
        </div>
        
        {/* Subtitle */}
        <p className="text-muted-foreground text-lg">
          Get weekly OCTG industry insights and market intelligence delivered to your inbox.
        </p>
        
        {/* Form OR Success State */}
        {!isSubscribed ? (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                className="flex-1"
                aria-invalid={!!error}
              />
              <Button type="submit" variant="bronze" size="lg" disabled={loading}>
                {loading ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              No spam • Unsubscribe anytime • Weekly insights delivered
            </p>
          </div>
        ) : (
          <div className="py-6 space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-octg-bronze via-octg-gold to-octg-copper flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-white" />
            </div>
            <p className="font-semibold text-xl text-accent">You're In!</p>
            <p className="text-muted-foreground">
              Welcome to the OCTG Index newsletter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
