import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/chat/",
        "/forgot-password",
        "/home",
        "/matches",
        "/notifications",
        "/onboarding",
        "/profile/",
        "/reset-password",
        "/settings",
      ],
    },
  };
}
