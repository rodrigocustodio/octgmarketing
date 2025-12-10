import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-border text-foreground bg-transparent",
        region: "bg-primary/90 text-primary-foreground border-primary/50 hover:bg-primary",
        topic: "bg-accent/90 text-accent-foreground border-accent/50 hover:bg-accent",
        featured: "bg-accent text-accent-foreground border-accent/50 hover:bg-accent/90",
        status: "bg-muted text-muted-foreground border-border",
        "status-active": "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
        "status-draft": "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
        "status-published": "bg-primary/15 text-primary border-primary/30",
        asset: "bg-octg-steel/15 text-octg-steel border-octg-steel/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
