import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { useEffect, useState } from "react";

/**
 * Lightweight Agent Engine
 * - Polls Supabase for tasks
 * - Executes one task at a time (highest priority first)
 * - Writes actions and logs back to Supabase
 * - Exposes reactive state via a hook
 */

type ActivityStatus = "success" | "running" | "pending";

interface RecentActivity {
  id: string;
  action: string;
  timestamp: Date;
  status: ActivityStatus;
}

interface Stats {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  successRate: number;
}

class AgentEngine {
  private running = false;
  private loopTimer: number | null = null;

  private listeners: Array<(payload: { running: boolean; stats: Stats; recentActivities: RecentActivity[] }) => void> = [];

  private recentActivities: RecentActivity[] = [];
  private stats: Stats = {
    tasksCompleted: 0,
    tasksInProgress: 0,
    tasksPending: 0,
    successRate: 0,
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.emit();

    // Start polling loop
    this.loopTimer = window.setInterval(async () => {
      await this.updateStats();
      await this.processNextTask();
      this.emit();
    }, 3000);
  }

  stop() {
    this.running = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.emit();
  }

  isRunning() {
    return this.running;
  }

  subscribe(listener: (payload: { running: boolean; stats: Stats; recentActivities: RecentActivity[] }) => void) {
    this.listeners.push(listener);
    // Immediately send current state
    listener({ running: this.running, stats: this.stats, recentActivities: this.recentActivities });
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private emit() {
    const payload = { running: this.running, stats: this.stats, recentActivities: this.recentActivities };
    this.listeners.forEach((l) => l(payload));
  }

  private async updateStats() {
    const { data, error } = await supabase
      .from("tasks")
      .select("status");

    if (error) {
      // Keep previous stats on error
      return;
    }

    const tasksCompleted = data.filter((t) => t.status === "completed").length;
    const tasksInProgress = data.filter((t) => t.status === "running").length;
    const tasksPending = data.filter((t) => t.status === "pending").length;
    const totalDone = tasksCompleted + data.filter((t) => t.status === "failed").length;
    const successRate = totalDone > 0 ? Math.round((tasksCompleted / totalDone) * 100) : 0;

    this.stats = {
      tasksCompleted,
      tasksInProgress,
      tasksPending,
      successRate,
    };
  }

  private async processNextTask() {
    if (!this.running) return;

    // Find highest priority pending task
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: true })
      .limit(1);

    if (error || !tasks || tasks.length === 0) {
      return;
    }

    const task = tasks[0];

    // Mark as running
    await supabase
      .from("tasks")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", task.id);

    this.pushActivity(`Started task: ${task.description}`, "running");

    // Simulate execution with plugins (no real plugin system yet)
    const start = performance.now();
    let result = "";
    let status: "completed" | "failed" = "completed";
    try {
      // Simple mock execution based on keywords
      result = await this.executeTask(task.description);
    } catch (e) {
      status = "failed";
      result = (e as Error).message;
    }
    const execMs = Math.round(performance.now() - start);

    // Write action log
    const actionInsert: TablesInsert<"agent_actions"> = {
      id: crypto.randomUUID(),
      action_type: "task_execute",
      action_data: { description: task.description },
      execution_time_ms: execMs,
      status,
      metadata: { model: "mock", engine: "AgentEngine" },
      user_session_id: null,
      query_id: null,
      created_at: new Date().toISOString(),
    };
    await supabase.from("agent_actions").insert(actionInsert);

    // Update task
    await supabase
      .from("tasks")
      .update({
        status,
        result,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    // Log activity
    this.pushActivity(
      status === "completed" ? `Completed task: ${task.description}` : `Failed task: ${task.description}`,
      status === "completed" ? "success" : "pending"
    );

    // Write agent log
    await supabase.from("agent_logs").insert({
      id: crypto.randomUUID(),
      level: status === "completed" ? "info" : "error",
      message: status === "completed" ? "Task completed" : "Task failed",
      metadata: { task_id: task.id, execution_time_ms: execMs, result_preview: result?.slice(0, 140) },
      created_at: new Date().toISOString(),
      agent_id: null,
      task_id: task.id,
    });

    // Refresh stats
    await this.updateStats();
  }

  private pushActivity(action: string, status: ActivityStatus) {
    const activity: RecentActivity = {
      id: Date.now().toString(),
      action,
      timestamp: new Date(),
      status,
    };
    this.recentActivities = [activity, ...this.recentActivities].slice(0, 10);
  }

  private async executeTask(description: string): Promise<string> {
    // Mock "plugin" routing based on description keywords
    const lower = description.toLowerCase();

    if (lower.includes("search")) {
      // pretend a web search
      await sleep(1200);
      return `Searched the web for "${description}". Found 3 relevant sources.`;
    }
    if (lower.includes("report") || lower.includes("analyze") || lower.includes("analysis")) {
      await sleep(2000);
      return `Generated a structured analysis for "${description}". Summary: Key trends identified with confidence score 0.82.`;
    }
    if (lower.includes("api") || lower.includes("http")) {
      await sleep(1500);
      return `Performed an HTTP request related to "${description}". Status: 200 OK.`;
    }

    // Default quick task
    await sleep(800);
    return `Processed task "${description}".`;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const agentEngine = new AgentEngine();

/**
 * React hook to consume the AgentEngine state in components
 */
export function useAgentEngine() {
  const [running, setRunning] = useState(agentEngine.isRunning());
  const [stats, setStats] = useState<Stats>({
    tasksCompleted: 0,
    tasksInProgress: 0,
    tasksPending: 0,
    successRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const unsub = agentEngine.subscribe(({ running, stats, recentActivities }) => {
      setRunning(running);
      setStats(stats);
      setRecentActivities(recentActivities);
    });
    return () => unsub();
  }, []);

  return {
    running,
    stats,
    recentActivities,
    start: () => agentEngine.start(),
    stop: () => agentEngine.stop(),
  };
}