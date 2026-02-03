import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: "/onlyownercanaccessthispage",
            },
        ],
        sitemap: "https://ramicoin.com/sitemap.xml",
    };

}

