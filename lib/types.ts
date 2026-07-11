export type PostStatus = "draft" | "published";
export type FontPreference = "merriweather" | "typewriter";

export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  status: PostStatus;
  published_at: string | null;
  font_preference: FontPreference;
  created_at: string;
  updated_at: string;
};

export type PostInput = {
  title: string;
  content: string;
  excerpt?: string | null;
  status: PostStatus;
  font_preference?: FontPreference;
  slug?: string;
};

export type Subscriber = {
  id: string;
  email: string;
  created_at: string;
  confirmed: boolean;
};
