"use client";

import { useState, useEffect } from "react";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { v4 as uuid } from "uuid";

type Category = {
  id: string; // database id
  clientId: string;
  name: string;
  color?: string | null;
};

export function CategoryPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (categoryId: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setCategories(data.items));
  }, []);

  const handleCreate = async () => {
    if (!newCat.trim()) return;
    const tempId = uuid();
    const payload = {
      clientId: tempId,
      name: newCat.trim(),
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      clientUpdatedAt: new Date().toISOString(),
    };

    // Optimistic update
    const optimistic: Category = {
      id: tempId, // temporary, will be real ID on refresh/sync but good enough for selection
      clientId: tempId,
      name: payload.name,
      color: payload.color,
    };
    setCategories((prev) => [...prev, optimistic]);
    onChange(optimistic.id);
    setNewCat("");
    setIsOpen(false);

    // Persist
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // In a real app we'd reload to get the real ID, but for now relying on ClientID/Optimistic is usually fine or we refetch
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setCategories(data.items));
  };

  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-foreground">
        Category
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-left text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className="flex items-center gap-2">
          {selected ? (
            <>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: selected.color || "#ccc" }}
              />
              {selected.name}
            </>
          ) : (
            <span className="text-muted-foreground">Select a category...</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-muted"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color || "#ccc" }}
              />
              <span className="flex-1 text-left">{c.name}</span>
              {value === c.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
          <div className="border-t border-border px-2 py-2">
            <div className="flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New category..."
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newCat.trim()}
                className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
