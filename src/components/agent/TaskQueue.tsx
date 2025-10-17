import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowUp, ArrowDown, Play, RotateCcw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { agentEngine } from "@/lib/agentEngine";

interface Task {
  id: string;
  description: string;
  priority: number;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string | null;
  result?: string | null;
  error?: string | null;
}

interface TaskQueueProps {
  isRunning: boolean;
}

export const TaskQueue = ({ isRunning }: TaskQueueProps) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [viewTask, setViewTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      toast({
        title: "Failed to load tasks",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setTasks(data as Task[]);
  };

  useEffect(() => {
    loadTasks();

    // Subscribe to real-time changes from the tasks table
    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => loadTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTask = async () => {
    if (!newTaskDesc.trim()) {
      toast({
        title: "Error",
        description: "Task description cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const nextPriority = (tasks[tasks.length - 1]?.priority ?? 0) + 1;

    const { error } = await supabase.from("tasks").insert({
      id: crypto.randomUUID(),
      description: newTaskDesc.trim(),
      priority: nextPriority,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) {
      toast({
        title: "Failed to add task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewTaskDesc("");
    toast({
      title: "Task Added",
      description: "New task has been added to the queue",
    });
    await loadTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Task Deleted",
      description: "Task has been removed from the queue",
    });
    await loadTasks();
  };

  const movePriority = async (id: string, direction: "up" | "down") => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === tasks.length - 1) return;

    const newTasks = [...tasks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];

    // Update priorities locally
    newTasks.forEach((task, idx) => {
      task.priority = idx + 1;
    });

    // Persist reordering
    const updates = newTasks.map((t) => ({ id: t.id, priority: t.priority }));
    for (const upd of updates) {
      await supabase.from("tasks").update({ priority: upd.priority }).eq("id", upd.id);
    }

    setTasks(newTasks);
  };

  const runNow = async (id: string) => {
    // Set task to highest priority and pending, then start the engine if not running
    const { error } = await supabase
      .from("tasks")
      .update({ status: "pending", priority: 1 })
      .eq("id", id);

    if (error) {
      toast({
        title: "Failed to schedule task",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Scheduled",
      description: "Task set to highest priority. Engine will process next.",
    });

    if (!agentEngine.isRunning() && isRunning) {
      // The UI indicates agent should be running; start engine to process immediately
      agentEngine.start();
    }
  };

  const retryTask = async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "pending", error: null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Retry failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Retry scheduled",
      description: "Task moved back to pending.",
    });
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "bg-accent text-accent-foreground";
      case "running":
        return "bg-primary text-primary-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Task */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h2 className="text-xl font-bold mb-4">Add New Task</h2>
        <div className="flex gap-2">
          <Input
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            placeholder="Describe the task for the AI agent..."
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1"
          />
          <Button onClick={addTask} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </Card>

      {/* Task Queue */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h2 className="text-xl font-bold mb-4">Task Queue ({tasks.length})</h2>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks in queue. Add a task to get started.
            </p>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => movePriority(task.id, "up")}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => movePriority(task.id, "down")}
                    disabled={index === tasks.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      Priority {task.priority}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{task.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {task.created_at ? new Date(task.created_at).toLocaleString() : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => runNow(task.id)}
                    className="gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Run
                  </Button>
                  {task.status === "failed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => retryTask(task.id)}
                      className="gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </Button>
                  )}
                  <Dialog open={viewTask?.id === task.id} onOpenChange={(open) => setViewTask(open ? task : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Task Result</DialogTitle>
                        <DialogDescription className="text-xs">
                          {task.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Status</div>
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>{task.status}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Result</div>
                          <div className="text-sm whitespace-pre-wrap">{task.result ?? "No result yet."}</div>
                        </div>
                        {task.error && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Error</div>
                            <div className="text-sm text-destructive whitespace-pre-wrap">{task.error}</div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
