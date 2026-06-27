#!/usr/bin/env node

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * Validates the exports of a given module against the expected exports.
 * @param {Object} module The module to validate
 * @param {String} moduleName The name of the module
 * @returns {Array} An array of errors
 */
function validateExports(module, moduleName) {
    const commonErrorExports = ["BatchJSError", "StepBuilderError", "StepCancelledError", "JobCancelledError"];
    const commonInterfaceExports = ["Job", "JobListener", "JobLogger", "JobMeter", "JobTimer", "TimerType", "Step", "StepBuilder", "Runnable", "RunnableStatus"];
    const commonExports = [...commonErrorExports, ...commonInterfaceExports];
    const streamClassExports = ["AllMatchStream", "AnyMatchStream", "BufferStream", "CountStream", "DistinctStream", "EmptyStream","FilterStream", 
        "FirstStream", "FlatStream", "GroupByStream", "HasElementsStream","LastStream", "ParallelStream", "ReplayStream", "SingleStream",];
    const streamErrorExports = ["NotClosedError", "SingleStreamError"];
    const streamInterfaceExports = ["DiscardingInternalBufferDuplex", "DiscardingSingleObjectDuplex", "DiscardingStream", "InternalBufferDuplex", "ObjectDuplex", "ObjectReadable", "ObjectWritable", "SingleObjectDuplex"];
    const streamExports = [...streamClassExports, ...streamErrorExports, ...streamInterfaceExports, "StreamUtils"];
    const expectedExports = [...commonExports, ...streamExports];

    const missing = expectedExports.filter(exp => !module[exp]);
    const extra = Object.keys(module).filter(exp => !expectedExports.includes(exp));

    const errors = [];

    if (missing.length > 0) {
        console.log(`❌ ${moduleName} missing exports: ${missing.join(", ")}`);
        errors.push(`${moduleName} missing exports: ${missing.join(", ")}`);
    } 
    if (extra.length > 0) {
        console.log(`❌ ${moduleName} extra exports: ${extra.join(", ")}`);
        errors.push(`${moduleName} extra exports: ${extra.join(", ")}`);
    }
    if (missing.length === 0 && extra.length === 0) {
        console.log(`✅ ${moduleName} exports found: ${Object.keys(module).join(", ")}`);
    }

    return errors;
}

/**
 * Validate CJS require
 * This function attempts to require the CJS module and checks for expected exports.
 * If any expected export is missing, it adds an error message to the errors array.
 * 
 * @returns {Array} An array of errors
 */
function validateCJS() {
    try {
        console.log("\n▶️ Checking CJS require...");
        const cjsModule = require("../dist/cjs/index.cjs");
    
        if (cjsModule) {
            return validateExports(cjsModule, "CJS");
        } else {
            console.log("❌ CJS module exports nothing");
            return ["CJS module exports nothing"];
        }
    } catch (err) {
        console.log(`❌ CJS import failed: ${err.message}`);
        return [`CJS import failed: ${err.message}`];
    }
}

/**
 * Validate ESM import
 * This function attempts to dynamically import the ESM module and checks for expected exports.
 * If any expected export is missing, it adds an error message to the errors array.
 * 
 * @returns {Array} An array of errors
 */
async function validateESM() {
    try {
        console.log("\n▶️ Checking ESM import...");
        const esmModule = await import("../dist/esm/index.mjs");
    
        if (esmModule) {
            return validateExports(esmModule, "ESM");
        } else {
            console.log("❌ ESM module exports nothing");
            return ["ESM module exports nothing"];
        }
    } catch (err) {
        console.log(`❌ ESM import failed: ${err.message}`);
        return [`ESM import failed: ${err.message}`];
    }
}

/**
 * Validate declaration files
 * This function checks for the existence of TypeScript declaration files in the dist/@types directory.
 * If any expected declaration file is missing, it adds an error message to the errors array.
 * 
 * @returns {Array} An array of errors
 */
function validateDeclarations() {
    const declarations = [
        "dist/@types/index.d.ts",
        "dist/@types/common/index.d.ts",
        "dist/@types/streams/index.d.ts"
    ];

    console.log("\n▶️ Checking declaration files...");
    for (const dts of declarations) {
        if (existsSync(dts)) {
            console.log(`✅ ${dts} exists`);
        } else {
            console.log(`❌ ${dts} missing`);
            return [`Declaration file missing: ${dts}`];
        }
    }
    return [];
}

/**
 * Report errors and exit
 * This function checks if there are any errors collected during the validation process.
 * If there are errors, it logs them to the console and exits the process with a non-zero status code.
 * If there are no errors, it logs a success message and exits with a zero status code.
 * 
 * @param {Array} errors An array of error messages
 */
function reportErrors(errors) {
    if (errors.length > 0) {
        console.error("\n❌ Validation FAILED:");
        process.exit(1);
    } else {
        console.log("\n✅ All validation checks passed!");
        process.exit(0);
    }
}

/**
 * Run validation
 * This function orchestrates the validation process by calling the validateESM, validateCJS, and validateDeclarations functions.
 * It collects all errors from these validations and passes them to the reportErrors function for reporting.
 */
function runValidation() {
    validateESM().then((errors) => {
        const allErrors = [...validateCJS(), ...errors, ...validateDeclarations()];
        reportErrors(allErrors);
    });
}

runValidation();