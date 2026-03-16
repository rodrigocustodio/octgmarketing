import { Linkedin, Twitter, Facebook, Mail, Link2, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
  
  const shareUrl = slug 
    ? `https://octgindex.com/article/${slug}`
    : url;
  
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`${title}${subtitle ? ` - ${subtitle}` : ''}`);

  const shareLinks = {
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer.php?u=${encodedUrl}`,
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
    } catch {
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

  const iconButtonClass = "w-7 h-7 rounded-full border border-border/50 bg-transparent hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer";

  return (
    <div>
      <Separator className="mb-3" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Share:</span>
        <button
          onClick={() => openShareWindow(shareLinks.linkedin)}
          className={iconButtonClass}
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-3.5 w-3.5 text-foreground" />
        </button>
        <button
          onClick={() => openShareWindow(shareLinks.twitter)}
          className={iconButtonClass}
          aria-label="Share on X"
        >
          <Twitter className="h-3.5 w-3.5 text-foreground" />
        </button>
        <button
          onClick={() => openShareWindow(shareLinks.facebook)}
          className={iconButtonClass}
          aria-label="Share on Facebook"
        >
          <Facebook className="h-3.5 w-3.5 text-foreground" />
        </button>
        <button
          onClick={handleCopyLink}
          className={iconButtonClass}
          aria-label="Copy link"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Link2 className="h-3.5 w-3.5 text-foreground" />
          )}
        </button>
        <button
          onClick={() => window.location.href = shareLinks.email}
          className={iconButtonClass}
          aria-label="Share via email"
        >
          <Mail className="h-3.5 w-3.5 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ShareButtons;
