import { defineConfig } from "vitepress";
import { apiSidebar } from "./tmp/api-sidebar";

export default defineConfig({
    title: "BatchJS",
    description: "A lightweight, stream-based batch processing library for Node.js",
    base: "/batchjs/",

    head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/batchjs/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/batchjs/favicon.png' }],
    ['meta', { name: 'author', content: 'https://github.com/palcarazm' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { name: 'revisit-after', content: '1 month' }],
    ['meta', { property: 'og:description', content: 'A dependencies free batch processing framework for NodeJS based on streams to build robust, composable pipelines with Jobs, Steps, and Streams.' }],
    ['meta', { property: 'og:url', content: 'https://palcarazm.github.io/batchjs' }],
    ['meta', { property: 'og:image', content: 'https://palcarazm.github.io/batchjs/card.png' }],
    ['meta', { property: 'og:image:width', content: '728' }],
    ['meta', { property: 'og:image:height', content: '364' }],
  ],

    themeConfig: {
        logo: "/logo.png",
        siteTitle: "",
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