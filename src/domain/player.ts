import type { Player } from "./types";

export const CATEGORIES = ["U-14", "U-16", "U-18", "Adult"] as const;
export type PlayerCategory = (typeof CATEGORIES)[number];

export const POSITIONS = ["Outside Hitter", "Opposite", "Middle Blocker", "Setter", "Libero"] as const;
export type PlayerPosition = (typeof POSITIONS)[number];

export type PlayerDraft = Omit<Player, "id" | "aliases">;

const YOUTH_CATEGORIES: readonly PlayerCategory[] = ["U-14", "U-16", "U-18"];

export function isYouth(player: Pick<Player, "category">): boolean {
  if (!player.category) return false;
  return YOUTH_CATEGORIES.includes(player.category);
}

export function assertValid(draft: PlayerDraft): void {
  if (draft.name.trim() === "") {
    throw new Error("Name is required.");
  }
  if (draft.number.trim() === "") {
    throw new Error("Number is required.");
  }
  if (isYouth(draft)) {
    if ((draft.guardianName ?? "").trim() === "") {
      throw new Error("For a U-18 player the guardian name is required.");
    }
    if ((draft.guardianPhone ?? "").trim() === "") {
      throw new Error("For a U-18 player the guardian phone is required.");
    }
  }
}
