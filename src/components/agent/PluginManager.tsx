import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Database, Globe, Code, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  version: string;
  category: "search" | "database" | "api" | "utility";
}

export const PluginManager = () => {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([
    {
      id: "web-search",
      name: "Web Search",
      description: "Search the web using OpenRouter-powered search APIs. Enables agent to find real-time information.",
      icon: Search,
      enabled: true,
      version: "1.0.0",
      category: "search",
    },
    {
      id: "postgres-db",
      name: "PostgreSQL Database",
      description: "Direct access to Supabase PostgreSQL database for persistent data storage and retrieval.",
      icon: Database,
      enabled: true,
      version: "1.0.0",
      category: "database",
    },
    {
      id: "http-api",
      name: "HTTP API Client",
      description: "Make HTTP requests to external APIs. Supports REST, GraphQL, and webhooks.",
      icon: Globe,
      enabled: true,
      version: "1.0.0",
      category: "api",
    },
    {
      id: "code-executor",
      name: "Code Executor",
      description: "Execute sandboxed JavaScript/TypeScript code snippets for data processing and transformations.",
      icon: Code,
      enabled: false,
      version: "0.9.0",
      category: "utility",
    },
  ]);

  const togglePlugin = (id: string) => {
    setPlugins(
      plugins.map((plugin) =>
        plugin.id === id ? { ...plugin, enabled: !plugin.enabled } : plugin
      )
    );
    
    const plugin = plugins.find((p) => p.id === id);
    toast({
      title: plugin?.enabled ? "Plugin Disabled" : "Plugin Enabled",
      description: `${plugin?.name} has been ${plugin?.enabled ? "disabled" : "enabled"}`,
    });
  };

  const getCategoryColor = (category: Plugin["category"]) => {
    switch (category) {
      case "search":
        return "bg-blue-500/10 text-blue-500";
      case "database":
        return "bg-green-500/10 text-green-500";
      case "api":
        return "bg-purple-500/10 text-purple-500";
      case "utility":
        return "bg-orange-500/10 text-orange-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Plugin Manager</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enable or disable plugins to extend agent capabilities
            </p>
          </div>
          <Badge variant="outline">
            {plugins.filter((p) => p.enabled).length} / {plugins.length} Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map((plugin) => {
            const Icon = plugin.icon;
            return (
              <Card
                key={plugin.id}
                className={`p-6 transition-all ${
                  plugin.enabled
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card/50 border-border/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${plugin.enabled ? "bg-primary/20" : "bg-secondary"}`}>
                      <Icon className={`w-5 h-5 ${plugin.enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{plugin.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          v{plugin.version}
                        </Badge>
                        <Badge className={`text-xs ${getCategoryColor(plugin.category)}`}>
                          {plugin.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={plugin.enabled}
                    onCheckedChange={() => togglePlugin(plugin.id)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{plugin.description}</p>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Plugin Development Info */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Plugin Development</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Plugins extend the agent's capabilities by providing specialized functions that can be called during task execution.
          </p>
          <p>
            Each plugin implements a standard interface with <code className="text-foreground bg-secondary px-1 py-0.5 rounded">register()</code> and{" "}
            <code className="text-foreground bg-secondary px-1 py-0.5 rounded">execute()</code> methods.
          </p>
          <p className="text-primary">
            Documentation: See <code className="bg-secondary px-1 py-0.5 rounded">/docs/plugin-api.md</code> for plugin development guide.
          </p>
        </div>
      </Card>
    </div>
  );
};
