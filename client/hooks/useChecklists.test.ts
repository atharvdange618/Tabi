import { describe, expect, it } from "vitest";
import type { Checklist, ChecklistItem } from "shared/types";
import { patchChecklistItem } from "./useChecklists";

type ChecklistWithItems = Checklist & { items: ChecklistItem[] };

const item = (id: string, isChecked: boolean): ChecklistItem => ({
  _id: id,
  checklistId: id[0]!,
  label: id,
  isChecked,
  position: 0,
  createdAt: "2026-10-18",
});

const list = (id: string, items: ChecklistItem[]): ChecklistWithItems => ({
  _id: id,
  tripId: "t1",
  title: id,
  position: 0,
  createdBy: "u1",
  createdAt: "2026-10-18",
  items,
});

const lists = [
  list("a", [item("a1", false), item("a2", true)]),
  list("b", [item("b1", false)]),
];

describe("patchChecklistItem", () => {
  it("applies the payload to the matching item only", () => {
    const next = patchChecklistItem(lists, "a", "a1", { isChecked: true });

    expect(next[0]!.items[0]!.isChecked).toBe(true);
    expect(next[0]!.items[1]!.isChecked).toBe(true);
    expect(next[1]).toBe(lists[1]);
  });

  it("does not mutate the cached data it was given", () => {
    patchChecklistItem(lists, "a", "a1", { isChecked: true });

    expect(lists[0]!.items[0]!.isChecked).toBe(false);
  });

  it("leaves the lists unchanged when the ids don't match", () => {
    const next = patchChecklistItem(lists, "a", "missing", {
      isChecked: true,
    });

    expect(next[0]!.items).toEqual(lists[0]!.items);
  });
});
