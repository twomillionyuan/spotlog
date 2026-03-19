import { randomUUID } from "node:crypto";

import { Router } from "express";

type Item = {
  id: string;
  title: string;
  createdAt: string;
};

const items = new Map<string, Item>();

export const itemsRouter = Router();

itemsRouter.get("/", (_req, res) => {
  const data = Array.from(items.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  res.status(200).json({ items: data });
});

itemsRouter.post("/", (req, res) => {
  const rawTitle = req.body?.title;

  if (typeof rawTitle !== "string" || rawTitle.trim().length === 0) {
    return res.status(400).json({
      error: "title is required"
    });
  }

  const item: Item = {
    id: randomUUID(),
    title: rawTitle.trim(),
    createdAt: new Date().toISOString()
  };

  items.set(item.id, item);

  return res.status(201).json(item);
});

itemsRouter.get("/:id", (req, res) => {
  const item = items.get(req.params.id);

  if (!item) {
    return res.status(404).json({
      error: "Item not found"
    });
  }

  return res.status(200).json(item);
});

itemsRouter.delete("/:id", (req, res) => {
  const exists = items.has(req.params.id);

  if (!exists) {
    return res.status(404).json({
      error: "Item not found"
    });
  }

  items.delete(req.params.id);

  return res.status(204).send();
});
