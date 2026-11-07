/** @type {import('jest').Config} */

module.exports = {
    roots: ["<rootDir>/src/main", "<rootDir>/src/test"],
    testMatch: [
        "**/*.test.ts",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            tsconfig: "tsconfig.test.json",
        }],
    },
    collectCoverageFrom: [
        "src/main/**/*.ts",
        "!**/index.ts",
        "!**/*.d.ts",
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
    coverageDirectory: "coverage",
    reporters: [["github-actions", {silent: false}], "summary"],
};