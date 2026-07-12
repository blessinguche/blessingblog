import type { PostCategoryId } from "@/lib/categories";

export type PostStatus = "draft" | "published";
export type FontPreference = "merriweather" | "typewriter";
export type { PostCategoryId };

export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  status: PostStatus;
  published_at: string | null;
  font_preference: FontPreference;
  category: PostCategoryId | null;
  created_at: string;
  updated_at: string;
};

export type PostInput = {
  title: string;
  content: string;
  excerpt?: string | null;
  status: PostStatus;
  font_preference?: FontPreference;
  category?: PostCategoryId | null;
  slug?: string;
};

export type PostSummary = Pick<
  Post,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "status"
  | "published_at"
  | "font_preference"
  | "category"
  | "created_at"
  | "updated_at"
>;

export type GalleryImage = {
  id: string;
  name: string;
  url: string;
  created_at: string;
};

export type Subscriber = {
  id: string;
  email: string;
  created_at: string;
  confirmed: boolean;
};
