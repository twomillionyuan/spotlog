import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middleware/auth.js";
import { createTask, deleteTask, getTask, setTaskAttachment, updateTask } from "../store.js";
import { removeAttachment, uploadTaskAttachment } from "../storage.js";
import type { TaskUrgency } from "../types.js";

const validUrgencies = new Set<TaskUrgency>(["low", "medium", "high", "critical"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  }
});

function readUrgency(value: unknown, fallback: TaskUrgency = "medium") {
  return typeof value === "string" && validUrgencies.has(value as TaskUrgency)
    ? (value as TaskUrgency)
    : fallback;
}

function readParamId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.post("/", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const notes = typeof req.body?.notes === "string" ? req.body.notes : "";
  const listId = typeof req.body?.listId === "string" ? req.body.listId : "";
  const dueDate =
    typeof req.body?.dueDate === "string"
      ? req.body.dueDate
      : req.body?.dueDate === null
        ? null
        : null;

  if (title.length === 0) {
    return res.status(400).json({
      error: "title is required"
    });
  }

  if (listId.length === 0) {
    return res.status(400).json({
      error: "listId is required"
    });
  }

  try {
    const task = await createTask(req.authUser!.id, {
      title,
      notes,
      listId,
      urgency: readUrgency(req.body?.urgency),
      dueDate
    });

    return res.status(201).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "LIST_NOT_FOUND") {
      return res.status(404).json({
        error: "List not found"
      });
    }

    throw error;
  }
});

tasksRouter.get("/:id", async (req, res) => {
  const task = await getTask(req.authUser!.id, readParamId(req.params.id));

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(200).json(task);
});

tasksRouter.post("/:id/attachment", upload.single("image"), async (req, res) => {
  const task = await getTask(req.authUser!.id, readParamId(req.params.id));

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  if (!req.file || !req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({
      error: "Image file is required"
    });
  }

  try {
    const uploaded = await uploadTaskAttachment({
      userId: req.authUser!.id,
      taskId: task.id,
      buffer: req.file.buffer,
      contentType: req.file.mimetype
    });

    if (task.attachmentStorageKey) {
      await removeAttachment(task.attachmentStorageKey);
    }

    const updated = await setTaskAttachment(req.authUser!.id, task.id, {
      attachmentUrl: uploaded.attachmentUrl,
      attachmentStorageKey: uploaded.key
    });

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "STORAGE_DISABLED") {
      return res.status(503).json({
        error: "Storage is not configured"
      });
    }

    throw error;
  }
});

tasksRouter.delete("/:id/attachment", async (req, res) => {
  const task = await getTask(req.authUser!.id, readParamId(req.params.id));

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  if (!task.attachmentUrl) {
    return res.status(200).json(task);
  }

  try {
    if (task.attachmentStorageKey) {
      await removeAttachment(task.attachmentStorageKey);
    }

    const updated = await setTaskAttachment(req.authUser!.id, task.id, {
      attachmentUrl: null,
      attachmentStorageKey: null
    });

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "STORAGE_DISABLED") {
      return res.status(503).json({
        error: "Storage is not configured"
      });
    }

    throw error;
  }
});

tasksRouter.patch("/:id", async (req, res) => {
  const updates = {
    title: typeof req.body?.title === "string" ? req.body.title : undefined,
    notes: typeof req.body?.notes === "string" ? req.body.notes : undefined,
    urgency:
      typeof req.body?.urgency === "string" && validUrgencies.has(req.body.urgency as TaskUrgency)
        ? (req.body.urgency as TaskUrgency)
        : undefined,
    dueDate:
      req.body?.dueDate === null || typeof req.body?.dueDate === "string"
        ? (req.body.dueDate as string | null)
        : undefined,
    completed: typeof req.body?.completed === "boolean" ? req.body.completed : undefined,
    listId: typeof req.body?.listId === "string" ? req.body.listId : undefined
  };

  if (updates.title !== undefined && updates.title.trim().length === 0) {
    return res.status(400).json({
      error: "title cannot be empty"
    });
  }

  try {
    const task = await updateTask(req.authUser!.id, readParamId(req.params.id), updates);

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "LIST_NOT_FOUND") {
      return res.status(404).json({
        error: "List not found"
      });
    }

    throw error;
  }
});

tasksRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteTask(req.authUser!.id, readParamId(req.params.id));

  if (!deleted) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(204).send();
});
