const fs = require("fs/promises");
const path = require("path");

const contentFilePath = path.join(__dirname, "data", "exam-prep-content.json");

const defaultSettings = {
    hero: {
        eyebrow: "Global Nurse Training and Exam Prep",
        title: "Professional nursing exam learning platform.",
        lead: "Guided learning, timed checks, and progress tracking for nursing learners.",
        image: "",
        primaryCtaLabel: "Explore Courses",
        secondaryCtaLabel: "Lecturer Exam Lobby"
    },
    announcement: {
        label: "Platform Update",
        message: "",
        actionLabel: "Open Courses",
        actionHref: "courses.html"
    },
    stats: [],
    featuredCourseIds: [],
    workspaceGuidance: [],
    studentHighlights: [],
    adminTips: []
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function asString(value, fallback = "") {
    return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function asStringArray(value) {
    return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];
}

function normalizeFlashcards(cards) {
    if (!Array.isArray(cards)) {
        return [];
    }

    return cards
        .map((card) => ({
            front: asString(card?.front),
            back: asString(card?.back)
        }))
        .filter((card) => card.front && card.back);
}

function normalizeQuiz(quiz) {
    const source = quiz && typeof quiz === "object" ? quiz : {};
    const options = Array.isArray(source.options) ? source.options.map((item) => asString(item)).filter(Boolean) : [];
    const fallbackOption = options[0] ? 0 : -1;
    const correctOption = asNumber(source.correctOption, fallbackOption);

    return {
        prompt: asString(source.prompt),
        timeLimitSeconds: Math.max(15, asNumber(source.timeLimitSeconds, 75)),
        options,
        correctOption: correctOption >= 0 && correctOption < options.length ? correctOption : fallbackOption,
        success: asString(source.success),
        failure: asString(source.failure),
        rationale: asString(source.rationale)
    };
}

function normalizeModule(module, index) {
    const source = module && typeof module === "object" ? module : {};
    return {
        id: asString(source.id, `module-${index + 1}`),
        title: asString(source.title, `Module ${index + 1}`),
        objective: asString(source.objective),
        body: asString(source.body),
        videoSummary: asString(source.videoSummary),
        videoEmbedUrl: asString(source.videoEmbedUrl),
        videoResourceUrl: asString(source.videoResourceUrl),
        image: asString(source.image),
        structures: asStringArray(source.structures),
        flashcards: normalizeFlashcards(source.flashcards),
        recommendedFocus: asStringArray(source.recommendedFocus),
        quiz: normalizeQuiz(source.quiz)
    };
}

function normalizePracticeExam(practiceExam) {
    const source = practiceExam && typeof practiceExam === "object" ? practiceExam : {};
    return {
        title: asString(source.title, "Course Practice Exam"),
        durationMinutes: Math.max(10, asNumber(source.durationMinutes, 45)),
        questionCount: Math.max(5, asNumber(source.questionCount, 30)),
        passMark: Math.min(100, Math.max(0, asNumber(source.passMark, 70))),
        instructions: asString(source.instructions)
    };
}

function normalizeCourse(course, index) {
    const source = course && typeof course === "object" ? course : {};
    const modules = Array.isArray(source.modules) ? source.modules.map(normalizeModule) : [];

    return {
        id: asString(source.id, `course-${index + 1}`),
        title: asString(source.title, `Course ${index + 1}`),
        category: asString(source.category, "General"),
        difficulty: asString(source.difficulty, "Intermediate"),
        badge: asString(source.badge, "Featured"),
        durationHours: Math.max(1, asNumber(source.durationHours, 1)),
        questions: Math.max(0, asNumber(source.questions, 0)),
        exams: Math.max(0, asNumber(source.exams, 0)),
        format: asString(source.format, "Self-paced"),
        summary: asString(source.summary),
        image: asString(source.image),
        outcomes: asStringArray(source.outcomes),
        facts: asStringArray(source.facts),
        keywords: asStringArray(source.keywords),
        practiceExam: normalizePracticeExam(source.practiceExam),
        modules
    };
}

function normalizeSettings(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const hero = source.hero && typeof source.hero === "object" ? source.hero : {};
    const announcement = source.announcement && typeof source.announcement === "object" ? source.announcement : {};

    return {
        ...clone(defaultSettings),
        ...source,
        hero: {
            ...clone(defaultSettings.hero),
            eyebrow: asString(hero.eyebrow, defaultSettings.hero.eyebrow),
            title: asString(hero.title, defaultSettings.hero.title),
            lead: asString(hero.lead, defaultSettings.hero.lead),
            image: asString(hero.image, defaultSettings.hero.image),
            primaryCtaLabel: asString(hero.primaryCtaLabel, defaultSettings.hero.primaryCtaLabel),
            secondaryCtaLabel: asString(hero.secondaryCtaLabel, defaultSettings.hero.secondaryCtaLabel)
        },
        announcement: {
            ...clone(defaultSettings.announcement),
            label: asString(announcement.label, defaultSettings.announcement.label),
            message: asString(announcement.message, defaultSettings.announcement.message),
            actionLabel: asString(announcement.actionLabel, defaultSettings.announcement.actionLabel),
            actionHref: asString(announcement.actionHref, defaultSettings.announcement.actionHref)
        },
        stats: Array.isArray(source.stats)
            ? source.stats.map((item) => ({
                value: asString(item?.value),
                label: asString(item?.label)
            })).filter((item) => item.value && item.label)
            : [],
        featuredCourseIds: asStringArray(source.featuredCourseIds),
        workspaceGuidance: asStringArray(source.workspaceGuidance),
        studentHighlights: Array.isArray(source.studentHighlights)
            ? source.studentHighlights.map((item) => ({
                title: asString(item?.title),
                description: asString(item?.description)
            })).filter((item) => item.title && item.description)
            : [],
        adminTips: asStringArray(source.adminTips)
    };
}

function normalizeContent(content) {
    const source = content && typeof content === "object" ? content : {};
    const courses = Array.isArray(source.courses) ? source.courses.map(normalizeCourse) : [];
    const featuredCourseIds = normalizeSettings(source.settings).featuredCourseIds.filter((courseId) => courses.some((course) => course.id === courseId));

    const settings = normalizeSettings(source.settings);
    settings.featuredCourseIds = featuredCourseIds.length ? featuredCourseIds : courses.slice(0, 3).map((course) => course.id);

    return {
        version: Math.max(1, asNumber(source.version, 1)),
        updatedAt: asString(source.updatedAt, new Date().toISOString()),
        settings,
        courses
    };
}

async function readExamPrepContent() {
    const raw = await fs.readFile(contentFilePath, "utf8");
    return normalizeContent(JSON.parse(raw));
}

async function writeExamPrepContent(content) {
    const normalized = normalizeContent({
        ...content,
        updatedAt: new Date().toISOString()
    });

    await fs.writeFile(contentFilePath, JSON.stringify(normalized, null, 2), "utf8");
    return normalized;
}

module.exports = {
    readExamPrepContent,
    writeExamPrepContent,
    normalizeContent
};
