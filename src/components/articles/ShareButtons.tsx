import { Linkedin, Twitter, Facebook, Mail, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  subtitle?: string;
  slug?: string;
}

const ShareButtons = ({ url, title, subtitle, slug }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  
  // Use edge function URL for social sharing to get proper OG tags
  const ogUrl = slug 
    ? `https://mlhngmnuxoetnlesnxgu.supabase.co/functions/v1/serve-og/article/${slug}`
    : url;
  
  const encodedUrl = encodeURIComponent(ogUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`${title}${subtitle ? ` - ${subtitle}` : ''}`);

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes');
  };

  return (
    <Card variant="elevated" className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Share Article
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* LinkedIn - Primary emphasis */}
        <Button
          onClick={() => openShareWindow(shareLinks.linkedin)}
          className="w-full justify-start gap-3 bg-[#0077b5] hover:bg-[#005885] text-white"
        >
          <Linkedin className="h-4 w-4" />
          <span>Share on LinkedIn</span>
        </Button>

        {/* Twitter/X */}
        <Button
          variant="outline"
          onClick={() => openShareWindow(shareLinks.twitter)}
          className="w-full justify-start gap-3"
        >
          <Twitter className="h-4 w-4" />
          <span>Share on X</span>
        </Button>

        {/* Facebook */}
        <Button
          variant="outline"
          onClick={() => openShareWindow(shareLinks.facebook)}
          className="w-full justify-start gap-3"
        >
          <Facebook className="h-4 w-4" />
          <span>Share on Facebook</span>
        </Button>

        {/* Copy Link */}
        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="w-full justify-start gap-3"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </Button>

        {/* Email */}
        <Button
          variant="outline"
          onClick={() => window.location.href = shareLinks.email}
          className="w-full justify-start gap-3"
        >
          <Mail className="h-4 w-4" />
          <span>Share via Email</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShareButtons;
