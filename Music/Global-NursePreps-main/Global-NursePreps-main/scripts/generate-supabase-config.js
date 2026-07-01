const fs = require("fs");
const path = require("path");

function pickEnv(names) {
    for (const name of names) {
        const value = process.env[name];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}

const url = pickEnv([
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "VITE_SUPABASE_URL",
    "GNP_SUPABASE_URL"
]);
const anonKey = pickEnv([
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "GNP_SUPABASE_ANON_KEY"
]);

const outputPath = path.join(__dirname, "..", "js", "supabase-config.js");
const content = `window.GNP_SUPABASE_CONFIG = window.GNP_SUPABASE_CONFIG || {\n    url: ${JSON.stringify(url)},\n    anonKey: ${JSON.stringify(anonKey)}\n};\n`;

fs.writeFileSync(outputPath, content, "utf8");
console.log(`Wrote Supabase config to ${outputPath}`);
