import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, CheckCircle2, Clock, Zap } from "lucide-react";

interface AgentDashboardProps {
  isRunning: boolean;
}

export const AgentDashboard = ({ isRunning }: AgentDashboardProps) => {
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksInProgress: 0,
    tasksPending: 0,
    successRate: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    action: string;
    timestamp: Date;
    status: "success" | "running" | "pending";
  }>>([]);

  useEffect(() => {
    // Simulated stats update
    if (isRunning) {
      const interval = setInterval(() => {
        setStats(prev => ({
          tasksCompleted: prev.tasksCompleted + Math.floor(Math.random() * 2),
          tasksInProgress: Math.floor(Math.random() * 5),
          tasksPending: Math.floor(Math.random() * 10),
          successRate: 85 + Math.floor(Math.random() * 15),
        }));

        setRecentActivities(prev => [
          {
            id: Date.now().toString(),
            action: `Task executed: ${['Web Search', 'Data Processing', 'API Call', 'Analysis'][Math.floor(Math.random() * 4)]}`,
            timestamp: new Date(),
            status: ['success', 'running', 'pending'][Math.floor(Math.random() * 3)] as any,
          },
          ...prev.slice(0, 9),
        ]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-accent">{stats.tasksCompleted}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-primary">{stats.tasksInProgress}</p>
            </div>
            <Activity className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-foreground">{stats.tasksPending}</p>
            </div>
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-foreground">{stats.successRate}%</p>
            </div>
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <Progress value={stats.successRate} className="mt-2" />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activity yet. Start the agent to see real-time updates.
            </p>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-all"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      activity.status === "success"
                        ? "default"
                        : activity.status === "running"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {activity.status}
                  </Badge>
                  <span className="text-sm text-foreground">{activity.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
