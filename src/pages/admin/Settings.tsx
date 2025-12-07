import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Zap, Clock } from "lucide-react";

const Settings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure the AI editorial pipeline
          </p>
        </div>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Required API keys for the scraper and AI agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Firecrawl API Key</p>
                <p className="text-sm text-muted-foreground">
                  Used for web scraping news sources
                </p>
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Not Configured
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">OpenAI API Key</p>
                <p className="text-sm text-muted-foreground">
                  Used for AI article generation
                </p>
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Not Configured
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Cron Secret</p>
                <p className="text-sm text-muted-foreground">
                  Authentication for scheduled endpoints
                </p>
              </div>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Not Configured
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              API keys are stored securely in the backend. Contact an administrator to configure them.
            </p>
          </CardContent>
        </Card>

        {/* Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automation Endpoints
            </CardTitle>
            <CardDescription>
              Endpoint URLs for triggering the scraper and AI agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="font-medium">Scraper Endpoint</p>
              <code className="text-sm text-muted-foreground block mt-1">
                POST /functions/v1/scrape-octg
              </code>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="font-medium">AI Draft Generator</p>
              <code className="text-sm text-muted-foreground block mt-1">
                POST /functions/v1/generate-drafts
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduling
            </CardTitle>
            <CardDescription>
              Recommended automation schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Scraper:</span>{" "}
                <span className="text-muted-foreground">Every 24 hours (e.g., 6:00 AM UTC)</span>
              </p>
              <p>
                <span className="font-medium">AI Generator:</span>{" "}
                <span className="text-muted-foreground">Every 24 hours, 1 hour after scraper</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Use GitHub Actions, cron-job.org, or any external scheduler to trigger these endpoints.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Settings;