import { file, write, Glob } from "bun";
import { watch } from "fs";
import { rm, mkdir } from "node:fs/promises";

// Configuration

const CLIENT_SRC = "./src/client";
const ASSETS_SRC = `${CLIENT_SRC}/assets`;
const MASTER_TEMPLATE = `${CLIENT_SRC}/template.html`;
const COMPONENTS_DIR = `${CLIENT_SRC}/components`;
const DIST_DIR = "./public";
const INDEX_FILE = `${DIST_DIR}/index.html`;

// Sync static asset folders to the public directory

async function syncAssets() {
    try {
        // 1. Clean and recreate the public folder
        await rm(DIST_DIR, { recursive: true, force: true });
        await mkdir(DIST_DIR, { recursive: true });

        // 2. Use Glob to find all files in the assets folder and copy them over while preserving the folder structure
        const allFiles = new Glob("**/*");
        for await (const relativePath of allFiles.scan(ASSETS_SRC)) {
            // This gives you "static/css/style.css" directly
            const src = `${ASSETS_SRC}/${relativePath}`;
            const dest = `${DIST_DIR}/${relativePath}`;

            // Ensure the folder structure exists for this file
            const destDir = dest.substring(0, dest.lastIndexOf("/"));
            await mkdir(destDir, { recursive: true });

            await write(dest, file(src));
        }
        console.log(`✅ syncAssets Successful: All assets from ${ASSETS_SRC} copied to ${DIST_DIR}`);
    } catch (e) {
        console.error("❌ syncAssets failed:", e);
    }
}

// Client-side build script to assemble index.html from components

async function assembleHTML() {

    try {
        // 1. Load the Master Template
        const masterPath = MASTER_TEMPLATE;
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
                // console.log(`  ✅ Imported: ${fileName}`);
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
        await write(INDEX_FILE, minifiedHTML);
        console.log(`🚀 assembleHTML Successful: ${INDEX_FILE} is ready.`);

    } catch (error) {
        console.error("❌ assembleHTML Build Failed:", error);
        process.exit(1);
    }
}

// Client script.ts processing
async function buildClientJS() {
    const result = await Bun.build({
        entrypoints: [`${CLIENT_SRC}/script.ts`],
        outdir: `${DIST_DIR}/static`,
        naming: "script.js", // Forces the output name
        minify: false,        // Makes it tiny for production
        target: "browser",   // Ensures it uses browser-friendly code
    });

    if (!result.success) {
        console.error("❌ buildClientJS Build failed", result.logs);
    } else {
        console.log("✅ buildClientJS Successful: Client JS bundled to public/static/script.js");
    }
}

async function runBuild() {
    try {
        console.log("🛠️  Assembling Emergency Chat...");

        // 1. Sync the static folders first
        await syncAssets();

        // 2. Assemble the HTML (your existing function)
        await assembleHTML();

        // 3. Build the client-side JavaScript
        await buildClientJS();

        console.log("🚀 Full Build Complete.");
    } catch (e) {
        console.error("❌ Full Build failed:", e);
    }
}

runBuild();

// watch for changes in the client folder and rebuild when they happen

console.log(`👀 Watching for changes in ${CLIENT_SRC}...`);

/// Simple debounce variable
let isBuilding = false;

const watcher = watch(CLIENT_SRC, { recursive: true }, async (event, filename) => {
    // 1. Guard: Don't trigger if we are already building
    if (isBuilding) return;

    // 2. Guard: Ignore changes in the output 'public' directory
    if (filename && filename.startsWith("public")) return;

    // 3. Guard: Only react to actual source files (.ts, .html, .css)
    const isSourceFile = /\.(ts|js|html|css|json|png|jpg|ico)$/.test(filename || "");
    if (!isSourceFile) return;

    console.log(`\n📄 Change detected: ${filename}`);

    isBuilding = true;

    try {
        await runBuild();
    } finally {
        // Wait a small moment before allowing another build
        // This stops the "Access" loop
        setTimeout(() => {
            isBuilding = false;
        }, 5000);
    }
});



// Keep the process alive
process.on("SIGINT", () => {
    watcher.close();
    process.exit();
});