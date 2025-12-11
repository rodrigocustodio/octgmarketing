import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Check, Sparkles } from "lucide-react";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
});

// Confetti particle component
function ConfettiParticle({ delay, left, color }: { delay: number; left: number; color: string }) {
  return (
    <span
      className="absolute w-2 h-2 rounded-full animate-confetti-fall"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        top: '-8px',
      }}
    />
  );
}

// Generate confetti particles
function Confetti() {
  const colors = [
    'hsl(var(--octg-bronze))',
    'hsl(var(--octg-gold))',
    'hsl(var(--octg-copper))',
    'hsl(var(--accent))',
  ];
  
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} left={p.left} color={p.color} />
      ))}
    </>
  );
}

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reset after animation completes
  useEffect(() => {
    if (isSubscribed) {
      setShowConfetti(true);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(confettiTimer);
    }
  }, [isSubscribed]);

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

  return (
    <section className="bg-gradient-card border border-border rounded-lg p-8 sm:p-12">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Column - Benefits */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Stay Informed
          </h2>
          <p className="text-lg font-medium text-octg-gold">
            Weekly Industry Intelligence
          </p>
          <p className="text-muted-foreground">
            Join thousands of OCTG professionals who rely on our newsletter for the insights that drive better business decisions.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-octg-gold flex-shrink-0" />
              <span>Market trends & pricing analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-octg-gold flex-shrink-0" />
              <span>Breaking industry news</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-octg-gold flex-shrink-0" />
              <span>Exclusive insights from experts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-octg-gold flex-shrink-0" />
              <span>Event coverage & announcements</span>
            </li>
          </ul>
        </div>

        {/* Right Column - Form with Flip Animation */}
        <div className="relative perspective-1000">
          <div
            className={`relative transition-transform duration-700 transform-style-3d ${
              isSubscribed ? "rotate-y-180" : ""
            }`}
          >
            {/* Front - Subscribe Form */}
            <div
              className={`backface-hidden ${isSubscribed ? "invisible" : ""}`}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      variant="bronze"
                      inputSize="lg"
                      aria-invalid={!!error}
                      aria-describedby={error ? "email-error" : undefined}
                    />
                  </div>
                  <Button type="submit" variant="bronze" size="lg" disabled={loading}>
                    {loading ? "..." : "Subscribe"}
                  </Button>
                </div>
                {error && (
                  <p id="email-error" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <li>• No spam, ever</li>
                  <li>• Unsubscribe anytime</li>
                  <li>• Weekly insights delivered</li>
                </ul>
              </form>
            </div>

            {/* Back - Success State */}
            <div
              className={`absolute inset-0 bg-card/50 border border-border/50 rounded-lg p-6 rotate-y-180 backface-hidden overflow-hidden ${
                !isSubscribed ? "invisible" : ""
              }`}
            >
              {/* Confetti container */}
              {showConfetti && <Confetti />}
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-octg-bronze via-octg-gold to-octg-copper flex items-center justify-center mb-4 animate-scale-in">
                  <Check className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-octg-gold" />
                  <span className="text-sm font-medium text-octg-gold uppercase tracking-wider">You're In!</span>
                  <Sparkles className="w-4 h-4 text-octg-gold" />
                </div>
                
                <h3 className="font-display text-xl font-semibold mb-2">
                  Welcome to OCTG Index Newsletter
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  Expect industry insights and market analysis delivered to your inbox.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
