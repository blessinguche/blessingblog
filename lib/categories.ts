export const POST_CATEGORIES = [
  { id: "thoughts", label: "thoughts", hash: "#thoughts", emoji: "💭" },
  { id: "books", label: "books", hash: "#books", emoji: "📚" },
  { id: "notes", label: "notes", hash: "#notes", emoji: "📝" },
  { id: "yaps", label: "yaps", hash: "#yaps", emoji: "💬" },
] as const;

export type PostCategoryId = (typeof POST_CATEGORIES)[number]["id"];

export function isPostCategory(value: string): value is PostCategoryId {
  return POST_CATEGORIES.some((c) => c.id === value);
}

export function getCategory(id: PostCategoryId | null | undefined) {
  return POST_CATEGORIES.find((c) => c.id === id) ?? null;
}
