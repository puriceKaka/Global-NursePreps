(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const EMPTY_STATE = {
        courses: [],
        lecturers: [],
        groups: [],
        meetings: [],
        exams: [],
        resources: [],
        payments: []
    };

    let adminState = { ...EMPTY_STATE };
    const LECTURER_APPLICATIONS_KEY = "gnp_lecturers";
    const LECTURER_SERVER_RESET_KEY = "gnp_admin_lecturer_reset_20260729";

    function readSharedLecturers() {
        try {
            const value = JSON.parse(localStorage.getItem(LECTURER_APPLICATIONS_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function mergeLecturerApplications(state) {
        const merged = new Map();
        [...readSharedLecturers(), ...(state.lecturers || [])].forEach((lecturer) => {
            const key = String(lecturer.email || lecturer.id || "").trim().toLowerCase();
            if (!key) return;
            merged.set(key, { ...(merged.get(key) || {}), ...lecturer });
        });
        return { ...state, lecturers: Array.from(merged.values()) };
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function money(value) {
        return `KES ${Number(value || 0).toLocaleString()}`;
    }

    function recordTable(columns, rows, emptyMessage) {
        if (!rows.length) {
            return `<div class="table-empty">${escapeHtml(emptyMessage)}</div>`;
        }
        const template = `repeat(${columns.length}, minmax(0, 1fr))`;
        return `
            <div class="record-table" style="--table-columns:${template}">
                <div class="record-table-row record-table-head">${columns.map((column) => `<span>${escapeHtml(column.label)}</span>`).join("")}</div>
                ${rows.map((cells) => `<div class="record-table-row">${cells.map((cell) => `<div class="record-cell">${cell}</div>`).join("")}</div>`).join("")}
            </div>
        `;
    }

    function normalizeState(state) {
        const source = state && typeof state === "object" ? state : {};
        return {
            courses: Array.isArray(source.courses) ? source.courses : [],
            lecturers: Array.isArray(source.lecturers) ? source.lecturers : [],
            groups: Array.isArray(source.groups) ? source.groups : [],
            meetings: Array.isArray(source.meetings) ? source.meetings : [],
            exams: Array.isArray(source.exams) ? source.exams : [],
            resources: Array.isArray(source.resources) ? source.resources : [],
            payments: Array.isArray(source.payments) ? source.payments : []
        };
    }

    function setState(nextState) {
        adminState = normalizeState(nextState);
        return adminState;
    }

    function showApp() {
        document.body.classList.add("admin-authenticated");
        $("#adminAuth")?.classList.add("hidden");
        $("#adminApp")?.classList.remove("hidden");
        $("#adminLogout")?.classList.remove("hidden");
    }

    function showAuth(defaultMode = "login") {
        document.body.classList.remove("admin-authenticated");
        $("#adminAuth")?.classList.remove("hidden");
        $("#adminApp")?.classList.add("hidden");
        $("#adminLogout")?.classList.add("hidden");
        setAuthMode(defaultMode);
    }

    function setAuthMode(mode) {
        $("#adminLoginForm")?.classList.toggle("hidden", mode !== "login");
        $("#adminSetupForm")?.classList.toggle("hidden", mode !== "setup");
    }

    function activatePanel(panelId) {
        const target = String(panelId || "overview").replace(/^#/, "");
        const panel = document.getElementById(target);
        if (!panel?.classList.contains("panel")) return;
        $$(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.panel === target));
        $$(".panel").forEach((item) => item.classList.toggle("active", item.id === target));
    }

    async function loadAdminState() {
        const response = await window.GnpAdminApi.loadState();
        return setState(mergeLecturerApplications(normalizeState(response?.state || EMPTY_STATE)));
    }

    async function bootstrapDashboard() {
        await loadAdminState();
        if (window.GnpLearning?.refreshCourses) {
            await window.GnpLearning.refreshCourses();
        }
    }

    async function resetExistingLecturersOnce() {
        if (localStorage.getItem(LECTURER_SERVER_RESET_KEY) === "complete") return;

        localStorage.removeItem(LECTURER_APPLICATIONS_KEY);
        const nextState = { ...adminState, lecturers: [] };
        const response = await window.GnpAdminApi.saveState(nextState);
        setState(response?.state || nextState);
        localStorage.setItem(LECTURER_SERVER_RESET_KEY, "complete");
    }

    async function persistState(nextState) {
        try {
            const response = await window.GnpAdminApi.saveState(nextState);
            setState(response?.state || nextState);
            if (window.GnpLearning?.refreshCourses) {
                void window.GnpLearning.refreshCourses();
            }
            renderAll();
        } catch (error) {
            console.error("Failed to save admin state:", error);
        }
    }

    function slugify(value) {
        return String(value || "course")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "course";
    }

    function normalizeCourseFromForm({ material = null, videoAsset = null } = {}) {
        const existingId = $("#courseId")?.value || "";
        const existing = adminState.courses.find((course) => course.id === existingId) || {};
        const title = ($("#courseTitle")?.value || "").trim();
        const id = existingId || `admin-${slugify(title)}-${Date.now().toString(36)}`;
        const price = Number($("#coursePrice")?.value || 0);
        const category = ($("#courseCategory")?.value || "").trim();
        const videoUrl = ($("#courseVideoUrl")?.value || "").trim();
        const generatedLessons = material?.generatedLessons?.length
            ? material.generatedLessons
            : (existing.generatedLessons || []);
        return {
            ...existing,
            id,
            title,
            unit: category,
            category,
            difficulty: $("#courseLevel")?.value || "Beginner",
            access: $("#courseAccess")?.value || (price > 0 ? "paid" : "free"),
            price,
            summary: ($("#courseSummary")?.value || "").trim(),
            badge: price > 0 ? "Paid" : "Free",
            durationHours: Math.max(1, generatedLessons.length * 2 || Number(existing.durationHours || 12)),
            questions: Number(existing.questions || 0),
            exams: Number(existing.exams || 0),
            format: generatedLessons.length ? "Uploaded learning materials" : "Self-paced",
            image: existing.image || "assets/course-images/default.jpg",
            moduleCount: generatedLessons.length || Number(existing.moduleCount || 1),
            moduleTitles: material?.moduleTitles?.length ? material.moduleTitles : (existing.moduleTitles || []),
            contentNotes: material?.extractedNotes || existing.contentNotes || "",
            uploadedDocument: material || existing.uploadedDocument || null,
            generatedLessons,
            resources: material
                ? [material, ...(existing.resources || []).filter((item) => item.storagePath !== material.storagePath)]
                : (existing.resources || []),
            lectureVideo: videoAsset?.link || videoUrl || existing.lectureVideo || "",
            lectureVideoName: videoAsset?.name || existing.lectureVideoName || "",
            lectureVideoSource: videoAsset?.storagePath || videoAsset?.name || videoUrl || existing.lectureVideoSource || "",
            lectureVideoAsset: videoAsset || existing.lectureVideoAsset || null,
            status: "published",
            source: "admin"
        };
    }

    async function saveCourse(event) {
        event.preventDefault();
        const message = $("#courseAdminMessage");
        try {
            if (message) {
                message.textContent = "Preparing course…";
                message.className = "form-message";
            }
            const title = ($("#courseTitle")?.value || "").trim();
            const existingId = $("#courseId")?.value || "";
            const courseId = existingId || `admin-${slugify(title)}-${Date.now().toString(36)}`;
            const materialFile = $("#courseMaterial")?.files?.[0] || null;
            const videoFile = $("#courseVideo")?.files?.[0] || null;
            const material = materialFile
                ? await window.GnpCourseMaterials.processDocument(materialFile, { courseId })
                : null;
            const videoAsset = videoFile
                ? await window.GnpCourseMaterials.processVideo(videoFile, { courseId })
                : null;
            const nextCourse = normalizeCourseFromForm({ material, videoAsset });
            nextCourse.id = courseId;
            const exists = adminState.courses.some((course) => course.id === nextCourse.id);
            const nextCourses = exists
                ? adminState.courses.map((course) => (course.id === nextCourse.id ? { ...course, ...nextCourse } : course))
                : [nextCourse, ...adminState.courses];

            await window.GnpAdminApi.saveCourses(nextCourses);
            setState({ ...adminState, courses: nextCourses });
            event.currentTarget.reset();
            $("#courseId").value = "";
            if ($("#coursePrice")) $("#coursePrice").value = "0";
            renderAll();
            if (window.GnpLearning?.refreshCourses) {
                void window.GnpLearning.refreshCourses();
            }
            if (message) {
                message.textContent = `"${nextCourse.title}" is published in the course catalog.`;
                message.className = "form-message success";
            }
        } catch (error) {
            console.error("Failed to save course:", error);
            if (message) {
                message.textContent = error?.message || "Unable to publish the course.";
                message.className = "form-message error";
            }
        }
    }

    function renderStats() {
        const courses = adminState.courses;
        const lecturers = adminState.lecturers;
        const exams = adminState.exams;
        const payments = adminState.payments;
        const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const approvedLecturers = lecturers.filter((item) => String(item.status || "").toLowerCase() === "approved").length;
        const pendingLecturers = lecturers.length - approvedLecturers;
        const pendingExams = exams.filter((item) => !["approved", "needs revision"].includes(String(item.status || "").toLowerCase())).length;

        $("#adminStats").innerHTML = [
            ["▣", "Published courses", courses.length, "Available to students"],
            ["♟", "Active lecturers", approvedLecturers, `${pendingLecturers} awaiting review`],
            ["▤", "Exam submissions", exams.length, `${pendingExams} awaiting review`],
            ["₭", "Recorded revenue", money(totalRevenue), `${payments.length} payment records`]
        ].map(([icon, label, value, note]) => `
            <article class="stat-card">
                <span class="stat-icon">${escapeHtml(icon)}</span>
                <div><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>
            </article>
        `).join("");
    }

    function renderDashboardInsights() {
        const pendingLecturers = adminState.lecturers.filter((item) => !["approved", "rejected", "suspended"].includes(String(item.status || "").toLowerCase()));
        const pendingExams = adminState.exams.filter((item) => !["approved", "needs revision"].includes(String(item.status || "").toLowerCase()));
        const pendingPayments = adminState.payments.filter((item) => !["paid", "completed", "approved"].includes(String(item.status || "").toLowerCase()));
        const attention = [
            pendingLecturers.length && ["lecturers", "Lecturer approvals", `${pendingLecturers.length} application${pendingLecturers.length === 1 ? "" : "s"} waiting`, "Review"],
            pendingExams.length && ["exams", "Submitted exams", `${pendingExams.length} assessment${pendingExams.length === 1 ? "" : "s"} waiting`, "Review"],
            pendingPayments.length && ["payments", "Payment records", `${pendingPayments.length} payment${pendingPayments.length === 1 ? "" : "s"} need checking`, "Open"]
        ].filter(Boolean);

        $("#attentionCount").textContent = String(attention.length);
        $("#adminAttentionList").innerHTML = attention.map(([panel, title, detail, action]) => `
            <button type="button" class="operation-row" data-open-panel="${panel}">
                <span class="operation-dot"></span>
                <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span>
                <b>${escapeHtml(action)} →</b>
            </button>
        `).join("") || `<div class="dashboard-empty"><span>✓</span><div><strong>Everything is up to date</strong><small>No approvals or reviews are waiting.</small></div></div>`;

        const activity = [
            ...adminState.courses.slice(0, 2).map((item) => ["courses", "Course published", item.title || "Untitled course"]),
            ...adminState.lecturers.slice(0, 2).map((item) => ["lecturers", "Lecturer record", item.name || item.email || "Lecturer"]),
            ...adminState.exams.slice(0, 2).map((item) => ["exams", "Exam submitted", item.title || "Untitled exam"]),
            ...adminState.payments.slice(0, 2).map((item) => ["payments", "Payment recorded", `${item.item || "Payment"} · ${money(item.amount)}`])
        ].slice(0, 6);

        $("#adminActivityList").innerHTML = activity.map(([panel, title, detail]) => `
            <button type="button" class="operation-row activity-row" data-open-panel="${panel}">
                <span class="activity-icon">•</span>
                <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span>
                <b>View →</b>
            </button>
        `).join("") || `<div class="dashboard-empty"><span>◎</span><div><strong>No activity yet</strong><small>Courses, approvals, exams, and payments will appear here.</small></div></div>`;
    }

    function renderCourses() {
        const rows = adminState.courses.map((course) => {
            const access = course.access || (Number(course.price || 0) > 0 ? "paid" : "free");
            return [
                `<strong>${escapeHtml(course.title)}</strong><small>${escapeHtml(course.summary || "No summary")}</small>`,
                escapeHtml(course.category || course.unit || "Nursing"),
                `<span class="status-pill">${escapeHtml(access.toUpperCase())}</span>`,
                `<strong>${money(course.price)}</strong>`,
                escapeHtml(course.lecturer || "Not assigned"),
                `<div class="data-actions table-actions">
                    <a class="table-link" href="EXAMINATION%20PREP%20SITE/course-workspace.html?courseId=${encodeURIComponent(course.id)}">View course</a>
                    <button type="button" data-edit-course="${escapeHtml(course.id)}">Edit</button>
                    <button type="button" class="danger-button" data-delete-course="${escapeHtml(course.id)}">Delete</button>
                </div>`
            ];
        });
        $("#adminCourseList").innerHTML = recordTable(
            [{ label: "Course", width: "minmax(260px, 2fr)" }, { label: "Area" }, { label: "Access", width: "110px" }, { label: "Price", width: "120px" }, { label: "Lecturer" }, { label: "Actions", width: "minmax(260px, auto)" }],
            rows,
            "No courses saved yet."
        );
    }

    function renderLecturers() {
        const byEmail = new Map();
        adminState.lecturers.forEach((lecturer) => {
            const key = String(lecturer.email || lecturer.id).toLowerCase();
            const existing = byEmail.get(key);
            if (!existing || existing.status !== "approved") {
                byEmail.set(key, lecturer);
            }
        });
        const lecturers = Array.from(byEmail.values());
        $("#lecturerList").innerHTML = recordTable(
            [{ label: "Lecturer", width: "minmax(220px, 1.5fr)" }, { label: "Email", width: "minmax(220px, 1.5fr)" }, { label: "Status" }, { label: "Subscription" }, { label: "Actions", width: "220px" }],
            lecturers.map((lecturer) => [
                `<strong>${escapeHtml(lecturer.name || "Lecturer")}</strong>`,
                escapeHtml(lecturer.email),
                `<span class="status-pill">${escapeHtml(lecturer.status || "pending")}</span>`,
                `<span class="status-pill">${escapeHtml(lecturer.subscription || "No plan")}</span>`,
                `<div class="data-actions table-actions">
                    <button type="button" data-lecturer-status="${escapeHtml(lecturer.id)}" data-status="approved">Approve</button>
                    <button type="button" data-lecturer-status="${escapeHtml(lecturer.id)}" data-status="suspended">Suspend</button>
                </div>`
            ]),
            "No lecturer applications yet."
        );
    }

    function renderLectures() {
        const lectureCards = adminState.meetings.map((meeting) => `
            <article class="data-card">
                <h3>${escapeHtml(meeting.title)}</h3>
                <p class="muted">${escapeHtml(meeting.groupName)} • ${escapeHtml(meeting.date || "Date pending")}</p>
                <p>Lecturer: ${escapeHtml(meeting.lecturerName || "Lecturer")}</p>
                ${meeting.link ? `<p><a href="${escapeHtml(meeting.link)}" target="_blank" rel="noopener">Open lecture link</a></p>` : ""}
            </article>
        `);
        const resourceCards = adminState.resources.map((resource) => `
            <article class="data-card">
                <h3>${escapeHtml(resource.title)}</h3>
                <p class="muted">${escapeHtml(resource.courseTitle)} • ${escapeHtml(resource.type)}</p>
                <p>Lecturer: ${escapeHtml(resource.lecturerName || "Lecturer")}</p>
                ${resource.link ? `<p><a href="${escapeHtml(resource.link)}" target="_blank" rel="noopener">Open resource</a></p>` : ""}
            </article>
        `);
        $("#lectureList").innerHTML = [...lectureCards, ...resourceCards].join("") || `<article class="data-card empty-card"><p class="muted">Scheduled lectures and uploaded resources will appear here.</p></article>`;
    }

    function renderGroups() {
        $("#groupList").innerHTML = recordTable(
            [{ label: "Group", width: "minmax(220px, 1.5fr)" }, { label: "Course" }, { label: "Lecturer" }, { label: "Access" }, { label: "Students" }, { label: "Limit" }],
            adminState.groups.map((group) => [
                `<strong>${escapeHtml(group.name)}</strong>`,
                escapeHtml(group.courseTitle),
                escapeHtml(group.lecturerName),
                `<span class="status-pill">${escapeHtml(group.access)}</span>`,
                escapeHtml(group.members?.length || 0),
                escapeHtml(group.limit)
            ]),
            "Lecturer membership groups will appear here."
        );
    }

    function renderExams() {
        $("#examList").innerHTML = recordTable(
            [{ label: "Exam", width: "minmax(220px, 1.5fr)" }, { label: "Course" }, { label: "Lecturer" }, { label: "Questions" }, { label: "Duration" }, { label: "Status" }, { label: "Actions", width: "220px" }],
            adminState.exams.map((exam) => [
                `<strong>${escapeHtml(exam.title)}</strong><small>${escapeHtml(exam.instructions || "")}</small>`,
                escapeHtml(exam.courseTitle),
                escapeHtml(exam.lecturerName),
                escapeHtml(exam.questions),
                `${escapeHtml(exam.duration)} min`,
                `<span class="status-pill">${escapeHtml(exam.status || "submitted")}</span>`,
                `<div class="data-actions table-actions">
                    <button type="button" data-exam-status="${escapeHtml(exam.id)}" data-status="approved">Approve</button>
                    <button type="button" data-exam-status="${escapeHtml(exam.id)}" data-status="needs revision">Needs revision</button>
                </div>`
            ]),
            "Submitted exams will appear here for review."
        );
    }

    function renderPayments() {
        $("#paymentList").innerHTML = recordTable(
            [{ label: "Customer" }, { label: "Role" }, { label: "Item", width: "minmax(240px, 1.5fr)" }, { label: "Method" }, { label: "Reference" }, { label: "Amount" }, { label: "Status" }, { label: "Date" }],
            adminState.payments.map((payment) => [
                `<strong>${escapeHtml(payment.payerName)}</strong>`,
                escapeHtml(payment.payerRole),
                escapeHtml(payment.item),
                escapeHtml(payment.method),
                escapeHtml(payment.reference || "—"),
                `<strong>${money(payment.amount)}</strong>`,
                `<span class="status-pill">${escapeHtml(payment.status)}</span>`,
                escapeHtml(payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "—")
            ]),
            "Payment records will appear here after students or lecturers pay."
        );
    }

    function renderAssessmentControl() {
        const control = window.GnpAssessmentControl;
        if (!control) return;
        const students = control.listStudents();
        const attempts = control.listAttempts();
        const now = Date.now();

        $("#studentConductList").innerHTML = students.map((student) => {
            const violations = attempts
                .filter((attempt) => attempt.studentId === student.id)
                .reduce((sum, attempt) => sum + Number(attempt.violations?.length || 0), 0);
            return `
                <article class="data-card">
                    <h3>${escapeHtml(student.name || "Student")}</h3>
                    <p class="muted">${escapeHtml(student.email || student.id)}</p>
                    <p><span class="status-pill">${escapeHtml(student.status || "active")}</span> <span class="status-pill">${violations} violation${violations === 1 ? "" : "s"}</span></p>
                    ${student.suspensionReason ? `<p>${escapeHtml(student.suspensionReason)}</p>` : ""}
                    <div class="data-actions">
                        <button type="button" data-student-action="active" data-student-id="${escapeHtml(student.id)}">Restore access</button>
                        <button type="button" class="danger-button" data-student-action="suspended" data-student-id="${escapeHtml(student.id)}">Suspend</button>
                    </div>
                </article>
            `;
        }).join("") || `<article class="data-card empty-card"><p class="muted">Students appear here when they enter an assessment.</p></article>`;

        $("#adminAttemptList").innerHTML = attempts
            .filter((attempt) => ["active", "reopened"].includes(attempt.status))
            .map((attempt) => {
                const lastSeen = Date.parse(attempt.lastSeenAt || "");
                const connected = Number.isFinite(lastSeen) && now - lastSeen < 15000;
                return `
                    <article class="data-card live-attempt">
                        <h3>${escapeHtml(attempt.studentName)} — ${escapeHtml(attempt.examTitle)}</h3>
                        <p><span class="status-pill">${connected ? "Online" : "Disconnected"}</span> <span class="status-pill">Camera: ${escapeHtml(attempt.cameraStatus || "unknown")}</span></p>
                        <p class="muted">Question ${escapeHtml(attempt.currentQuestion || 1)} · ${escapeHtml(attempt.answeredCount || 0)} answered · ${escapeHtml(attempt.violations?.length || 0)} alerts</p>
                        <div class="data-actions"><button type="button" class="danger-button" data-attempt-action="lock" data-attempt-id="${escapeHtml(attempt.id)}">Stop attempt</button></div>
                    </article>
                `;
            }).join("") || `<article class="data-card empty-card"><p class="muted">No students are taking an exam right now.</p></article>`;

        $("#adminResultsList").innerHTML = attempts
            .filter((attempt) => ["submitted", "terminated", "locked", "published"].includes(attempt.status))
            .map((attempt) => `
                <article class="data-card">
                    <h3>${escapeHtml(attempt.studentName)} — ${escapeHtml(attempt.examTitle)}</h3>
                    <p><strong>${escapeHtml(attempt.score ?? "Pending")}${Number.isFinite(Number(attempt.score)) ? "%" : ""}</strong> <span class="status-pill">${escapeHtml(attempt.status)}</span></p>
                    <p class="muted">${escapeHtml(attempt.answeredCount || 0)} of ${escapeHtml(attempt.totalQuestions || 0)} answered · ${escapeHtml(attempt.violations?.length || 0)} violations</p>
                    ${attempt.terminationReason ? `<p class="course-notes-preview">${escapeHtml(attempt.terminationReason)}</p>` : ""}
                    <div class="data-actions">
                        <button type="button" data-attempt-action="publish" data-attempt-id="${escapeHtml(attempt.id)}">Publish result</button>
                        <button type="button" data-attempt-action="reopen" data-attempt-id="${escapeHtml(attempt.id)}">Allow retake</button>
                    </div>
                </article>
            `).join("") || `<article class="data-card empty-card"><p class="muted">Completed exam submissions will appear here.</p></article>`;
    }

    function renderAll() {
        renderStats();
        renderDashboardInsights();
        renderCourses();
        renderLecturers();
        renderLectures();
        renderExams();
        renderGroups();
        renderPayments();
        renderAssessmentControl();
    }

    async function updateLecturerStatus(lecturerId, status) {
        const lecturers = adminState.lecturers.map((lecturer) => (
            lecturer.id === lecturerId ? { ...lecturer, status } : lecturer
        ));
        const selected = lecturers.find((lecturer) => lecturer.id === lecturerId);
        const shared = readSharedLecturers().map((lecturer) => (
            lecturer.id === lecturerId
            || String(lecturer.email || "").toLowerCase() === String(selected?.email || "").toLowerCase()
                ? { ...lecturer, status, reviewedAt: new Date().toISOString() }
                : lecturer
        ));
        localStorage.setItem(LECTURER_APPLICATIONS_KEY, JSON.stringify(shared));
        await persistState({ ...adminState, lecturers });
    }

    async function updateExamStatus(examId, status) {
        const exams = adminState.exams.map((exam) => (
            exam.id === examId ? { ...exam, status } : exam
        ));
        await persistState({ ...adminState, exams });
    }

    function handleClicks(event) {
        const panelShortcut = event.target.closest("[data-open-panel]");
        if (panelShortcut) {
            activatePanel(panelShortcut.dataset.openPanel);
            window.history.replaceState(null, "", `#${panelShortcut.dataset.openPanel}`);
            return;
        }

        const tab = event.target.closest(".tab-button");
        if (tab) {
            activatePanel(tab.dataset.panel);
            window.history.replaceState(null, "", `#${tab.dataset.panel}`);
            return;
        }

        const editId = event.target.dataset.editCourse;
        if (editId) {
            const course = adminState.courses.find((item) => item.id === editId);
            if (!course) return;
            $("#courseId").value = course.id || "";
            $("#courseTitle").value = course.title || "";
            $("#courseCategory").value = course.category || "";
            $("#courseLevel").value = course.difficulty || "Beginner";
            $("#courseAccess").value = course.access || (Number(course.price || 0) > 0 ? "paid" : "free");
            $("#coursePrice").value = Number(course.price || 0);
            $("#courseSummary").value = course.summary || "";
            $("#courseVideoUrl").value = /^https?:/i.test(course.lectureVideo || "") ? course.lectureVideo : "";
            $("#courseAdminForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        const deleteId = event.target.dataset.deleteCourse;
        if (deleteId) {
            void (async () => {
                try {
                    const courses = adminState.courses.filter((course) => course.id !== deleteId);
                    await window.GnpAdminApi.saveCourses(courses);
                    setState({ ...adminState, courses });
                    renderAll();
                    if (window.GnpLearning?.refreshCourses) {
                        void window.GnpLearning.refreshCourses();
                    }
                } catch (error) {
                    console.error("Failed to delete course:", error);
                }
            })();
            return;
        }

        const lecturerId = event.target.dataset.lecturerStatus;
        if (lecturerId) {
            void updateLecturerStatus(lecturerId, event.target.dataset.status);
            return;
        }

        const examId = event.target.dataset.examStatus;
        if (examId) {
            void updateExamStatus(examId, event.target.dataset.status);
            return;
        }

        const studentAction = event.target.dataset.studentAction;
        const studentId = event.target.dataset.studentId;
        if (studentAction && studentId) {
            const reason = studentAction === "suspended"
                ? (window.prompt("Reason for suspending this student:", "Assessment misconduct") || "Assessment misconduct")
                : "";
            window.GnpAssessmentControl?.setStudentStatus(studentId, studentAction, reason);
            renderAssessmentControl();
            return;
        }

        const attemptAction = event.target.dataset.attemptAction;
        const attemptId = event.target.dataset.attemptId;
        if (attemptAction && attemptId) {
            if (attemptAction === "reopen") window.GnpAssessmentControl?.reopenAttempt(attemptId);
            if (attemptAction === "publish") window.GnpAssessmentControl?.updateAttempt(attemptId, { status: "published", publishedAt: new Date().toISOString() });
            if (attemptAction === "lock") window.GnpAssessmentControl?.updateAttempt(attemptId, { status: "locked", terminationReason: "Stopped by administrator" });
            renderAssessmentControl();
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const email = ($("#adminEmail")?.value || "").trim().toLowerCase();
        const password = $("#adminPassword")?.value || "";
        const message = $("#adminLoginMessage");

        const passwordCheck = window.GnpAuthSecurity?.validatePassword(password);
        if (!email || !passwordCheck?.ok) {
            if (message) {
                message.textContent = !email ? "Enter an admin email." : passwordCheck.message;
                message.className = "form-message error";
            }
            return;
        }

        try {
            await window.GnpAdminApi.login({ email, password });
            await bootstrapDashboard();
            await resetExistingLecturersOnce();
            showApp();
            activatePanel(window.location.hash || "overview");
            event.currentTarget.reset();
            if (message) {
                message.textContent = "Admin session ready.";
                message.className = "form-message success";
            }
        } catch (error) {
            if (message) {
                message.textContent = error.message || "The admin email or password is incorrect.";
                message.className = "form-message error";
            }
        }
    }

    async function handleSetup(event) {
        event.preventDefault();
        const name = ($("#adminSetupName")?.value || "").trim();
        const email = ($("#adminSetupEmail")?.value || "").trim().toLowerCase();
        const password = $("#adminSetupPassword")?.value || "";
        const message = $("#adminSetupMessage");

        const passwordCheck = window.GnpAuthSecurity?.validatePassword(password);
        if (!name || !email || !passwordCheck?.ok) {
            if (message) {
                message.textContent = !name ? "Enter the administrator name." : !email ? "Enter an admin email." : passwordCheck.message;
                message.className = "form-message error";
            }
            return;
        }

        try {
            await window.GnpAdminApi.bootstrap({ name, email, password });
            await bootstrapDashboard();
            await resetExistingLecturersOnce();
            showApp();
            activatePanel(window.location.hash || "overview");
            event.currentTarget.reset();
            if (message) {
                message.textContent = "Admin account created and signed in.";
                message.className = "form-message success";
            }
        } catch (error) {
            if (message) {
                message.textContent = error.message || "Unable to create the admin account.";
                message.className = "form-message error";
            }
        }
    }

    async function main() {
        // Portal sessions are intentionally page-lifetime only. A reload or a new
        // visit must return the administrator to the login form.
        try {
            await window.GnpAdminApi.logout();
        } catch {
            localStorage.removeItem("gnp_admin_session");
        }

        $$(".tab-button").forEach((button) => {
            const label = button.querySelector("span:nth-child(2)")?.textContent?.trim();
            if (label) {
                button.title = label;
                button.setAttribute("aria-label", label);
            }
        });
        setAuthMode("login");
        $("#adminLoginForm")?.addEventListener("submit", handleLogin);
        $("#adminSetupForm")?.addEventListener("submit", handleSetup);
        $("#showAdminSetup")?.addEventListener("click", () => setAuthMode("setup"));
        $("#showAdminLogin")?.addEventListener("click", () => setAuthMode("login"));
        $("#courseAdminForm")?.addEventListener("submit", saveCourse);
        $("#toggleAdminCourses")?.addEventListener("click", (event) => {
            const list = $("#adminCourseList");
            if (!list) return;
            const hidden = list.classList.toggle("hidden");
            event.currentTarget.textContent = hidden ? "Show saved courses" : "Hide saved courses";
        });
        $("#seedDataBtn")?.addEventListener("click", async () => {
            try {
                await window.GnpAdminApi.seedState();
                await bootstrapDashboard();
                renderAll();
            } catch (error) {
                console.error("Failed to seed admin data:", error);
            }
        });
        $("#adminLogout")?.addEventListener("click", async () => {
            await window.GnpAdminApi.logout();
            showAuth();
        });
        window.addEventListener("storage", (event) => {
            if (event.key === LECTURER_APPLICATIONS_KEY) {
                setState(mergeLecturerApplications(adminState));
                renderAll();
            }
            if ([window.GnpAssessmentControl?.KEYS.attempts, window.GnpAssessmentControl?.KEYS.students].includes(event.key)) {
                renderAssessmentControl();
            }
        });
        window.addEventListener("gnp:assessment-updated", renderAssessmentControl);
        document.addEventListener("click", handleClicks);

        showAuth("login");
    }

    document.addEventListener("DOMContentLoaded", main);
})();
