import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const posts = await listPublishedPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/who-am-i`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/my-images`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/subscribe`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/posts/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}
