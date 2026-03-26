export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type TaskUrgency = "low" | "medium" | "high" | "critical";

export type Task = {
  id: string;
  listId: string;
  title: string;
  notes: string;
  urgency: TaskUrgency;
  dueDate: string | null;
  attachmentUrl: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskListSummary = {
  total: number;
  open: number;
  completed: number;
  overdue: number;
};

export type TaskList = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  summary: TaskListSummary;
  tasks: Task[];
};

export type DashboardSummary = {
  listCount: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  completionRate: number;
};

export type Dashboard = {
  summary: DashboardSummary;
  urgentTasks: Task[];
  recentCompletions: Task[];
};

export type ActivityEvent = {
  id: string;
  userId: string;
  entityType: "list" | "task";
  entityId: string;
  title: string;
  type: "created" | "updated" | "completed" | "deleted" | "attached";
  createdAt: string;
};
