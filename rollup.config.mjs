import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
function packageConfig(exportPath) {
    return[
        {
            input: `dist/tmp/js${exportPath === "/" ? "" : exportPath}/index.js`,
            output: [
                {
                    file: `dist/cjs${exportPath === "/" ? "" : exportPath}/index.cjs`,
                    format: "cjs",
                    sourcemap: true,
                    plugins: [terser()],
                },
                {
                    file: `dist/esm${exportPath === "/" ? "" : exportPath}/index.mjs`,
                    format: "es",
                    sourcemap: true,
                    plugins: [terser()],
                },
            ],
            external: ["node:stream", "node:events"],
        },
        {
            input: `dist/tmp/@types${exportPath === "/" ? "" : exportPath}/index.d.ts`,
            output: {
                file: `dist/@types${exportPath === "/" ? "" : exportPath}/index.d.ts`,
                format: "es",
            },
            plugins: [
                dts({
                    respectExternal: true,
                }),
            ],
            external: ["node:stream", "node:events"],
        },
    ];
}



export default [...packageConfig("/"),...packageConfig("/common"), ...packageConfig("/streams")];