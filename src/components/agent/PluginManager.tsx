import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Database, Globe, Code, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Category = "search" | "database" | "api" | "utility";

interface Plugin {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean | null;
  version: string;
  category: Category;
}

const categoryIcon: Record<Category, any> = {
  search: Search,
  database: Database,
  api: Globe,
  utility: Code,
};

export const PluginManager = () => {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlugins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plugins")
      .select("*")
      .order("name", { ascending: true });

    setLoading(false);
    if (error) {
      toast({
        title: "Failed to load plugins",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Ensure category is one of expected values; default to utility
    const normalized = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      enabled: p.enabled,
      version: p.version,
      category: (["search", "database", "api", "utility"].includes(p.category) ? p.category : "utility") as Category,
    }));
    setPlugins(normalized);
  };

  useEffect(() => {
    loadPlugins();
    // Optional: subscribe to realtime plugin changes
    const channel = supabase
      .channel("public:plugins")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plugins" },
        () => loadPlugins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const togglePlugin = async (id: string) => {
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;

    const newEnabled = !(plugin.enabled ?? false);
    const { error } = await supabase
      .from("plugins")
      .update({ enabled: newEnabled })
      .eq("id", id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: newEnabled ? "Plugin Enabled" : "Plugin Disabled",
      description: `${plugin.name} has been ${newEnabled ? "enabled" : "disabled"}`,
    });
    await loadPlugins();
  };

  const getCategoryColor = (category: Category) => {
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

  const activeCount = useMemo(() => plugins.filter((p) => p.enabled).length, [plugins]);

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
            {activeCount} / {plugins.length} Active
          </Badge>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground mb-3">Loading plugins…</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map((plugin) => {
            const Icon = categoryIcon[plugin.category];
            const enabled = plugin.enabled ?? false;
            return (
              <Card
                key={plugin.id}
                className={`p-6 transition-all ${
                  enabled
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card/50 border-border/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${enabled ? "bg-primary/20" : "bg-secondary"}`}>
                      <Icon className={`w-5 h-5 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
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
                    checked={enabled}
                    onCheckedChange={() => togglePlugin(plugin.id)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{plugin.description ?? "No description provided."}</p>
              </Card>
            );
          })}
          {plugins.length === 0 && !loading && (
            <Card className="p-6 bg-card/50 border-border/50">
              <p className="text-sm text-muted-foreground">
                No plugins found in database. Add entries to the "plugins" table to populate this list.
              </p>
            </Card>
          )}
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
            Plugins extend the agent&apos;s capabilities by providing specialized functions that can be called during task execution.
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
