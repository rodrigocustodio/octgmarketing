import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
});

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side Zod validation
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message || "Invalid email");
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: result.data.email });

      if (dbError) {
        if (dbError.code === "23505") {
          toast.info("You're already subscribed!");
        } else if (dbError.code === "23514") {
          // CHECK constraint violation
          setError("Please enter a valid email address");
        } else {
          throw dbError;
        }
      } else {
        toast.success("Successfully subscribed to the newsletter!");
        setEmail("");
      }
    } catch (err) {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-card border border-border rounded-lg p-8 sm:p-12">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
          Stay Informed
        </h2>
        <p className="text-muted-foreground mb-6">
          Get the latest OCTG industry news, market analysis, and insights delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="space-y-1">
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
            {error && (
              <p id="email-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" variant="bronze" size="lg" className="w-full" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
