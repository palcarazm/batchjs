import fs from "node:fs";
import path from "node:path";

/**
 * Extracts the title from an index.md file (first # heading)
 * @param {string} filePath - Path to the index.md file
 * @returns {string} The extracted title or fallback name
 */
function extractTitle(filePath) {
    try {
        const content = fs.readFileSync(filePath, "utf8");
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : path.basename(path.dirname(filePath));
    } catch {
        return path.basename(path.dirname(filePath));
    }
}

/**
 * Extracts all class, interface, enum, and type aliases from an index.md file
 * @param {string} filePath - Path to the index.md file
 * @param {string} basePath - Base path for generating links
 * @param {string} category - The category to extract (Classes, Interfaces, Enumerations, Type Aliases, Functions)
 * @returns {Array<{text: string, link: string}>} Array of items
 */
function extractCategoryItems(filePath, basePath, category) {
    try {
        const content = fs.readFileSync(filePath, "utf8");
        // Find the category section: "## Classes", "## Interfaces", etc.
        const categoryRegex = new RegExp(`##\\s+${category}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
        const match = content.match(categoryRegex);
    
        if (!match) return [];
    
        const sectionContent = match[1];
        // Extract all list items: - [ClassName](path/to/Class.md)
        const itemRegex = /-\s+\[([^\]]+)\]\(([^)]+)\)/g;
        const items = [];
        let itemMatch;
    
        while ((itemMatch = itemRegex.exec(sectionContent)) !== null) {
            const name = itemMatch[1];
            let link = itemMatch[2];
      
            // Resolve relative link to absolute path
            // If link starts with './', remove it
            if (link.startsWith("./")) {
                link = link.substring(1);
            }
      
            // Construct full link
            // Base path is the directory relative to docs/api/
            // For example: basePath = 'classes', link = 'Job.md'
            // Result: '/api/classes/Job'
            const fullLink = path.join("/api", basePath, link.replace(/\.md$/, ""));
      
            items.push({
                text: name,
                link: fullLink.replace(/\\/g, "/")
            });
        }
    
        return items;
    } catch (error) {
        console.warn(`⚠️ Error parsing ${filePath}: ${error.message}`);
        return [];
    }
}

/**
 * Creates sidebar items for each category from an index.md file
 * @param {string} indexPath Path to the processed index path
 * @param {string} relativePath Relative base path to the processed index path
 * @returns {Array} Sidebar Items structure
 */
function generateCategoriesStructure(indexPath, relativePath) {
    const items = [];
    const categories = ["Classes", "Interfaces", "Enumerations", "Type Aliases", "Functions", "Variables"];

    for (const category of categories) {
        const categoryItems = extractCategoryItems(indexPath, relativePath, category);
        if (categoryItems.length > 0) {
            items.push({
                text: category,
                collapsed: true,
                items: categoryItems
            });
        }
    }

    return items;
}

/**
 * Creates sidebar items for subdirectories
 * @param {string} apiDir Path to the docs/api/ directory
 * @param {Array} directories Directories to scan
 * @param {string} relativePath Relative base path for the directories
 * @param {number} depth Actual depth
 * @returns {Array} Sidebar items
 */
function generateSubdirectoryStructure(apiDir, directories, relativePath, depth) {
    const items = [];
    for (const subDir of directories) {
        const subPath = path.join(relativePath, subDir.name);
        const subItems = buildApiSidebarStructure(
            path.join(apiDir, subDir.name), 
            subPath,
            depth + 1
        );
        if (subItems) {
            if (Array.isArray(subItems)) {
                items.push(...subItems);
            } else {
                items.push(subItems);
            }
        }
    }

    return items;
}

/**
 * Recursively traverses the docs/api/ directory and builds the sidebar structure
 * @param {string} apiDir - Path to the docs/api/ directory
 * @param {string} relativePath - Relative path from apiDir for link generation
 * @param {number} depth - Current depth for recursion limiting
 * @returns {Object|null} Sidebar item or null if no content
 */
function buildApiSidebarStructure(apiDir, relativePath = "", depth = 0) {
    const items = fs.readdirSync(apiDir, { withFileTypes: true });
  
    // Separate directories and files
    const directories = items.filter(item => item.isDirectory());
    const hasIndex = items.some(item => item.isFile() && item.name === "index.md");

    // If this directory has an index.md, create a sidebar item for it
    if (hasIndex) {
        const indexPath = path.join(apiDir, "index.md");
        const title = extractTitle(indexPath);
        const link = `/${path.join("api", relativePath).replaceAll("\\", "/")}`;
        const item = {
            text: title,
            link: link,
            items: generateCategoriesStructure(indexPath, relativePath)
        };

        if (item.items.length === 0) {
            item.items = generateSubdirectoryStructure(apiDir, directories, relativePath, depth);
        }

        return item;
    }

    // If no index.md, process subdirectories directly (flatten)
    const directoryItems = generateSubdirectoryStructure(apiDir, directories, relativePath, depth);
    return directoryItems.length > 0 ? directoryItems : null;
}

/**
 * Generates the JavaScript code for the sidebar configuration
 * @param {Object|Array} structure - The sidebar structure object
 * @returns {string} JavaScript code string
 */
function generateSidebarCode(structure) {
    return `// ===== AUTO-GENERATED =====
// Do not edit manually. Run: npm run docs:api

export const apiSidebar = ${JSON.stringify(structure, null, 4)};`;
}

/**
 * Main function to generate the API sidebar
 */
function generateApiSidebar() {
    console.log("\n▶️ Generating sidebar for /api/...");

    const apiDir = path.join(process.cwd(), "docs/api");
  
    // Check if docs/api/ exists
    if (!fs.existsSync(apiDir)) {
        console.error("❌ docs/api/ does not exist. Run npm run docs:api first.");
        process.exit(1);
    }
  
    const structure = buildApiSidebarStructure(apiDir);
  
    if (!structure || structure.length === 0) {
        console.warn("⚠️ No index.md files found in docs/api/");
        return;
    }

    // Generate the sidebar code
    const sidebarCode = generateSidebarCode(structure);
  
    // Save to file
    const outputFile = path.join(process.cwd(), "docs/.vitepress/tmp/api-sidebar.ts");
    if(!fs.existsSync(path.dirname(outputFile))) {
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    }
    fs.writeFileSync(outputFile, sidebarCode, "utf8");
  
    console.log(`✅ Sidebar generated at: ${path.relative(process.cwd(), outputFile)}`);
}

generateApiSidebar();