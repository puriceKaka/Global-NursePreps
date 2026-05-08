(() => {
    const KEYS = {
        session: "gnp_lecturer_session",
        lecturers: "gnp_lecturers",
        groups: "gnp_membership_groups",
        meetings: "gnp_lecturer_meetings",
        exams: "gnp_lecturer_exams",
        resources: "gnp_lecturer_resources",
        payments: "gnp_payments"
    };

    const DEMO_EMAIL = "lecturer@globalnurseprep.com";
    const DEMO_PASSWORD = "teach123";

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    function readJson(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "");
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function uid(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
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

    function getSession() {
        return readJson(KEYS.session, null);
    }

    function getCourses() {
        if (window.GnpLearning?.getCourses) {
            return window.GnpLearning.getCourses();
        }
        return readJson("nurseprep_admin_courses", []);
    }

    function courseById(id) {
        return getCourses().find((course) => course.id === id) || null;
    }

    function ownItems(key) {
        const session = getSession();
        return readJson(key, []).filter((item) => item.lecturerId === session?.id);
    }

    function saveOwnItem(key, item) {
        const all = readJson(key, []);
        writeJson(key, [item, ...all]);
    }

    function registerLecturer(session) {
        const lecturers = readJson(KEYS.lecturers, []);
        const exists = lecturers.some((lecturer) => lecturer.id === session.id);
        if (exists) return;
        writeJson(KEYS.lecturers, [
            {
                id: session.id,
                name: session.name,
                email: session.email,
                status: "pending",
                subscription: "Not paid",
                createdAt: new Date().toISOString()
            },
            ...lecturers
        ]);
    }

    function showApp() {
        const session = getSession();
        $("#lecturerAuth")?.classList.add("hidden");
        $("#lecturerApp")?.classList.remove("hidden");
        $("#lecturerLogout")?.classList.remove("hidden");
        $("#lecturerDisplayName").textContent = session?.name || "Lecturer";
        $("#lecturerDisplayEmail").textContent = session?.email || "";
        populateCourseSelects();
        populateGroupSelect();
        renderAll();
    }

    function showAuth() {
        $("#lecturerAuth")?.classList.remove("hidden");
        $("#lecturerApp")?.classList.add("hidden");
        $("#lecturerLogout")?.classList.add("hidden");
    }

    function handleLogin(event) {
        event.preventDefault();
        const name = ($("#lecturerName")?.value || "").trim();
        const email = ($("#lecturerEmail")?.value || "").trim().toLowerCase();
        const password = $("#lecturerPassword")?.value || "";
        const message = $("#lecturerLoginMessage");

        if (!name || !email || !password) {
            if (message) {
                message.textContent = "Enter lecturer name, email, and password.";
                message.className = "form-message error";
            }
            return;
        }

        if (email === DEMO_EMAIL && password !== DEMO_PASSWORD) {
            if (message) {
                message.textContent = "Incorrect demo lecturer password.";
                message.className = "form-message error";
            }
            return;
        }

        const session = {
            id: `lecturer_${email.replace(/[^a-z0-9]/g, "_")}`,
            role: "lecturer",
            name,
            email,
            loginAt: new Date().toISOString()
        };
        writeJson(KEYS.session, session);
        registerLecturer(session);
        showApp();
    }

    function populateCourseSelects() {
        const options = getCourses().map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join("");
        ["#groupCourse", "#examCourse", "#resourceCourse"].forEach((selector) => {
            const select = $(selector);
            if (select) select.innerHTML = options;
        });
    }

    function populateGroupSelect() {
        const groups = ownItems(KEYS.groups);
        const options = groups.length
            ? groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("")
            : `<option value="">Create a group first</option>`;
        const select = $("#meetingGroup");
        if (select) select.innerHTML = options;
    }

    function renderStats() {
        const groups = ownItems(KEYS.groups);
        const meetings = ownItems(KEYS.meetings);
        const exams = ownItems(KEYS.exams);
        const resources = ownItems(KEYS.resources);
        const payments = readJson(KEYS.payments, []).filter((payment) => payment.lecturerId === getSession()?.id);
        const joined = groups.reduce((sum, group) => sum + Number(group.members?.length || 0), 0);

        $("#lecturerStats").innerHTML = [
            ["Groups", groups.length],
            ["Students joined", joined],
            ["Meetings", meetings.length],
            ["Exams submitted", exams.length],
            ["Resources", resources.length],
            ["Payments", payments.length],
            ["Teaching status", currentLecturer()?.status || "pending"],
            ["Subscription", currentLecturer()?.subscription || "Not paid"]
        ].map(([label, value]) => `
            <article class="stat-card">
                <strong>${escapeHtml(value)}</strong>
                <span class="muted">${escapeHtml(label)}</span>
            </article>
        `).join("");
    }

    function currentLecturer() {
        const session = getSession();
        return readJson(KEYS.lecturers, []).find((lecturer) => lecturer.id === session?.id) || null;
    }

    function handlePayment(event) {
        event.preventDefault();
        const session = getSession();
        const plan = $("#lecturerPlan").value;
        const amount = plan === "institution" ? 7500 : 2500;
        const planName = plan === "institution" ? "Institution Lecturer" : "Professional Lecturer";
        saveOwnItem(KEYS.payments, {
            id: uid("payment"),
            lecturerId: session.id,
            payerRole: "lecturer",
            payerName: session.name,
            item: `${planName} Subscription`,
            method: $("#lecturerPaymentMethod").value,
            reference: $("#lecturerPaymentRef").value.trim(),
            amount,
            status: "recorded",
            createdAt: new Date().toISOString()
        });
        writeJson(KEYS.lecturers, readJson(KEYS.lecturers, []).map((lecturer) => (
            lecturer.id === session.id ? { ...lecturer, subscription: planName } : lecturer
        )));
        event.currentTarget.reset();
        renderAll();
    }

    function handleGroup(event) {
        event.preventDefault();
        const session = getSession();
        const course = courseById($("#groupCourse").value);
        saveOwnItem(KEYS.groups, {
            id: uid("group"),
            lecturerId: session.id,
            lecturerName: session.name,
            name: $("#groupName").value.trim(),
            courseId: course?.id || "",
            courseTitle: course?.title || "Course",
            access: $("#groupAccess").value,
            limit: Number($("#groupLimit").value || 0),
            members: [],
            createdAt: new Date().toISOString()
        });
        event.currentTarget.reset();
        populateGroupSelect();
        renderAll();
    }

    function handleMeeting(event) {
        event.preventDefault();
        const session = getSession();
        const group = ownItems(KEYS.groups).find((item) => item.id === $("#meetingGroup").value);
        saveOwnItem(KEYS.meetings, {
            id: uid("meeting"),
            lecturerId: session.id,
            lecturerName: session.name,
            title: $("#meetingTitle").value.trim(),
            groupId: group?.id || "",
            groupName: group?.name || "No group",
            date: $("#meetingDate").value,
            link: $("#meetingLink").value.trim(),
            createdAt: new Date().toISOString()
        });
        event.currentTarget.reset();
        renderAll();
    }

    function handleExam(event) {
        event.preventDefault();
        const session = getSession();
        const course = courseById($("#examCourse").value);
        saveOwnItem(KEYS.exams, {
            id: uid("exam"),
            lecturerId: session.id,
            lecturerName: session.name,
            title: $("#examTitle").value.trim(),
            courseId: course?.id || "",
            courseTitle: course?.title || "Course",
            questions: Number($("#examQuestions").value || 0),
            duration: Number($("#examDuration").value || 0),
            instructions: $("#examInstructions").value.trim(),
            status: "submitted",
            createdAt: new Date().toISOString()
        });
        event.currentTarget.reset();
        renderAll();
    }

    function handleResource(event) {
        event.preventDefault();
        const session = getSession();
        const course = courseById($("#resourceCourse").value);
        saveOwnItem(KEYS.resources, {
            id: uid("resource"),
            lecturerId: session.id,
            lecturerName: session.name,
            title: $("#resourceTitle").value.trim(),
            courseId: course?.id || "",
            courseTitle: course?.title || "Course",
            type: $("#resourceType").value,
            link: $("#resourceLink").value.trim(),
            createdAt: new Date().toISOString()
        });
        event.currentTarget.reset();
        renderAll();
    }

    function renderPayments() {
        const payments = readJson(KEYS.payments, []).filter((payment) => payment.lecturerId === getSession()?.id);
        $("#lecturerPayments").innerHTML = payments.map((payment) => `
            <article class="data-card">
                <h3>${escapeHtml(payment.item)}</h3>
                <p class="muted">${escapeHtml(payment.method)} • ${escapeHtml(payment.reference || "No reference")}</p>
                <p><strong>${money(payment.amount)}</strong> <span class="status-pill">${escapeHtml(payment.status)}</span></p>
            </article>
        `).join("") || `<article class="data-card"><p class="muted">No teaching payments recorded yet.</p></article>`;
    }

    function renderGroups() {
        const groups = ownItems(KEYS.groups);
        $("#groupsList").innerHTML = groups.map((group) => `
            <article class="data-card">
                <h3>${escapeHtml(group.name)}</h3>
                <p class="muted">${escapeHtml(group.courseTitle)} • ${escapeHtml(group.access)} • limit ${escapeHtml(group.limit)}</p>
                <p><span class="status-pill">${escapeHtml(group.members?.length || 0)} students joined</span></p>
            </article>
        `).join("") || `<article class="data-card"><p class="muted">No groups yet. Create one for students to join.</p></article>`;
    }

    function renderMeetings() {
        const meetings = ownItems(KEYS.meetings);
        $("#meetingsList").innerHTML = meetings.map((meeting) => `
            <article class="data-card">
                <h3>${escapeHtml(meeting.title)}</h3>
                <p class="muted">${escapeHtml(meeting.groupName)} • ${escapeHtml(meeting.date || "No date")}</p>
                <p><a href="${escapeHtml(meeting.link)}" target="_blank" rel="noopener">Open meeting link</a></p>
            </article>
        `).join("") || `<article class="data-card"><p class="muted">No meetings scheduled yet.</p></article>`;
    }

    function renderExams() {
        const exams = ownItems(KEYS.exams);
        $("#examsList").innerHTML = exams.map((exam) => `
            <article class="data-card">
                <h3>${escapeHtml(exam.title)}</h3>
                <p class="muted">${escapeHtml(exam.courseTitle)} • ${escapeHtml(exam.questions)} questions • ${escapeHtml(exam.duration)} min</p>
                <p>${escapeHtml(exam.instructions)}</p>
                <p><span class="status-pill">${escapeHtml(exam.status)}</span></p>
            </article>
        `).join("") || `<article class="data-card"><p class="muted">No exams submitted yet.</p></article>`;
    }

    function renderResources() {
        const resources = ownItems(KEYS.resources);
        $("#resourcesList").innerHTML = resources.map((resource) => `
            <article class="data-card">
                <h3>${escapeHtml(resource.title)}</h3>
                <p class="muted">${escapeHtml(resource.courseTitle)} • ${escapeHtml(resource.type)}</p>
                <p><a href="${escapeHtml(resource.link)}" target="_blank" rel="noopener">Open resource</a></p>
            </article>
        `).join("") || `<article class="data-card"><p class="muted">No resources added yet.</p></article>`;
    }

    function renderAll() {
        renderStats();
        renderPayments();
        renderGroups();
        renderMeetings();
        renderExams();
        renderResources();
    }

    function handleTabs(event) {
        const tab = event.target.closest(".tab-button");
        if (!tab) return;
        $$(".tab-button").forEach((button) => button.classList.toggle("active", button === tab));
        $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === tab.dataset.panel));
    }

    function main() {
        $("#lecturerLoginForm")?.addEventListener("submit", handleLogin);
        $("#lecturerPaymentForm")?.addEventListener("submit", handlePayment);
        $("#groupForm")?.addEventListener("submit", handleGroup);
        $("#meetingForm")?.addEventListener("submit", handleMeeting);
        $("#examForm")?.addEventListener("submit", handleExam);
        $("#resourceForm")?.addEventListener("submit", handleResource);
        $("#lecturerLogout")?.addEventListener("click", () => {
            localStorage.removeItem(KEYS.session);
            showAuth();
        });
        document.addEventListener("click", handleTabs);

        if (getSession()?.role === "lecturer") {
            showApp();
        } else {
            showAuth();
        }
    }

    document.addEventListener("DOMContentLoaded", main);
})();
