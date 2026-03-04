import { file, write, Glob } from "bun";
import { watch } from "fs";
import { mkdir } from "node:fs/promises";

// Configuration
const ASSET_FOLDERS = ["fav", "static", "vendor"];
const CLIENT_SRC = "./src/client";
const MASTER_TEMPLATE = `${CLIENT_SRC}/template.html`;
const COMPONENTS_DIR = `${CLIENT_SRC}/components`;
const DIST_DIR = "./public";
const INDEX_FILE = `${DIST_DIR}/index.html`;


// Sync static asset folders (fav, static, vendor) to the public directory

async function syncAssets() {
    const assetFolders = ASSET_FOLDERS;

    for (const folder of assetFolders) {
        const srcPath = `./src/client/${folder}`;
        const distPath = `./public/${folder}`;

        // Ensure the destination folder exists
        await mkdir(distPath, { recursive: true });

        // Find every file in the source folder
        const glob = new Glob("**/*");
        const scanner = glob.scan(srcPath);
        for await (const fileName of scanner) {
            const srcFile = file(`${srcPath}/${fileName}`);
            const distFile = `${distPath}/${fileName}`;

            // Efficiently copy the file
            await write(distFile, srcFile);
        }
    }
    console.log("📂 Assets synced to public.");
}

// Client-side build script to assemble index.html from components

async function assembleHTML() {
    console.log("🛠️  Assembling Emergency Chat...");

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
        await write(INDEX_FILE, minifiedHTML);
        console.log(`🚀 Build Successful: ${INDEX_FILE} is ready.`);

    } catch (error) {
        console.error("❌ Build Failed:", error);
        process.exit(1);
    }
}

// Client script.ts processing
async function buildClientJS() {
    const result = await Bun.build({
        entrypoints: ["./src/client/script.ts"],
        outdir: "./public/static",
        naming: "script.js", // Forces the output name
        minify: false,        // Makes it tiny for production
        target: "browser",   // Ensures it uses browser-friendly code
    });

    if (!result.success) {
        console.error("❌ JS Build failed", result.logs);
    } else {
        console.log("✅ Client JS bundled to public/script.js");
    }
}

async function runBuild() {
    try {
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

// Watch the entire src directory for changes
const watcher = watch(CLIENT_SRC, { recursive: true }, async (event, filename) => {
    if (filename) {
        console.log(`\n📄 Change detected in ${filename}. Reassembling...`);
        await runBuild();
    }
});

console.log(`👀 Watching for changes in ${CLIENT_SRC}...`);

// Keep the process alive
process.on("SIGINT", () => {
    watcher.close();
    process.exit();
});