const AdmZip = require("adm-zip");
const { PDFParse } = require("pdf-parse");

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

function cleanText(value) {
    return String(value || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/\r/g, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function xmlText(xml) {
    return cleanText(String(xml || "")
        .replace(/<a:br\s*\/>/g, "\n")
        .replace(/<\/a:p>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<w:tab\s*\/>/g, "\t")
        .replace(/<[^>]+>/g, " "));
}

function naturalOrder(left, right) {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

function extractOfficeText(buffer, extension) {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    if (extension === "pptx") {
        return entries
            .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName))
            .sort((left, right) => naturalOrder(left.entryName, right.entryName))
            .map((entry, index) => {
                const text = xmlText(entry.getData().toString("utf8"));
                return text ? `Slide ${index + 1}\n${text}` : "";
            })
            .filter(Boolean)
            .join("\n\n");
    }
    const document = entries.find((entry) => entry.entryName === "word/document.xml");
    return document ? xmlText(document.getData().toString("utf8")) : "";
}

function splitIntoModules(text, fileName) {
    const cleaned = cleanText(text);
    const slideChunks = cleaned.split(/(?=Slide \d+\n)/g).map(cleanText).filter(Boolean);
    const paragraphs = cleaned.split(/\n{2,}/).map(cleanText).filter(Boolean);
    const source = slideChunks.length > 1 ? slideChunks : paragraphs;
    const desired = Math.min(12, Math.max(1, Math.ceil(source.length / 3)));
    const perModule = Math.max(1, Math.ceil(source.length / desired));
    const chunks = [];
    for (let index = 0; index < source.length; index += perModule) {
        chunks.push(source.slice(index, index + perModule).join("\n\n"));
    }
    if (!chunks.length && cleaned) chunks.push(cleaned);

    return chunks.map((body, index) => {
        const firstLine = body.split(/\n/).map((line) => line.trim()).find(Boolean) || "";
        const title = firstLine
            .replace(/^Slide \d+\s*/i, "")
            .split(/\s+/)
            .slice(0, 9)
            .join(" ") || `Module ${index + 1}`;
        const concepts = [...new Set(body
            .toLowerCase()
            .split(/[^a-z0-9-]+/)
            .filter((word) => word.length > 5))]
            .slice(0, 3)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
        return {
            title,
            lectureTitle: `${fileName} • Module ${index + 1}`,
            objective: `Understand and apply the key nursing concepts in ${title}.`,
            body,
            concepts: concepts.length ? concepts : [title, "Clinical application", "Safe nursing practice"],
            summary: body.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").slice(0, 500),
            sourceFile: fileName
        };
    });
}

async function readRequestSource(body) {
    if (body.fileUrl) {
        const response = await fetch(body.fileUrl);
        if (!response.ok) throw new Error(`Unable to download the uploaded material (${response.status}).`);
        const declaredSize = Number(response.headers.get("content-length") || 0);
        if (declaredSize > MAX_SOURCE_BYTES) throw new Error("Learning material exceeds the 50 MB extraction limit.");
        return Buffer.from(await response.arrayBuffer());
    }
    const dataUrl = String(body.dataUrl || "");
    const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_SOURCE_BYTES) throw new Error("Learning material exceeds the 50 MB extraction limit.");
    return buffer;
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed." });
    }

    try {
        const body = req.body || {};
        const fileName = String(body.fileName || "learning-material").trim();
        const extension = fileName.toLowerCase().split(".").pop();
        if (!["pdf", "pptx", "docx", "txt", "md", "rtf"].includes(extension)) {
            return res.status(400).json({ error: "Use PDF, PPTX, DOCX, TXT, MD, or RTF learning materials." });
        }

        const buffer = await readRequestSource(body);
        let contentNotes = "";
        if (extension === "pdf") {
            const parser = new PDFParse({ data: buffer });
            try {
                const result = await parser.getText();
                contentNotes = cleanText(result?.text || "");
            } finally {
                await parser.destroy();
            }
        } else if (extension === "pptx" || extension === "docx") {
            contentNotes = extractOfficeText(buffer, extension);
        } else {
            contentNotes = cleanText(buffer.toString("utf8"));
        }

        if (!contentNotes) {
            return res.status(422).json({ error: "No readable text was found in this material. Scanned PDFs require OCR before upload." });
        }

        const generatedLessons = splitIntoModules(contentNotes, fileName);
        return res.status(200).json({
            ok: true,
            fileName,
            contentNotes,
            moduleTitles: generatedLessons.map((lesson) => lesson.title),
            generatedLessons
        });
    } catch (error) {
        return res.status(500).json({ error: error?.message || "Unable to convert the learning material." });
    }
};
