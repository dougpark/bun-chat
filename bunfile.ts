import { file, write, Glob } from "bun";

// Configuration
const CLIENT_SRC = "./src/client";
const COMPONENTS_DIR = `${CLIENT_SRC}/components`;
const DIST_DIR = "./public";

// Client-side build script to assemble index.html from components

async function assembleHTML() {
    console.log("🛠️  Assembling Neighborhood Dashboard...");

    try {
        // 1. Load the Master Template
        const masterPath = `${CLIENT_SRC}/index.html`;
        let indexContent = await file(masterPath).text();

        // 2. Regex to find [[IMPORT:component_name]]
        const importRegex = /\[\[IMPORT:(\w+)\]\]/g;

        // 3. Find all matches and replace them with component content
        // This uses a "Promise.all" pattern to read files in parallel (very fast)
        const matches = [...indexContent.matchAll(importRegex)];

        for (const match of matches) {
            const [fullTag, fileName] = match;
            const componentPath = `${COMPONENTS_DIR}/${fileName}.html`;
            const componentFile = file(componentPath);

            if (await componentFile.exists()) {
                const componentContent = await componentFile.text();
                indexContent = indexContent.replace(fullTag, componentContent);
                console.log(`  ✅ Imported: ${fileName}`);
            } else {
                console.warn(`  ⚠️  Missing Component: ${fileName} at ${componentPath}`);
                indexContent = indexContent.replace(fullTag, ``);
            }
        }

        // 4. Basic Minification (Optional but good for 500 users)
        // Removes tabs, newlines, and extra spaces
        const minifiedHTML = indexContent;
        // .replace(/\n\s+/g, "")
        // .replace(/<!--[\s\S]*?-->/g, ""); // Removes HTML comments

        // 5. Write the final file to the public folder
        await write(`${DIST_DIR}/index.html`, minifiedHTML);
        console.log(`🚀 Build Successful: ${DIST_DIR}/index.html is ready.`);

    } catch (error) {
        console.error("❌ Build Failed:", error);
        process.exit(1);
    }
}

// Execute the build
assembleHTML();