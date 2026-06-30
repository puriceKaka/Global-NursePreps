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
        $("#adminAuth")?.classList.add("hidden");
        $("#adminApp")?.classList.remove("hidden");
        $("#adminLogout")?.classList.remove("hidden");
    }

    function showAuth(defaultMode = "login") {
        $("#adminAuth")?.classList.remove("hidden");
        $("#adminApp")?.classList.add("hidden");
        $("#adminLogout")?.classList.add("hidden");
        setAuthMode(defaultMode);
    }

    function setAuthMode(mode) {
        $("#adminLoginForm")?.classList.toggle("hidden", mode !== "login");
        $("#adminSetupForm")?.classList.toggle("hidden", mode !== "setup");
    }

    async function loadAdminState() {
        const response = await window.GnpAdminApi.loadState();
        return setState(response?.state || EMPTY_STATE);
    }

    async function bootstrapDashboard() {
        await loadAdminState();
        if (window.GnpLearning?.refreshCourses) {
            await window.GnpLearning.refreshCourses();
        }
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

    function normalizeCourseFromForm() {
        const id = $("#courseId")?.value || `course_${Date.now().toString(36)}`;
        const price = Number($("#coursePrice")?.value || 0);
        return {
            id,
            title: ($("#courseTitle")?.value || "").trim(),
            category: ($("#courseCategory")?.value || "").trim(),
            difficulty: $("#courseLevel")?.value || "Beginner",
            access: $("#courseAccess")?.value || (price > 0 ? "paid" : "free"),
            price,
            lecturer: ($("#courseLecturer")?.value || "").trim(),
            lecturerId: "",
            summary: ($("#courseSummary")?.value || "").trim(),
            badge: price > 0 ? "Paid" : "Free",
            durationHours: 24,
            questions: 300,
            exams: 3,
            format: price > 0 ? "Paid course" : "Free course",
            image: "assets/course-images/default.jpg",
            moduleCount: 10,
            source: "admin"
        };
    }

    async function saveCourse(event) {
        event.preventDefault();
        try {
            const nextCourse = normalizeCourseFromForm();
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
        } catch (error) {
            console.error("Failed to save course:", error);
        }
    }

    function renderStats() {
        const courses = adminState.courses;
        const lecturers = adminState.lecturers;
        const groups = adminState.groups;
        const meetings = adminState.meetings;
        const exams = adminState.exams;
        const payments = adminState.payments;
        const paidCourses = courses.filter((course) => course.access === "paid" || Number(course.price || 0) > 0).length;
        const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        $("#adminStats").innerHTML = [
            ["Courses", courses.length],
            ["Paid courses", paidCourses],
            ["Lecturers", lecturers.length],
            ["Groups", groups.length],
            ["Lectures", meetings.length],
            ["Submitted exams", exams.length],
            ["Payments", payments.length],
            ["Revenue", money(totalRevenue)],
            ["Free courses", courses.length - paidCourses]
        ].map(([label, value]) => `
            <article class="stat-card">
                <strong>${escapeHtml(value)}</strong>
                <span class="muted">${escapeHtml(label)}</span>
            </article>
        `).join("");
    }

    function renderCourses() {
        $("#adminCourseList").innerHTML = adminState.courses.map((course) => {
            const access = course.access || (Number(course.price || 0) > 0 ? "paid" : "free");
            return `
                <article class="data-card">
                    <h3>${escapeHtml(course.title)}</h3>
                    <p class="muted">${escapeHtml(course.summary)}</p>
                    <p><span class="status-pill">${escapeHtml(course.category)}</span> <span class="status-pill">${escapeHtml(access.toUpperCase())}</span></p>
                    <p><strong>${money(course.price)}</strong> ${course.lecturer ? escapeHtml(course.lecturer) : "Lecturer not selected"}</p>
                    ${course.contentNotes ? `<p class="course-notes-preview">${escapeHtml(course.contentNotes).slice(0, 180)}${String(course.contentNotes).length > 180 ? "..." : ""}</p>` : ""}
                    <div class="data-actions">
                        <button type="button" data-edit-course="${escapeHtml(course.id)}">Edit</button>
                        <button type="button" class="danger-button" data-delete-course="${escapeHtml(course.id)}">Delete</button>
                    </div>
                </article>
            `;
        }).join("") || `<article class="data-card empty-card"><p class="muted">No courses saved yet.</p></article>`;
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
        $("#lecturerList").innerHTML = lecturers.map((lecturer) => `
            <article class="data-card">
                <h3>${escapeHtml(lecturer.name)}</h3>
                <p class="muted">${escapeHtml(lecturer.email)}</p>
                <p><span class="status-pill">${escapeHtml(lecturer.status || "pending")}</span> <span class="status-pill">${escapeHtml(lecturer.subscription || "No plan")}</span></p>
                <div class="data-actions">
                    <button type="button" data-lecturer-status="${escapeHtml(lecturer.id)}" data-status="approved">Approve</button>
                    <button type="button" data-lecturer-status="${escapeHtml(lecturer.id)}" data-status="suspended">Suspend</button>
                </div>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Lecturer applications will appear here after registration.</p></article>`;
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
        $("#groupList").innerHTML = adminState.groups.map((group) => `
            <article class="data-card">
                <h3>${escapeHtml(group.name)}</h3>
                <p class="muted">${escapeHtml(group.courseTitle)} • ${escapeHtml(group.access)} • limit ${escapeHtml(group.limit)}</p>
                <p>Lecturer: ${escapeHtml(group.lecturerName)} • Students joined: ${escapeHtml(group.members?.length || 0)}</p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Lecturer membership groups will appear here.</p></article>`;
    }

    function renderExams() {
        $("#examList").innerHTML = adminState.exams.map((exam) => `
            <article class="data-card">
                <h3>${escapeHtml(exam.title)}</h3>
                <p class="muted">${escapeHtml(exam.courseTitle)} • ${escapeHtml(exam.questions)} questions • ${escapeHtml(exam.duration)} min</p>
                <p>${escapeHtml(exam.instructions)}</p>
                <p><span class="status-pill">${escapeHtml(exam.status || "submitted")}</span> Lecturer: ${escapeHtml(exam.lecturerName)}</p>
                <div class="data-actions">
                    <button type="button" data-exam-status="${escapeHtml(exam.id)}" data-status="approved">Approve</button>
                    <button type="button" data-exam-status="${escapeHtml(exam.id)}" data-status="needs revision">Needs revision</button>
                </div>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Submitted exams will appear here for review.</p></article>`;
    }

    function renderPayments() {
        $("#paymentList").innerHTML = adminState.payments.map((payment) => `
            <article class="data-card">
                <h3>${escapeHtml(payment.item)}</h3>
                <p class="muted">${escapeHtml(payment.payerRole)} • ${escapeHtml(payment.payerName)} • ${escapeHtml(payment.method)}</p>
                <p><strong>${money(payment.amount)}</strong> <span class="status-pill">${escapeHtml(payment.status)}</span></p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Payment records will appear here after students or lecturers pay.</p></article>`;
    }

    function renderAll() {
        renderStats();
        renderCourses();
        renderLecturers();
        renderLectures();
        renderExams();
        renderGroups();
        renderPayments();
    }

    async function updateLecturerStatus(lecturerId, status) {
        const lecturers = adminState.lecturers.map((lecturer) => (
            lecturer.id === lecturerId ? { ...lecturer, status } : lecturer
        ));
        await persistState({ ...adminState, lecturers });
    }

    async function updateExamStatus(examId, status) {
        const exams = adminState.exams.map((exam) => (
            exam.id === examId ? { ...exam, status } : exam
        ));
        await persistState({ ...adminState, exams });
    }

    function handleClicks(event) {
        const tab = event.target.closest(".tab-button");
        if (tab) {
            $$(".tab-button").forEach((button) => button.classList.toggle("active", button === tab));
            $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === tab.dataset.panel));
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
            $("#courseLecturer").value = course.lecturer || "";
            $("#courseSummary").value = course.summary || "";
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
            showApp();
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
        const email = ($("#adminSetupEmail")?.value || "").trim().toLowerCase();
        const password = $("#adminSetupPassword")?.value || "";
        const setupKey = ($("#adminSetupKey")?.value || "").trim();
        const message = $("#adminSetupMessage");

        const passwordCheck = window.GnpAuthSecurity?.validatePassword(password);
        if (!email || !setupKey || !passwordCheck?.ok) {
            if (message) {
                message.textContent = !email ? "Enter an admin email." : !setupKey ? "Enter the admin setup key." : passwordCheck.message;
                message.className = "form-message error";
            }
            return;
        }

        try {
            await window.GnpAdminApi.bootstrap({ email, password, setupKey });
            await bootstrapDashboard();
            showApp();
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
        document.addEventListener("click", handleClicks);

        const status = await window.GnpAdminApi.status().catch(() => null);
        if (status?.bootstrapEnabled && !status?.configured) {
            setAuthMode("setup");
        }

        try {
            const me = await window.GnpAdminApi.me();
            if (me?.user?.role === "admin") {
                await bootstrapDashboard();
                showApp();
                renderAll();
                return;
            }
        } catch {
            // fall through to auth view
        }

        showAuth(status?.bootstrapEnabled && !status?.configured ? "setup" : "login");
    }

    document.addEventListener("DOMContentLoaded", main);
})();
