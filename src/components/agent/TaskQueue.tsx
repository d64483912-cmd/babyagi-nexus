import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  description: string;
  priority: number;
  status: "pending" | "running" | "completed" | "failed";
  created: Date;
}

interface TaskQueueProps {
  isRunning: boolean;
}

export const TaskQueue = ({ isRunning }: TaskQueueProps) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      description: "Analyze market trends for Q1 2025",
      priority: 1,
      status: "pending",
      created: new Date(),
    },
    {
      id: "2",
      description: "Generate comprehensive report on AI developments",
      priority: 2,
      status: "pending",
      created: new Date(),
    },
  ]);
  const [newTaskDesc, setNewTaskDesc] = useState("");

  const addTask = () => {
    if (!newTaskDesc.trim()) {
      toast({
        title: "Error",
        description: "Task description cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      description: newTaskDesc,
      priority: tasks.length + 1,
      status: "pending",
      created: new Date(),
    };

    setTasks([...tasks, newTask]);
    setNewTaskDesc("");
    toast({
      title: "Task Added",
      description: "New task has been added to the queue",
    });
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    toast({
      title: "Task Deleted",
      description: "Task has been removed from the queue",
    });
  };

  const movePriority = (id: string, direction: "up" | "down") => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === tasks.length - 1) return;

    const newTasks = [...tasks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];

    // Update priorities
    newTasks.forEach((task, idx) => {
      task.priority = idx + 1;
    });

    setTasks(newTasks);
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
                    Created: {task.created.toLocaleString()}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTask(task.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
