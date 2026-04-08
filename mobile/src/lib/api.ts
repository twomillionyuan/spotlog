import { apiUrl } from "./config";
import type { ActivityEvent, AuthResponse, Dashboard, Task, TaskList, TaskUrgency } from "../types/api";

type ApiOptions = {
  token?: string | null;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
};

async function request<T>(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`
          }
        : {}),
      ...(options.isFormData
        ? {}
        : {
            "Content-Type": "application/json"
          })
    },
    body:
      options.body === undefined
        ? undefined
        : options.isFormData
          ? (options.body as BodyInit)
          : JSON.stringify(options.body)
  });

  if (response.status === 204) {
    return null as T;
  }

  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload as T;
}

export function register(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: { email, password }
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export function getDashboard(token: string) {
  return request<Dashboard>("/api/dashboard", {
    token
  });
}

export async function getActivity(token: string) {
  const response = await request<{ activity: ActivityEvent[] }>("/api/activity", {
    token
  });

  return response.activity;
}

export async function getLists(token: string) {
  const response = await request<{ lists: TaskList[] }>("/api/lists", {
    token
  });

  return response.lists;
}

export function getList(token: string, listId: string) {
  return request<TaskList>(`/api/lists/${listId}`, {
    token
  });
}

export function createList(
  token: string,
  payload: {
    name: string;
    color: string;
  }
) {
  return request<TaskList>("/api/lists", {
    token,
    method: "POST",
    body: payload
  });
}

export async function reorderLists(token: string, listIds: string[]) {
  const response = await request<{ lists: TaskList[] }>("/api/lists/reorder", {
    token,
    method: "POST",
    body: {
      listIds
    }
  });

  return response.lists;
}

export function updateList(
  token: string,
  listId: string,
  payload: Partial<Pick<TaskList, "name" | "color">>
) {
  return request<TaskList>(`/api/lists/${listId}`, {
    token,
    method: "PATCH",
    body: payload
  });
}

export function deleteList(token: string, listId: string) {
  return request<null>(`/api/lists/${listId}`, {
    token,
    method: "DELETE"
  });
}

export function uploadListAttachment(token: string, listId: string, file: {
  uri: string;
  mimeType: string;
  fileName: string;
}) {
  const formData = new FormData();
  formData.append("image", {
    uri: file.uri,
    type: file.mimeType,
    name: file.fileName
  } as unknown as Blob);

  return request<TaskList>(`/api/lists/${listId}/attachment`, {
    token,
    method: "POST",
    body: formData,
    isFormData: true
  });
}

export function deleteListAttachment(token: string, listId: string) {
  return request<TaskList>(`/api/lists/${listId}/attachment`, {
    token,
    method: "DELETE"
  });
}

export function getTask(token: string, taskId: string) {
  return request<Task>(`/api/tasks/${taskId}`, {
    token
  });
}

export function createTask(
  token: string,
  payload: {
    listId: string;
    title: string;
    notes: string;
    urgency: TaskUrgency;
    dueDate: string | null;
  }
) {
  return request<Task>("/api/tasks", {
    token,
    method: "POST",
    body: payload
  });
}

export function updateTask(
  token: string,
  taskId: string,
  payload: Partial<{
    title: string;
    notes: string;
    urgency: TaskUrgency;
    dueDate: string | null;
    completed: boolean;
    listId: string;
  }>
) {
  return request<Task>(`/api/tasks/${taskId}`, {
    token,
    method: "PATCH",
    body: payload
  });
}

export function deleteTask(token: string, taskId: string) {
  return request<null>(`/api/tasks/${taskId}`, {
    token,
    method: "DELETE"
  });
}

export function uploadTaskPhoto(token: string, taskId: string, kind: "before" | "after", file: {
  uri: string;
  mimeType: string;
  fileName: string;
}) {
  const formData = new FormData();
  formData.append("image", {
    uri: file.uri,
    type: file.mimeType,
    name: file.fileName
  } as unknown as Blob);

  return request<Task>(`/api/tasks/${taskId}/${kind}-photo`, {
    token,
    method: "POST",
    body: formData,
    isFormData: true
  });
}

export function deleteTaskPhoto(token: string, taskId: string, kind: "before" | "after") {
  return request<Task>(`/api/tasks/${taskId}/${kind}-photo`, {
    token,
    method: "DELETE"
  });
}
