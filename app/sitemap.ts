import { MetadataRoute } from "next";

const staticPages = [
    "audit",
    "blog",
    "buy",
    "claim",
    "defi",
    "legal",
    "legal/terms-of-use",
    "legal/privacy-policy",
    "play",
    "security",
    "stake",
    "support",
    "team",
    "whitepaper",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return staticPages.map((page) => ({
        url: `https://ramicoin.com/${page}`,
        lastModified: new Date().toISOString(),
    }));

}

