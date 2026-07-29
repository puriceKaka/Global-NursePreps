window.GnpCourseMaterials = (() => {
    const DOCUMENT_EXTENSIONS = /\.(pdf|pptx|docx|txt|md|rtf)$/i;
    const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)$/i;

    function sanitizePath(value) {
        return String(value || "material")
            .normalize("NFKD")
            .replace(/[^\w.-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();
    }

    function readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error(`Unable to read ${file?.name || "the selected file"}.`));
            reader.readAsDataURL(file);
        });
    }

    function validateFile(file, kind = "document") {
        if (!file) throw new Error("Choose a file first.");
        const isVideo = kind === "video";
        const accepted = isVideo
            ? (String(file.type || "").startsWith("video/") || VIDEO_EXTENSIONS.test(file.name))
            : DOCUMENT_EXTENSIONS.test(file.name);
        if (!accepted) {
            throw new Error(isVideo
                ? "Use an MP4, WebM, MOV, or M4V video."
                : "Use a PDF, PowerPoint (.pptx), Word (.docx), TXT, MD, or RTF document.");
        }
        const limit = isVideo ? 1024 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > limit) {
            throw new Error(`${isVideo ? "Video" : "Document"} exceeds the ${isVideo ? "1 GB" : "50 MB"} limit.`);
        }
    }

    async function uploadToSupabase(file, { courseId, kind }) {
        if (!window.GnpSupabase?.uploadCourseMaterial) return null;
        const session = window.GnpUtils?.getSession?.() || null;
        if (!session?.authToken || !window.GnpSupabase.isConfigured?.()) return null;
        return window.GnpSupabase.uploadCourseMaterial(file, {
            courseId,
            kind,
            token: session.authToken
        });
    }

    async function extractDocument(file, uploaded = null) {
        const payload = {
            fileName: file.name,
            mimeType: file.type || "",
            fileUrl: uploaded?.signedUrl || uploaded?.url || ""
        };
        if (!payload.fileUrl) {
            if (file.size > 4 * 1024 * 1024) {
                throw new Error("Persistent storage must be configured to convert documents larger than 4 MB.");
            }
            payload.dataUrl = await readAsDataUrl(file);
        }
        const response = await fetch("/api/materials/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to convert this learning material.");
        return result;
    }

    async function processDocument(file, { courseId }) {
        validateFile(file, "document");
        const uploaded = await uploadToSupabase(file, { courseId, kind: "document" });
        const extracted = await extractDocument(file, uploaded);
        const originalLink = uploaded?.signedUrl || uploaded?.url || await readAsDataUrl(file);
        const moduleTitles = Array.isArray(extracted.moduleTitles) && extracted.moduleTitles.length
            ? extracted.moduleTitles
            : (Array.isArray(extracted.generatedLessons)
                ? extracted.generatedLessons.map((lesson) => lesson?.title).filter(Boolean)
                : []);
        const resolvedModuleTitles = moduleTitles.length
            ? moduleTitles
            : [file.name.replace(/\.[^.]+$/, "")];
        const materialType = file.name.toLowerCase().endsWith(".pptx") ? "PowerPoint" : (file.type || "Document");
        return {
            id: `material-${Date.now().toString(36)}`,
            title: file.name.replace(/\.[^.]+$/, ""),
            name: file.name,
            type: materialType,
            mimeType: file.type || "",
            size: file.size,
            link: originalLink,
            storagePath: uploaded?.path || "",
            bucket: uploaded?.bucket || "",
            preservedOriginal: true,
            extractedNotes: "",
            moduleTitles: resolvedModuleTitles,
            generatedLessons: resolvedModuleTitles.map((moduleTitle, index) => ({
                title: moduleTitle,
                lectureTitle: moduleTitle,
                objective: `Study ${moduleTitle} from the original ${materialType} material.`,
                body: "",
                concepts: [moduleTitle],
                summary: `Module ${index + 1}: ${moduleTitle}`,
                materials: {
                    videoLecture: "",
                    pdfNotes: "",
                    slides: materialType === "PowerPoint" ? originalLink : "",
                    downloads: [{
                        title: file.name,
                        type: materialType,
                        link: originalLink
                    }],
                    discussion: true,
                    assignment: null
                }
            })),
            createdAt: new Date().toISOString()
        };
    }

    async function processVideo(file, { courseId }) {
        validateFile(file, "video");
        const uploaded = await uploadToSupabase(file, { courseId, kind: "video" });
        if (uploaded) {
            return {
                name: file.name,
                type: file.type || "video/mp4",
                size: file.size,
                link: uploaded.signedUrl || uploaded.url,
                storagePath: uploaded.path,
                bucket: uploaded.bucket
            };
        }
        if (file.size > 8 * 1024 * 1024) {
            throw new Error("Persistent storage must be configured before uploading videos larger than 8 MB.");
        }
        return {
            name: file.name,
            type: file.type || "video/mp4",
            size: file.size,
            link: await readAsDataUrl(file),
            storagePath: "",
            bucket: ""
        };
    }

    return {
        processDocument,
        processVideo,
        readAsDataUrl,
        validateFile,
        sanitizePath
    };
})();
