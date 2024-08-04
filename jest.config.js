/** @type {import('jest').Config} */

module.exports = {
    roots: ["<rootDir>/src", "<rootDir>/test"],
    testMatch: [
        "**/*.test.ts",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            tsconfig: "tsconfig.json",
        }],
    },
    collectCoverageFrom: [
        "src/**/*.ts",
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