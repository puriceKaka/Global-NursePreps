const HISTORY_KEY = "gnp_purice_ai_history";
const THEME_KEY = "gnp_purice_ai_theme";

const messages = document.getElementById("puriceMessages");
const form = document.getElementById("puriceForm");
const input = document.getElementById("puriceInput");
const clearButton = document.getElementById("puriceClear");
const themeButton = document.getElementById("puriceTheme");
const fileInput = document.getElementById("puriceFile");
const actionButton = document.getElementById("puriceAction");
const typing = document.getElementById("puriceTyping");

let recognition = null;
let chatHistory = [];

const knowledgeBase = [
    {
        keys: ["enroll", "course", "register", "unit"],
        answer: "To enroll, open Courses, choose BSCN Courses or Certified Nursing Courses, select the exact unit, then register or login. After payment, only that selected course unlocks with videos, PDF notes, quizzes, assignments, MCQs, and downloads."
    },
    {
        keys: ["payment", "pay", "mpesa", "m-pesa", "visa", "mastercard", "paypal", "bank", "airtel", "sponsor"],
        answer: "Payments are linked to one selected course, licensing track, mock exam, or support service. Choose the item, review the price and instructor, then pay with the available gateway. Keep your transaction code so support can confirm delayed payments."
    },
    {
        keys: ["nclex", "clinical judgment", "cat", "rationale"],
        answer: "For NCLEX-RN, focus on clinical judgment, prioritization, safety, pharmacology, med-surg, maternal-child, mental health, and rationales. Use timed mock exams, review weak topics, and write down why each wrong option is unsafe or less urgent."
    },
    {
        keys: ["uk cbt", "cbt", "nmc", "uk"],
        answer: "UK CBT preparation should follow the NMC blueprint: professional values, communication, nursing decision-making, leadership, medication safety, and adult nursing scenarios. Practice timed sets and revise every incorrect answer by topic."
    },
    {
        keys: ["australia", "ahpra", "osce", "registration"],
        answer: "Australia nursing registration preparation usually needs document readiness, AHPRA pathway guidance, clinical communication, OSCE-style assessment practice, medication safety, and patient-centered care documentation."
    },
    {
        keys: ["drug", "dose", "dosage", "calculation", "iv", "infusion"],
        answer: "For drug calculations, use one formula at a time: required dose divided by available dose, multiplied by volume. For IV rates, calculate total volume divided by time. Always confirm units, patient weight, concentration, route, and maximum safe dose with your instructor or facility policy."
    },
    {
        keys: ["anatomy", "physiology", "heart", "lung", "kidney", "body"],
        answer: "For Anatomy and Physiology revision, connect structure to function. Example: the heart chambers control blood flow direction, valves prevent backflow, and cardiac output depends on heart rate and stroke volume. Study diagrams, then explain the pathway aloud."
    },
    {
        keys: ["pharmacology", "drug class", "medication", "side effect"],
        answer: "In Pharmacology, group drugs by class, indication, mechanism, major side effects, contraindications, and nursing considerations. For exams, always connect the medication to assessment, patient education, monitoring, and safety."
    },
    {
        keys: ["research", "proposal", "topic", "data", "analysis", "report", "presentation"],
        answer: "Research support can help with topic identification, concept papers, proposals, data collection tools, analysis planning, report writing, PowerPoint preparation, dissemination, and consultation booking."
    },
    {
        keys: ["assignment", "essay", "case study", "write"],
        answer: "For assignments, start with the marking rubric, define the clinical problem, support points with current nursing evidence, and end with practical nursing implications. Purice AI can help you outline, refine, and check clarity."
    },
    {
        keys: ["exam", "mock", "quiz", "score", "practice"],
        answer: "For exams, start with topic practice, then timed mock tests. After each mock exam, review score patterns, identify weak areas, repeat questions by category, and track readiness before moving to the next exam set."
    },
    {
        keys: ["certificate", "certificates"],
        answer: "Certificates appear after you complete the required course or exam activities. Open Certificates from the student menu to view and download available certificates."
    },
    {
        keys: ["live", "class", "zoom", "meet", "meeting"],
        answer: "Live classes are available after login from the student workspace. Instructors can schedule sessions, and students can join when the class is active with camera, microphone, and screen-sharing controls."
    },
    {
        keys: ["study", "plan", "schedule", "week", "revision"],
        answer: "A good study week uses short focused blocks: two days for content review, two days for questions, one day for weak areas, one timed mock, and one rest or light revision day. Keep sessions realistic and track what you finish."
    },
    {
        keys: ["dashboard", "profile", "learning", "materials", "notes", "video", "download"],
        answer: "After login, use the student side menu for Dashboard, Courses, Licensing, Exams, Research Support, My Learning, Payments, Certificates, Notifications, Profile, and Help & Support. Paid learning materials appear only in the purchased course."
    }
];

const broadTopics = [
    {
        keys: ["hypertension", "blood pressure", "bp"],
        answer: "For hypertension, think assessment first: confirm repeated elevated readings, check symptoms, review risk factors, assess medication adherence, and teach lifestyle changes. Urgent red flags include chest pain, severe headache, confusion, shortness of breath, weakness, or very high readings that need immediate clinical review."
    },
    {
        keys: ["diabetes", "glucose", "insulin", "hypoglycemia", "hyperglycemia"],
        answer: "For diabetes questions, separate low glucose from high glucose. Hypoglycemia often needs fast sugar if the patient can swallow, then recheck. Hyperglycemia needs hydration, medication review, ketone awareness where relevant, and escalation if vomiting, confusion, dehydration, or very high readings appear."
    },
    {
        keys: ["infection", "sepsis", "fever", "wound"],
        answer: "For infection and sepsis, assess temperature, heart rate, breathing, blood pressure, mental status, wound changes, urine output, and pain. Escalate quickly for hypotension, confusion, fast breathing, reduced urine, spreading redness, or suspected sepsis."
    },
    {
        keys: ["pain", "analgesia", "comfort"],
        answer: "For pain management, assess location, severity, onset, triggers, vital signs, allergies, medication history, and functional impact. Use prescribed analgesia safely, reassess after intervention, and document the response."
    },
    {
        keys: ["pregnancy", "labor", "midwifery", "postpartum", "antenatal"],
        answer: "For maternal nursing, prioritize maternal vital signs, fetal wellbeing where applicable, bleeding, pain, contractions, danger signs, hydration, infection prevention, education, and timely referral for complications."
    }
];

function readJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
        return null;
    }
}

function cleanName(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.includes("@") ? text.split("@")[0] : text;
}

function getUserName() {
    const session = readJson("nurseprep_session");
    if (session?.name || session?.email) {
        return cleanName(session.name || session.email);
    }

    const users = readJson("nurseprep_users");
    const matchedUser = Array.isArray(users) && session?.userId
        ? users.find((user) => user.id === session.userId)
        : null;
    if (matchedUser?.name || matchedUser?.profile?.displayName || matchedUser?.email) {
        return cleanName(matchedUser.name || matchedUser.profile.displayName || matchedUser.email);
    }

    const stored = localStorage.getItem("gnp_current_user");
    if (stored) {
        try {
            const user = JSON.parse(stored);
            return cleanName(user.name || user.fullName || user.email);
        } catch {
            return "";
        }
    }

    return "there";
}

function greeting() {
    return `Hello ${getUserName()}, what can I help you with?`;
}

function nowLabel() {
    return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date());
}

function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory.slice(-80)));
}

function appendMessage(record, shouldSave = true) {
    const row = document.createElement("article");
    row.className = `purice-message-row ${record.role}`;
    row.dataset.search = `${record.text || ""} ${record.fileName || ""}`.toLowerCase();

    const bubble = document.createElement("div");
    bubble.className = `purice-message ${record.role}`;

    const body = document.createElement("span");
    body.textContent = record.text;
    bubble.appendChild(body);

    if (record.fileName) {
        const attachment = document.createElement("span");
        attachment.className = "purice-attachment";
        attachment.textContent = `Attached: ${record.fileName}`;
        bubble.appendChild(attachment);
    }

    const time = document.createElement("time");
    time.dateTime = record.timeIso || new Date().toISOString();
    time.textContent = record.time || nowLabel();
    bubble.appendChild(time);

    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToLatest();

    if (shouldSave) {
        chatHistory.push({
            role: record.role,
            text: record.text,
            fileName: record.fileName || "",
            time: time.textContent,
            timeIso: time.dateTime
        });
        saveHistory();
    }
}

function buildResponse(question) {
    const normalized = question.toLowerCase();
    const matched = [...knowledgeBase, ...broadTopics].find((item) => item.keys.some((key) => normalized.includes(key)));

    if (matched) {
        return matched.answer;
    }

    if (normalized.includes("hello") || normalized.includes("hi") || normalized.includes("hey")) {
        return `Hello ${getUserName()}. Ask me about courses, licensing exams, payments, assignments, research support, certificates, or study planning.`;
    }

    if (normalized.startsWith("what") || normalized.includes(" define ") || normalized.includes("meaning")) {
        return "Here is a clear way to approach it: define the term, connect it to patient assessment, explain why it matters clinically, then add nursing actions, patient education, and safety concerns. If you give me the exact topic, I can break it into exam-ready points.";
    }

    if (normalized.startsWith("how") || normalized.includes(" steps") || normalized.includes("procedure")) {
        return "Use a step-by-step nursing approach: assess the patient, confirm the indication, check safety risks, prepare equipment or learning materials, perform the action according to policy, monitor the response, document clearly, and escalate concerns early.";
    }

    if (normalized.startsWith("why")) {
        return "In nursing, the reason usually connects to patient safety, physiology, prevention of complications, evidence-based practice, or legal documentation. Tell me the exact concept and I will explain the clinical reason in simple terms.";
    }

    return "I can help with that. For the best answer, share the exact nursing topic, patient scenario, assignment question, drug calculation, or exam area. I will respond with: key idea, nursing assessment, priority actions, safety risks, and exam tips.";
}

function setTyping(isTyping) {
    typing.classList.toggle("hidden", !isTyping);
    if (isTyping) {
        scrollToLatest();
    }
}

function scrollToLatest() {
    requestAnimationFrame(() => {
        messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
    });
}

function ask(question) {
    const text = question.trim();
    if (!text) return;

    appendMessage({ role: "user", text });
    setTyping(true);

    window.setTimeout(() => {
        setTyping(false);
        appendMessage({ role: "bot", text: buildResponse(text) });
    }, Math.min(1100, Math.max(420, text.length * 14)));
}

function loadHistory() {
    try {
        chatHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
        chatHistory = [];
    }

    if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
        appendMessage({ role: "bot", text: greeting() });
        return;
    }

    chatHistory.forEach((message) => appendMessage(message, false));
    scrollToLatest();
}

function clearChat() {
    chatHistory = [];
    localStorage.removeItem(HISTORY_KEY);
    messages.innerHTML = "";
    appendMessage({ role: "bot", text: greeting() });
}

function updateActionButton() {
    const hasText = input.value.trim().length > 0;
    actionButton.classList.toggle("has-text", hasText);
    actionButton.type = "button";
    actionButton.setAttribute("aria-label", hasText ? "Send message" : "Start voice input");
}

function resizeInput() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
}

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved === "dark";
    document.body.classList.toggle("purice-dark", dark);
    themeButton.textContent = dark ? "Light" : "Dark";
    themeButton.setAttribute("aria-pressed", String(dark));
}

function toggleTheme() {
    const dark = !document.body.classList.contains("purice-dark");
    document.body.classList.toggle("purice-dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    themeButton.textContent = dark ? "Light" : "Dark";
    themeButton.setAttribute("aria-pressed", String(dark));
}

function initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener("start", () => {
        actionButton.classList.add("listening");
        actionButton.setAttribute("aria-label", "Listening");
    });

    recognition.addEventListener("result", (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        input.value = transcript;
        updateActionButton();
        resizeInput();
        input.focus();
    });

    recognition.addEventListener("end", () => {
        actionButton.classList.remove("listening");
        updateActionButton();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadHistory();
    initVoice();
    updateActionButton();
    resizeInput();
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
    updateActionButton();
    resizeInput();
    input.focus();
});

input.addEventListener("input", () => {
    updateActionButton();
    resizeInput();
});

input.addEventListener("focus", () => {
    document.body.classList.add("keyboard-active");
    scrollToLatest();
});

input.addEventListener("blur", () => {
    document.body.classList.remove("keyboard-active");
});

actionButton.addEventListener("click", () => {
    if (input.value.trim()) {
        ask(input.value);
        input.value = "";
        updateActionButton();
        resizeInput();
        input.focus();
        return;
    }

    if (recognition) {
        recognition.start();
        return;
    }

    input.focus();
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    appendMessage({
        role: "user",
        text: "I attached a learning file for support.",
        fileName: file.name
    });

    setTyping(true);
    window.setTimeout(() => {
        setTyping(false);
        appendMessage({
            role: "bot",
            text: "I have noted the attachment. For this browser demo, describe the exact question from the PDF or image and I will guide you. In production, this upload can connect to secure file review and admin support."
        });
    }, 650);

    fileInput.value = "";
});

clearButton.addEventListener("click", clearChat);
themeButton.addEventListener("click", toggleTheme);

document.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => ask(button.dataset.question || button.textContent));
});
