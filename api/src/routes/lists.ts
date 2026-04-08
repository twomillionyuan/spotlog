import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middleware/auth.js";
import {
  archiveTaskList,
  createTaskList,
  getTaskList,
  listTaskLists,
  reorderTaskLists,
  setTaskListAttachment,
  updateTaskList
} from "../store.js";
import { removeAttachment, uploadListAttachment } from "../storage.js";

export const listsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  }
});

function readParamId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

listsRouter.use(requireAuth);

listsRouter.get("/", async (req, res) => {
  const lists = await listTaskLists(req.authUser!.id);

  res.status(200).json({
    lists
  });
});

listsRouter.post("/reorder", async (req, res) => {
  const orderedListIds = Array.isArray(req.body?.listIds)
    ? req.body.listIds.filter((value: unknown): value is string => typeof value === "string")
    : [];

  if (orderedListIds.length === 0) {
    return res.status(400).json({
      error: "listIds is required"
    });
  }

  try {
    const lists = await reorderTaskLists(req.authUser!.id, orderedListIds);

    return res.status(200).json({
      lists
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_LIST_ORDER") {
      return res.status(400).json({
        error: "Invalid list order"
      });
    }

    throw error;
  }
});

listsRouter.post("/", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const color = typeof req.body?.color === "string" ? req.body.color.trim() : "#D5E6C5";

  if (name.length === 0) {
    return res.status(400).json({
      error: "name is required"
    });
  }

  const list = await createTaskList(req.authUser!.id, {
    name,
    color
  });

  return res.status(201).json(list);
});

listsRouter.get("/:id", async (req, res) => {
  const list = await getTaskList(req.authUser!.id, readParamId(req.params.id));

  if (!list) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  return res.status(200).json(list);
});

listsRouter.patch("/:id", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name : undefined;
  const color = typeof req.body?.color === "string" ? req.body.color : undefined;

  if (name !== undefined && name.trim().length === 0) {
    return res.status(400).json({
      error: "name cannot be empty"
    });
  }

  const listId = readParamId(req.params.id);

  const list = await updateTaskList(req.authUser!.id, listId, {
    name,
    color
  });

  if (!list) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  return res.status(200).json(list);
});

listsRouter.post("/:id/attachment", upload.single("image"), async (req, res) => {
  const list = await getTaskList(req.authUser!.id, readParamId(req.params.id));

  if (!list) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  if (!req.file || !req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({
      error: "Image file is required"
    });
  }

  try {
    const uploaded = await uploadListAttachment({
      userId: req.authUser!.id,
      listId: list.id,
      buffer: req.file.buffer,
      contentType: req.file.mimetype
    });

    const existingStorageKey = (list as { attachmentStorageKey?: string | null }).attachmentStorageKey;

    if (existingStorageKey) {
      await removeAttachment(existingStorageKey);
    }

    const updated = await setTaskListAttachment(req.authUser!.id, list.id, {
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

listsRouter.delete("/:id/attachment", async (req, res) => {
  const list = await getTaskList(req.authUser!.id, readParamId(req.params.id));

  if (!list) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  if (!list.attachmentUrl) {
    return res.status(200).json(list);
  }

  try {
    const existingStorageKey = (list as { attachmentStorageKey?: string | null }).attachmentStorageKey;

    if (existingStorageKey) {
      await removeAttachment(existingStorageKey);
    }

    const updated = await setTaskListAttachment(req.authUser!.id, list.id, {
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

listsRouter.delete("/:id", async (req, res) => {
  const deleted = await archiveTaskList(req.authUser!.id, readParamId(req.params.id));

  if (!deleted) {
    return res.status(404).json({
      error: "List not found"
    });
  }

  return res.status(204).send();
});
