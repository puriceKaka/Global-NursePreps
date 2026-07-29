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

function injectProjectTypography(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            injectProjectTypography(target);
            continue;
        }
        if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".html") continue;

        const html = fs.readFileSync(target, "utf8");
        if (html.includes("project-typography.css")) continue;
        const link = '    <link rel="stylesheet" href="/css/project-typography.css?v=20260729-light-text">\n';
        const updated = /<\/head>/i.test(html)
            ? html.replace(/<\/head>/i, `${link}</head>`)
            : `${link}${html}`;
        fs.writeFileSync(target, updated, "utf8");
    }
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of fs.readdirSync(rootDir)) {
    if (excluded.has(entry)) continue;
    copyRecursive(path.join(rootDir, entry), path.join(distDir, entry));
}

injectProjectTypography(distDir);

console.log(`Built static site in ${distDir}`);
