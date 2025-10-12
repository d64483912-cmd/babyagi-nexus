import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Network, Settings, Play, Pause } from "lucide-react";
import { AgentDashboard } from "@/components/agent/AgentDashboard";
import { TaskQueue } from "@/components/agent/TaskQueue";
import { PluginManager } from "@/components/agent/PluginManager";
import { SettingsPanel } from "@/components/agent/SettingsPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "plugins" | "settings">("dashboard");
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-primary/30 -z-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  BabyAGI Nexus
                </h1>
                <p className="text-xs text-muted-foreground">Autonomous AI Agent Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={isAgentRunning ? "default" : "secondary"} className="gap-2">
                {isAgentRunning ? (
                  <>
                    <Zap className="w-3 h-3 animate-pulse" />
                    Running
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" />
                    Idle
                  </>
                )}
              </Badge>
              
              <Button
                size="sm"
                variant={isAgentRunning ? "destructive" : "default"}
                onClick={() => setIsAgentRunning(!isAgentRunning)}
                className="gap-2"
              >
                {isAgentRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAgentRunning ? "Stop Agent" : "Start Agent"}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 mt-4">
            {[
              { id: "dashboard" as const, label: "Dashboard", icon: Brain },
              { id: "tasks" as const, label: "Tasks", icon: Zap },
              { id: "plugins" as const, label: "Plugins", icon: Network },
              { id: "settings" as const, label: "Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "dashboard" && <AgentDashboard isRunning={isAgentRunning} />}
        {activeTab === "tasks" && <TaskQueue isRunning={isAgentRunning} />}
        {activeTab === "plugins" && <PluginManager />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
};

export default Index;
