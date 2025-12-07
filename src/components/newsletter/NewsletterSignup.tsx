import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully subscribed to the newsletter!");
        setEmail("");
      }
    } catch (error) {
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
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="bronze"
            inputSize="lg"
            required
          />
          <Button type="submit" variant="bronze" size="lg" className="w-full" disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
