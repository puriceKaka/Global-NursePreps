const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const excluded = new Set([".git", ".vercel", ".agents", "node_modules", "dist"]);

function copyRecursive(source, destination) {
    const stat = fs.statSync(source);

    if (stat.isDirectory()) {
        fs.mkdirSync(destination, { recursive: true });
        for (const entry of fs.readdirSync(source)) {
            if (excluded.has(entry)) continue;
            copyRecursive(path.join(source, entry), path.join(destination, entry));
        }
        return;
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of fs.readdirSync(rootDir)) {
    if (excluded.has(entry)) continue;
    copyRecursive(path.join(rootDir, entry), path.join(distDir, entry));
}

console.log(`Built static site in ${distDir}`);
