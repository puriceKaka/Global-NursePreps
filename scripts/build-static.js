const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "dist");
const excluded = new Set([
    ".git",
    ".vercel",
    ".vscode",
    ".agents",
    "node_modules",
    "dist"
]);

function copyEntry(sourcePath, targetPath) {
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
        fs.mkdirSync(targetPath, { recursive: true });
        for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
            if (excluded.has(entry.name)) {
                continue;
            }
            copyEntry(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
        }
        return;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) {
        continue;
    }
    copyEntry(path.join(rootDir, entry.name), path.join(outputDir, entry.name));
}

console.log(`Built static site in ${outputDir}`);
