document.addEventListener("DOMContentLoaded", () => {
    const session = JSON.parse(localStorage.getItem("nurseprep_session") || "null");
    const currentUser = {
        id: session?.userId || "student-001",
        role: session?.role || "student",
        classId: session?.classId || "nck-cohort-a",
        courseIds: session?.courseIds || ["nck-masterclass", "pharmacology-intensive"]
    };

    let selectedExamId = null;
    let activeStatus = "upcoming";
    let cameraReady = false;
    let micReady = false;
    let internetReady = navigator.onLine;
    let browserLockReady = true;
    let faceVerified = false;

    const assignedExams = seedAssignedExams();
    const trackerContent = document.getElementById("tracker-content");
    const startButton = document.getElementById("start-exam-btn");
    const consentCheckbox = document.getElementById("consent-checkbox");
    const fileInput = document.getElementById("fileElem");
    const generateButton = document.getElementById("generate-btn");
    const previewDiv = document.getElementById("generated-questions-preview");
    const dropArea = document.getElementById("drop-area");

    wireExamTabs();
    wireBuilder();
    wireUploadGenerator();
    renderStudentDashboard();
    renderInstructions();
    renderLecturerPanel();
    renderAdminPanel();
    startSystemChecks();
    revealElements(document.querySelectorAll(".card, .lobby-hero, .role-strip"));

    function seedAssignedExams() {
        return [
            {
                id: "lec-nclex-supervised-1",
                title: "Supervised NCLEX-RN Mock",
                status: "upcoming",
                mode: "real",
                ownerRole: "lecturer",
                owner: "Clinical Exam Team",
                assignedTo: ["student-001", "nck-cohort-a"],
                category: "NCLEX Preparation",
                schedule: "May 15, 2026 10:00 AM",
                deadline: "May 15, 2026 12:00 PM",
                duration: 120,
                questionCount: 100,
                passMark: 72,
                published: true,
                randomized: true,
                grading: "Auto + essay review",
                attempts: 1,
                instructions: [
                    "Enter only when the session is authorized.",
                    "Keep camera and microphone enabled throughout the exam.",
                    "Do not switch tabs, copy, paste, right-click, or leave fullscreen.",
                    "Answers auto-save and the exam auto-submits when time expires."
                ],
                questionBank: buildSampleQuestions("nclex")
            },
            {
                id: "admin-pharm-supervised",
                title: "Pharmacology Proctored Exam",
                status: "active",
                mode: "real",
                ownerRole: "admin",
                owner: "Exams Office",
                assignedTo: ["student-001", "pharmacology-intensive"],
                category: "Pharmacology",
                schedule: "Open now",
                deadline: "May 18, 2026 03:00 PM",
                duration: 60,
                questionCount: 60,
                passMark: 75,
                published: true,
                randomized: true,
                grading: "Automatic objective marking",
                attempts: 1,
                instructions: [
                    "This is an official proctored pharmacology exam.",
                    "Use only the exam interface and approved calculator if provided.",
                    "Suspicious activity is logged for review.",
                    "Objective questions are graded automatically after submission."
                ],
                questionBank: buildSampleQuestions("pharmacology")
            },
            {
                id: "practice-orientation",
                title: "Secure Exam Orientation Practice",
                status: "active",
                mode: "practice",
                ownerRole: "lecturer",
                owner: "Clinical Skills Team",
                assignedTo: ["student-001", "nck-cohort-a"],
                category: "Exam Readiness",
                schedule: "Always available",
                deadline: "No deadline",
                duration: 20,
                questionCount: 12,
                passMark: 60,
                published: true,
                randomized: false,
                grading: "Practice feedback",
                attempts: 3,
                instructions: [
                    "Practice mode helps you learn the secure exam interface.",
                    "Violations are shown as warnings but do not affect official scores.",
                    "Use this before sitting secure exams."
                ],
                questionBank: buildSampleQuestions("practice")
            },
            {
                id: "maternal-completed",
                title: "Maternal Health Supervised Exam",
                status: "completed",
                mode: "real",
                ownerRole: "lecturer",
                owner: "Maternal Health Team",
                assignedTo: ["student-001"],
                category: "Maternal Nursing",
                schedule: "April 28, 2026 09:00 AM",
                deadline: "April 28, 2026 10:00 AM",
                duration: 60,
                questionCount: 45,
                passMark: 70,
                published: true,
                resultPublished: false,
                score: "Pending grading",
                grading: "Essay review pending",
                attempts: 1,
                instructions: []
            },
            {
                id: "admin-surg-graded",
                title: "Surgical Nursing Proctored Exam",
                status: "graded",
                mode: "real",
                ownerRole: "admin",
                owner: "Exams Office",
                assignedTo: ["student-001"],
                category: "Surgical Nursing",
                schedule: "April 15, 2026 02:00 PM",
                deadline: "April 15, 2026 03:30 PM",
                duration: 90,
                questionCount: 70,
                passMark: 70,
                published: true,
                score: "92%",
                grading: "Published",
                attempts: 1,
                instructions: []
            }
        ];
    }

    function wireRolePanels() {
        if (!document.querySelector(".role-btn")) {
            return;
        }

        document.querySelectorAll(".role-btn").forEach((button) => {
            button.addEventListener("click", () => {
                document.querySelectorAll(".role-btn").forEach((item) => item.classList.remove("active"));
                document.querySelectorAll(".role-panel").forEach((panel) => panel.classList.remove("active"));
                button.classList.add("active");
                document.getElementById(button.dataset.rolePanel)?.classList.add("active");
            });
        });
    }

    function wireExamTabs() {
        document.querySelectorAll("[data-exam-status]").forEach((button) => {
            button.addEventListener("click", () => {
                activeStatus = button.dataset.examStatus;
                document.querySelectorAll("[data-exam-status]").forEach((item) => item.classList.remove("active"));
                button.classList.add("active");
                renderStudentDashboard();
            });
        });
    }

    function wireBuilder() {
        document.getElementById("exam-builder-form")?.addEventListener("submit", (event) => {
            event.preventDefault();
            const title = document.getElementById("builder-title").value.trim() || "Untitled Lecturer Exam";
            const duration = Number(document.getElementById("builder-duration").value || 60);
            previewDiv.innerHTML = `
                <h4>Published Draft</h4>
                <p><strong>${escapeHtml(title)}</strong> is ready for admin approval and assignment.</p>
                <ul>
                    <li>Duration: ${duration} minutes</li>
                    <li>Audience: ${escapeHtml(document.getElementById("builder-audience").value)}</li>
                    <li>Mode: ${escapeHtml(document.getElementById("builder-mode").value)}</li>
                </ul>
            `;
            renderAdminPanel();
        });
    }

    function wireUploadGenerator() {
        if (!fileInput || !generateButton || !previewDiv || !dropArea) {
            return;
        }

        fileInput.addEventListener("change", (event) => {
            const [file] = event.target.files;
            document.getElementById("file-name").textContent = file ? file.name : "No file selected";
            generateButton.disabled = !file;
            dropArea.classList.toggle("has-file", Boolean(file));
        });

        generateButton.addEventListener("click", () => {
            const fileName = document.getElementById("file-name").textContent;
            if (fileName === "No file selected") {
                alert("Please select a PDF, DOCX, or PPT file first.");
                return;
            }

            previewDiv.innerHTML = `<p>Generating draft questions from "<strong>${escapeHtml(fileName)}</strong>"...</p><div class="loading-spinner"></div>`;

            setTimeout(() => {
                previewDiv.innerHTML = `
                    <h4>AI Lecturer Draft Preview</h4>
                    <div class="draft-grid">
                        <article><strong>MCQ</strong><span>Which assessment finding indicates poor tissue perfusion?</span></article>
                        <article><strong>True/False</strong><span>Medication safety begins before administration.</span></article>
                        <article><strong>Essay</strong><span>Discuss nursing priorities for a deteriorating patient.</span></article>
                        <article><strong>Case Study</strong><span>Analyze cues and choose the safest first action.</span></article>
                    </div>
                    <p class="success-message">Draft generated for lecturer review, editing, assignment, and admin approval.</p>
                `;
                previewDiv.classList.add("is-ready");
            }, 1200);
        });

        ["dragenter", "dragover"].forEach((eventName) => {
            dropArea.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropArea.classList.add("is-dragover");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropArea.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropArea.classList.remove("is-dragover");
            });
        });

        dropArea.addEventListener("drop", (event) => {
            const allowed = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
            const [file] = Array.from(event.dataTransfer?.files || []).filter((item) => {
                const name = item.name.toLowerCase();
                return allowed.some((extension) => name.endsWith(extension));
            });
            if (!file || typeof DataTransfer === "undefined") {
                return;
            }

            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
            fileInput.dispatchEvent(new Event("change"));
        });
    }

    function renderStudentDashboard() {
        if (!trackerContent) {
            return;
        }

        const studentExams = assignedExams.filter((exam) => canAccessExam(exam));
        const examsForStatus = studentExams.filter((exam) => exam.status === activeStatus);
        setText("assigned-count", String(studentExams.length));
        setText("active-count", String(studentExams.filter((exam) => exam.status === "active").length));
        setText("graded-count", String(studentExams.filter((exam) => exam.status === "graded").length));

        selectedExamId = examsForStatus.some((exam) => exam.id === selectedExamId) ? selectedExamId : null;
        trackerContent.innerHTML = examsForStatus.length
            ? examsForStatus.map(renderExamCard).join("")
            : `<p class="no-items">No ${activeStatus} exams assigned to you right now.</p>`;

        trackerContent.querySelectorAll("[data-select-exam]").forEach((button) => {
            button.addEventListener("click", () => {
                selectedExamId = button.dataset.selectExam;
                renderStudentDashboard();
                renderInstructions();
                checkAllSystemsReady();
            });
        });

        trackerContent.querySelectorAll("[data-view-result]").forEach((button) => {
            button.addEventListener("click", () => {
                const exam = assignedExams.find((item) => item.id === button.dataset.viewResult);
                localStorage.setItem("submittedExamResults", JSON.stringify(buildPublishedResult(exam)));
                window.location.href = "../results/results.html";
            });
        });
    }

    function renderExamCard(exam) {
        const isSelected = selectedExamId === exam.id;
        const canStart = exam.status === "active" || exam.status === "upcoming";
        const statusLabel = exam.mode === "practice" ? "Practice Mode" : "Real Exam";
        return `
            <article class="tracker-item ${isSelected ? "selected" : ""}">
                <div class="tracker-copy">
                    <span><strong>${escapeHtml(exam.title)}</strong></span>
                    <span>${escapeHtml(exam.category)} · ${escapeHtml(exam.owner)}</span>
                    <span>${escapeHtml(exam.schedule)} · ${exam.duration} min · ${exam.questionCount} questions</span>
                    <span>${statusLabel} · ${exam.randomized ? "Randomized" : "Fixed order"} · ${escapeHtml(exam.grading)}</span>
                </div>
                <div class="tracker-actions">
                    ${canStart ? `<button class="btn-small" data-select-exam="${escapeHtml(exam.id)}">${isSelected ? "Selected" : "Select"}</button>` : ""}
                    ${exam.status === "graded" ? `<button class="btn-small" data-view-result="${escapeHtml(exam.id)}">View Result</button>` : ""}
                    ${exam.status === "completed" ? `<span class="status-chip">Awaiting publication</span>` : ""}
                </div>
            </article>
        `;
    }

    function renderInstructions() {
        const instructionsTarget = document.getElementById("exam-instructions");
        if (!instructionsTarget) {
            return;
        }

        const exam = assignedExams.find((item) => item.id === selectedExamId) || assignedExams.find((item) => item.status === "active" && canAccessExam(item));
        const instructions = exam?.instructions?.length ? exam.instructions : [
            "Select an assigned exam to view its specific instructions.",
            "Only assigned published exams can be opened here.",
            "Course module tests are completed in the course workspace."
        ];

        instructionsTarget.innerHTML = instructions
            .map((instruction, index) => `
                <article class="instruction-item">
                    <strong>${index + 1}</strong>
                    <span>${escapeHtml(instruction)}</span>
                </article>
            `)
            .join("");
    }

    function renderLecturerPanel() {
        const list = document.getElementById("lecturer-review-list");
        if (!list) {
            return;
        }

        list.innerHTML = [
            ["Maternal Health Supervised Exam", "12 essay responses need manual grading", "Review essays"],
            ["NCLEX-RN Mock", "Objective questions ready for auto-marking", "View analytics"],
            ["Pharmacology Proctored Exam", "3 violations flagged for review", "Open activity log"]
        ].map(([title, note, action]) => `
            <article class="review-item">
                <strong>${title}</strong>
                <span>${note}</span>
                <button class="btn-small">${action}</button>
            </article>
        `).join("");
    }

    function renderAdminPanel() {
        const metrics = document.getElementById("admin-metrics");
        const approvals = document.getElementById("approval-list");
        const securityLogs = document.getElementById("security-log-list");
        if (!metrics || !approvals || !securityLogs) {
            return;
        }

        metrics.innerHTML = [
            ["Users", "248"],
            ["Lecturers", "18"],
            ["Assigned Exams", String(assignedExams.length)],
            ["Security Logs", "27"]
        ].map(([label, value]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join("");

        approvals.innerHTML = [
            ["Maternal Health Supervised Test", "Pending approval", "Approve"],
            ["Pediatrics Case Study Exam", "Needs schedule confirmation", "Review"],
            ["Institution Pharmacology Mock", "Published", "Manage"]
        ].map(([title, note, action]) => `
            <article class="review-item">
                <strong>${title}</strong>
                <span>${note}</span>
                <button class="btn-small">${action}</button>
            </article>
        `).join("");

        securityLogs.innerHTML = [
            ["Tab switch", "student-001 · NCLEX-RN Mock · logged"],
            ["Camera permission denied", "student-018 · Pharmacology Exam · blocked"],
            ["Auto-submit", "student-042 · Maternal Health · time expired"]
        ].map(([title, note]) => `
            <article class="review-item">
                <strong>${title}</strong>
                <span>${note}</span>
            </article>
        `).join("");
    }

    function startSystemChecks() {
        if (!startButton || !consentCheckbox) {
            return;
        }

        markStatus("internet-status", internetReady ? "Ready" : "Offline", internetReady);
        markStatus("browser-status", "Ready", browserLockReady);

        window.addEventListener("online", () => {
            internetReady = true;
            markStatus("internet-status", "Ready", true);
            checkAllSystemsReady();
        });

        window.addEventListener("offline", () => {
            internetReady = false;
            markStatus("internet-status", "Offline", false);
            checkAllSystemsReady();
        });

        consentCheckbox.addEventListener("change", checkAllSystemsReady);

        const video = document.getElementById("camera-preview");
        if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    video.srcObject = stream;
                    video.play();
                    cameraReady = true;
                    micReady = true;
                    markStatus("camera-status", "Ready", true);
                    markStatus("mic-status", "Ready", true);
                    setTimeout(() => {
                        faceVerified = true;
                        document.getElementById("face-status").textContent = "Identity confirmed. You are ready to begin.";
                        document.getElementById("face-status").classList.add("verified");
                        checkAllSystemsReady();
                    }, 900);
                    checkAllSystemsReady();
                })
                .catch(() => {
                    cameraReady = false;
                    micReady = false;
                    faceVerified = false;
                    markStatus("camera-status", "Blocked", false);
                    markStatus("mic-status", "Blocked", false);
                    document.getElementById("face-status").textContent = "Camera and microphone access are required before exam start.";
                    checkAllSystemsReady();
                });
        } else {
            markStatus("camera-status", "Unsupported", false);
            markStatus("mic-status", "Unsupported", false);
            document.getElementById("face-status").textContent = "This browser does not support media capture.";
            checkAllSystemsReady();
        }
    }

    function checkAllSystemsReady() {
        if (!startButton || !consentCheckbox) {
            return;
        }

        const consentChecked = consentCheckbox.checked;
        const exam = assignedExams.find((item) => item.id === selectedExamId);
        const canLaunchStatus = exam && exam.status === "active";
        const allReady = cameraReady && micReady && internetReady && browserLockReady && faceVerified && canLaunchStatus && consentChecked;

        startButton.disabled = !allReady;
        startButton.onclick = allReady ? () => launchSelectedExam(exam) : null;
        startButton.textContent = allReady
            ? "Start Secure Exam"
            : exam && exam.status !== "active"
                ? "Exam Not Active Yet"
                : "Complete Checks to Start";
    }

    function launchSelectedExam(exam) {
        if (!exam || !canAccessExam(exam)) {
            alert("This exam is not assigned to your account.");
            return;
        }

        localStorage.setItem("activeExam", JSON.stringify({
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            scheduledAt: exam.schedule,
            mode: exam.mode,
            passMark: exam.passMark,
            owner: exam.owner,
            randomized: exam.randomized,
            questionBank: exam.questionBank || []
        }));
        localStorage.removeItem("submittedExamResults");
        window.location.href = exam.status === "graded" ? "../results/results.html" : exam.link || "../exam-interface/exam-interface.html";
    }

    function canAccessExam(exam) {
        return Array.isArray(exam.assignedTo) && (
            exam.assignedTo.includes(currentUser.id) ||
            exam.assignedTo.includes(currentUser.classId) ||
            currentUser.courseIds.some((courseId) => exam.assignedTo.includes(courseId))
        ) && exam.published !== false;
    }

    function buildPublishedResult(exam) {
        return {
            examTitle: exam?.title || "Published Exam Result",
            score: Number(String(exam?.score || "0").replace("%", "")) || 0,
            answeredCount: exam?.questionCount || 0,
            totalQuestions: exam?.questionCount || 0,
            strengths: ["Clinical prioritization", "Safety"],
            weakAreas: ["Essay detail"],
            performanceBreakdown: [
                { category: exam?.category || "Exam", score: Number(String(exam?.score || "0").replace("%", "")) || 0 }
            ],
            proctoringEvents: ["Result published by the exam team."],
            answerReview: []
        };
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
});

function buildSampleQuestions(type) {
    const shared = [
        {
            type: "mcq",
            category: "Priority Care",
            difficulty: "Application",
            prompt: "A patient becomes short of breath and restless. What should the nurse assess first?",
            options: ["Diet history", "Airway and breathing", "Discharge plan", "Family contact"],
            correctAnswer: "Airway and breathing",
            explanation: "Airway and breathing are immediate priorities when respiratory distress appears."
        },
        {
            type: "truefalse",
            category: "Exam Security",
            difficulty: "Foundational",
            prompt: "Tab switching during a secure exam may be logged as a violation.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "Secure exams monitor tab switches and focus changes."
        },
        {
            type: "fill",
            category: "Patient Safety",
            difficulty: "Foundational",
            prompt: "Fill in the blank: The first step before medication administration is patient ____.",
            correctAnswer: "identification",
            explanation: "Patient identification protects against medication errors."
        },
        {
            type: "essay",
            category: "Professional Practice",
            difficulty: "Essay",
            prompt: "Explain how a nurse should respond to a suspected exam or clinical safety violation.",
            expectedKeywords: ["report", "document", "safety", "policy"],
            explanation: "Essay responses can be marked manually by lecturers."
        },
        {
            type: "case",
            category: "Case Study",
            difficulty: "Priority",
            prompt: "Case: A patient has chest pain, sweating, and hypotension. Identify the priority nursing response.",
            expectedKeywords: ["assess", "vitals", "oxygen", "notify", "ecg"],
            explanation: "Case questions test cue recognition and safe first action."
        }
    ];

    if (type === "pharmacology") {
        shared[0].prompt = "Before giving digoxin, which action is most important?";
        shared[0].options = ["Check apical pulse", "Offer a snack", "Assist ambulation", "Give with milk"];
        shared[0].correctAnswer = "Check apical pulse";
    }

    return shared;
}

function markStatus(id, text, ready) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }

    element.textContent = text;
    element.style.color = ready ? "#20825f" : "#c54444";
    element.classList.toggle("status-ready", ready);
    element.classList.toggle("status-blocked", !ready);
}

function revealElements(elements) {
    const targets = Array.from(elements || []);
    if (!targets.length) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.transitionDelay = reduceMotion ? "0ms" : `${Math.min(index * 55, 280)}ms`;
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
        targets.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    targets.forEach((element) => observer.observe(element));
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
