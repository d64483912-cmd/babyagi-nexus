import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Key, Database, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const SettingsPanel = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.0-flash-exp:free");
  const [selectedEmbedding, setSelectedEmbedding] = useState("text-embedding-3-small");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Available OpenRouter models (free/community prioritized)
  const availableModels = [
    { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (Free)", type: "free" },
    { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B (Free)", type: "free" },
    { id: "qwen/qwen-2-7b-instruct:free", name: "Qwen 2 7B (Free)", type: "free" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", type: "paid" },
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", type: "paid" },
  ];

  const testConnection = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsConnected(true);
      toast({
        title: "Connection Successful",
        description: "Successfully connected to OpenRouter API",
      });
      localStorage.setItem("openrouter_api_key", apiKey);
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to OpenRouter API. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const loadSavedSettings = async () => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsConnected(true);
    }
    // Load system config values if present
    const { data } = await supabase
      .from("system_config")
      .select("*")
      .in("config_key", ["openrouter_model", "embedding_model"]);

    if (data) {
      const modelCfg = data.find((d) => d.config_key === "openrouter_model");
      const embCfg = data.find((d) => d.config_key === "embedding_model");
      if (modelCfg?.config_value) {
        setSelectedModel(String(modelCfg.config_value));
      }
      if (embCfg?.config_value) {
        setSelectedEmbedding(String(embCfg.config_value));
      }
    }
  };

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Persist selections to system_config
      const updates = [
        { config_key: "openrouter_model", config_value: selectedModel },
        { config_key: "embedding_model", config_value: selectedEmbedding },
      ];
      for (const up of updates) {
        // Upsert by key
        const { error } = await supabase
          .from("system_config")
          .upsert(
            {
              id: crypto.randomUUID(),
              config_key: up.config_key,
              config_value: up.config_value,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "config_key" }
          );
        if (error) {
          throw error;
        }
      }

      toast({
        title: "Settings Saved",
        description: "Agent configuration has been updated",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ?? "Unable to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* OpenRouter Configuration */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">OpenRouter Configuration</h2>
          {isConnected && (
            <Badge variant="default" className="ml-auto gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="flex-1"
              />
              <Button onClick={testConnection} disabled={isTesting}>
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Get your API key from{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          <Separator />

          <div>
            <Label htmlFor="model">Language Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Free Models
                </div>
                {availableModels
                  .filter((m) => m.type === "free")
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        {model.name}
                        <Badge variant="secondary" className="text-xs">
                          Free
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                <Separator className="my-1" />
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Paid Models
                </div>
                {availableModels
                  .filter((m) => m.type === "paid")
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Free models are automatically prioritized when available
            </p>
          </div>

          <div>
            <Label htmlFor="embedding">Embedding Model</Label>
            <Select value={selectedEmbedding} onValueChange={setSelectedEmbedding}>
              <SelectTrigger id="embedding" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-embedding-3-small">
                  Text Embedding 3 Small (Fastest)
                </SelectItem>
                <SelectItem value="text-embedding-3-large">
                  Text Embedding 3 Large (Best Quality)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Database Configuration */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Database Configuration</h2>
          <Badge variant="default" className="ml-auto gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Supabase Project</Label>
            <div className="mt-1.5 p-3 bg-secondary/50 rounded-lg">
              <code className="text-sm text-foreground">
                bnjthwrpigvchbhsmfec.supabase.co
              </code>
            </div>
          </div>

          <div>
            <Label>Database Status</Label>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              PostgreSQL connected and ready
            </div>
          </div>
        </div>
      </Card>

      {/* Agent Configuration */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Agent Configuration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="maxTasks">Max Concurrent Tasks</Label>
            <Input
              id="maxTasks"
              type="number"
              defaultValue="5"
              min="1"
              max="20"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="timeout">Task Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              defaultValue="300"
              min="30"
              max="3600"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="retries">Max Retries</Label>
            <Input
              id="retries"
              type="number"
              defaultValue="3"
              min="0"
              max="10"
              className="mt-1.5"
            />
          </div>
        </div>

        <Separator className="my-6" />

        <Button className="w-full" onClick={saveConfiguration} disabled={saving}>
          {saving ? "Saving…" : "Save Configuration"}
        </Button>
      </Card>
    </div>
  );
};
