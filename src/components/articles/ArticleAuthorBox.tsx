import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface Author {
  name: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
}

interface ArticleAuthorBoxProps {
  author: Author;
}

export function ArticleAuthorBox({ author }: ArticleAuthorBoxProps) {
  return (
    <Card className="mt-12 p-6 md:p-8 border-border/50 bg-card/50">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.name}
              className="w-20 h-20 rounded-xl object-cover border border-border/50"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
              <span className="text-2xl font-semibold text-muted-foreground">
                {author.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Written by</p>
          <h3 className="text-xl font-bold text-foreground mb-1">
            {author.name}
          </h3>
          <p className="text-sm font-medium text-primary mb-3">
            {author.title}
          </p>
          {author.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {author.bio}
            </p>
          )}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground mb-4">
          Have questions about this article or industry coverage?
        </p>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/contact">
            <Mail className="h-4 w-4" />
            Contact Our Team
          </Link>
        </Button>
      </div>
    </Card>
  );
}
