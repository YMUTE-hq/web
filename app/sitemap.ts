import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.ymute.com";

  const routes = [
    "",
    "/explore-talent",
    "/jobs",
    "/community",
    "/games",
    "/careers",
    "/login",
    "/signup",
    "/signup/caster",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/jobs" || route === "/explore-talent" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/jobs" || route === "/explore-talent" ? 0.9 : 0.7,
  }));
}
