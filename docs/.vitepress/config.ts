import { defineConfig } from "vitepress";
import { apiSidebar } from "./tmp/api-sidebar";

export default defineConfig({
    title: "BatchJS",
    description: "A lightweight, stream-based batch processing library for Node.js",
    base: "/batchjs/",
    themeConfig: {
        search: {
            provider: "local",
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/palcarazm/batchjs" },
        ],
        outline: [2, 3],
        nav: [
            { text: "Guide", link: "/guide/getting-started" },
            { text: "API", link: "/api" }
        ],
        sidebar: {
            "/guide/": [
                {
                    text: "Guide",
                    items: [
                        { text: "Getting Started", link: "/guide/getting-started" },
                        { text: "Jobs", link: "/guide/jobs" },
                        { text: "Steps", link: "/guide/steps" },
                        { text: "Streams", link: "/guide/streams" },
                        { text: "Custom Streams", link: "/guide/custom-streams" },
                    ],
                },
            ],
            "/api/": [apiSidebar]
        },
    },
});