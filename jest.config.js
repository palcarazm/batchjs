module.exports = {
    roots: ["<rootDir>/src", "<rootDir>/test"],
    testMatch: [
        "**/*.test.{ts,ts}",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            tsconfig: "tsconfig.json",
        }],
    },
    collectCoverageFrom: [
        "**/*.ts",
        "!**/index.ts",
        "!**/*.d.ts",
        "!**/node_modules/**",
    ],
};