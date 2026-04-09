import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { recordActivity } from "./activity.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import type {
  AuthUser,
  DashboardResponse,
  DashboardSummary,
  TaskCounts,
  TaskListResponse,
  TaskListRow,
  TaskResponse,
  TaskRow,
  TaskUrgency
} from "./types.js";

const urgencyRanks: Record<TaskUrgency, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const seedLists = [
  {
    name: "Work",
    color: "#DCC8F5",
    tasks: [
      {
        title: "Review launch checklist",
        notes: "Check release notes, comms, and rollback plan before noon.",
        urgency: "critical" as const,
        dueInDays: 0,
        completed: false
      },
      {
        title: "Reply to design feedback",
        notes: "Close the loop on the onboarding copy changes.",
        urgency: "high" as const,
        dueInDays: 1,
        completed: false
      },
      {
        title: "Archive old sprint board",
        notes: "Move finished tickets and update the retrospective notes.",
        urgency: "medium" as const,
        dueInDays: -1,
        completed: true
      }
    ]
  },
  {
    name: "Home",
    color: "#F0CFE3",
    tasks: [
      {
        title: "Book dentist appointment",
        notes: "Find a morning slot next week.",
        urgency: "high" as const,
        dueInDays: 2,
        completed: false
      },
      {
        title: "Refill pantry staples",
        notes: "Rice, olive oil, oats, and coffee beans.",
        urgency: "medium" as const,
        dueInDays: 3,
        completed: false
      }
    ]
  },
  {
    name: "Someday",
    color: "#CFE0FF",
    tasks: [
      {
        title: "Plan summer trip budget",
        notes: "Rough flight, hotel, and food estimate.",
        urgency: "low" as const,
        dueInDays: 10,
        completed: false
      }
    ]
  }
] as const;

type UserRecord = AuthUser & {
  passwordHash: string;
};

function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

function toTaskResponse(task: TaskRow): TaskResponse {
  return {
    id: task.id,
    listId: task.listId,
    title: task.title,
    notes: task.notes,
    urgency: task.urgency,
    dueDate: task.dueDate,
    beforePhotoUrl: task.beforePhotoUrl,
    beforePhotoStorageKey: task.beforePhotoStorageKey,
    afterPhotoUrl: task.afterPhotoUrl,
    afterPhotoStorageKey: task.afterPhotoStorageKey,
    completed: Boolean(task.completedAt),
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function compareTasks(left: TaskResponse, right: TaskResponse) {
  if (left.completed !== right.completed) {
    return left.completed ? 1 : -1;
  }

  const urgencyDelta = urgencyRanks[right.urgency] - urgencyRanks[left.urgency];

  if (urgencyDelta !== 0) {
    return urgencyDelta;
  }

  if (left.dueDate && right.dueDate) {
    return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
  }

  if (left.dueDate) {
    return -1;
  }

  if (right.dueDate) {
    return 1;
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

function computeTaskCounts(tasks: TaskResponse[]): TaskCounts {
  const now = Date.now();
  let completed = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
      continue;
    }

    if (task.dueDate && new Date(task.dueDate).getTime() < now) {
      overdue += 1;
    }
  }

  return {
    total: tasks.length,
    open: tasks.length - completed,
    completed,
    overdue
  };
}

function toTaskListResponse(list: TaskListRow, tasks: TaskResponse[]): TaskListResponse {
  const sortedTasks = [...tasks].sort(compareTasks);

  return {
    id: list.id,
    name: list.name,
    color: list.color,
    attachmentUrl: list.attachment_url,
    attachmentStorageKey: list.attachment_storage_key,
    sortOrder: list.sort_order,
    createdAt: list.created_at,
    updatedAt: list.updated_at,
    summary: computeTaskCounts(sortedTasks),
    tasks: sortedTasks
  };
}

async function getUserByEmail(email: string) {
  const result = await pool.query<{
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
  }>(
    `
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at
  } satisfies UserRecord;
}

async function listRowsForUser(userId: string) {
  const [listsResult, tasksResult] = await Promise.all([
    pool.query<TaskListRow>
