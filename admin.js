(() => {
    const KEYS = {
        session: "gnp_admin_session",
        lecturers: "gnp_lecturers",
        groups: "gnp_membership_groups",
        exams: "gnp_lecturer_exams",
        payments: "gnp_payments",
        adminProfile: "gnp_admin_profile"
    };

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

    async function sha256Hex(text) {
        if (!window.crypto?.subtle) return text;
        const data = new TextEncoder().encode(text);
        const hash = await window.crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

    function getCourses() {
        if (window.GnpLearning?.getCourses) {
            return window.GnpLearning.getCourses();
        }
        return readJson("nurseprep_admin_courses", []);
    }

    function saveCourses(courses) {
        if (window.GnpLearning?.saveCourseCatalog) {
            window.GnpLearning.saveCourseCatalog(courses);
            return;
        }
        writeJson("nurseprep_admin_courses", courses);
    }

    function ensureStarterRecords() {
        const lecturers = readJson(KEYS.lecturers, []);
        if (!lecturers.length) {
            writeJson(KEYS.lecturers, [
                {
                    id: "lecturer_primary",
                    name: "Nurse Educator",
                    email: "lecturer@globalnurseprep.com",
                    status: "approved",
                    subscription: "Professional Lecturer",
                    createdAt: new Date().toISOString()
                }
            ]);
        }

        const payments = readJson(KEYS.payments, []);
        if (!payments.length) {
            writeJson(KEYS.payments, [
                {
                    id: "pay_student_1",
                    payerRole: "student",
                    payerName: "Student Account",
                    item: "NCLEX-RN Comprehensive Prep",
                    method: "M-Pesa",
                    amount: 3500,
                    status: "recorded",
                    createdAt: new Date().toISOString()
                },
                {
                    id: "pay_lecturer_1",
                    payerRole: "lecturer",
                    payerName: "Nurse Educator",
                    item: "Professional Lecturer Subscription",
                    method: "PayPal",
                    amount: 2500,
                    status: "recorded",
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    }

    function showApp() {
        $("#adminAuth")?.classList.add("hidden");
        $("#adminApp")?.classList.remove("hidden");
        $("#adminLogout")?.classList.remove("hidden");
        renderAll();
    }

    function showAuth() {
        $("#adminAuth")?.classList.remove("hidden");
        $("#adminApp")?.classList.add("hidden");
        $("#adminLogout")?.classList.add("hidden");
    }

    async function handleLogin(event) {
        event.preventDefault();
        const email = ($("#adminEmail")?.value || "").trim().toLowerCase();
        const password = $("#adminPassword")?.value || "";
        const message = $("#adminLoginMessage");

        if (!email || password.length < 6) {
            if (message) {
                message.textContent = "Enter an admin email and a password with at least 6 characters.";
                message.className = "form-message error";
            }
            return;
        }

        const passwordHash = await sha256Hex(password);
        const profile = readJson(KEYS.adminProfile, null);
        if (profile?.email && (profile.email !== email || profile.passwordHash !== passwordHash)) {
            if (message) {
                message.textContent = "The admin email or password is incorrect.";
                message.className = "form-message error";
            }
            return;
        }

        if (!profile?.email) {
            writeJson(KEYS.adminProfile, {
                email,
                passwordHash,
                createdAt: new Date().toISOString()
            });
        }

        writeJson(KEYS.session, {
            role: "admin",
            email,
            loginAt: new Date().toISOString()
        });
        ensureStarterRecords();
        showApp();
    }

    function renderStats() {
        const courses = getCourses();
        const lecturers = readJson(KEYS.lecturers, []);
        const groups = readJson(KEYS.groups, []);
        const exams = readJson(KEYS.exams, []);
        const payments = readJson(KEYS.payments, []);
        const paidCourses = courses.filter((course) => course.access === "paid" || Number(course.price || 0) > 0).length;
        const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        $("#adminStats").innerHTML = [
            ["Courses", courses.length],
            ["Paid courses", paidCourses],
            ["Lecturers", lecturers.length],
            ["Groups", groups.length],
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

    function normalizeCourseFromForm() {
        const id = $("#courseId").value || `course_${Date.now().toString(36)}`;
        const price = Number($("#coursePrice").value || 0);
        return {
            id,
            title: $("#courseTitle").value.trim(),
            category: $("#courseCategory").value.trim(),
            difficulty: $("#courseLevel").value,
            access: $("#courseAccess").value,
            price,
            lecturer: $("#courseLecturer").value.trim(),
            summary: $("#courseSummary").value.trim(),
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

    function renderCourses() {
        const courses = getCourses();
        $("#adminCourseList").innerHTML = courses.map((course) => {
            const access = course.access || (Number(course.price || 0) > 0 ? "paid" : "free");
            return `
                <article class="data-card">
                    <h3>${escapeHtml(course.title)}</h3>
                    <p class="muted">${escapeHtml(course.summary)}</p>
                    <p><span class="status-pill">${escapeHtml(course.category)}</span> <span class="status-pill">${escapeHtml(access.toUpperCase())}</span></p>
                    <p><strong>${money(course.price)}</strong> ${escapeHtml(course.lecturer || "No lecturer assigned")}</p>
                    <div class="data-actions">
                        <button type="button" data-edit-course="${escapeHtml(course.id)}">Edit</button>
                        <button type="button" class="danger-button" data-delete-course="${escapeHtml(course.id)}">Delete</button>
                    </div>
                </article>
            `;
        }).join("");
    }

    function saveCourse(event) {
        event.preventDefault();
        const next = normalizeCourseFromForm();
        const courses = getCourses();
        const exists = courses.some((course) => course.id === next.id);
        saveCourses(exists ? courses.map((course) => course.id === next.id ? { ...course, ...next } : course) : [next, ...courses]);
        event.currentTarget.reset();
        $("#courseId").value = "";
        $("#coursePrice").value = "0";
        renderAll();
    }

    function renderLecturers() {
        const lecturers = readJson(KEYS.lecturers, []);
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

    function renderExams() {
        const exams = readJson(KEYS.exams, []);
        $("#examList").innerHTML = exams.map((exam) => `
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

    function renderGroups() {
        const groups = readJson(KEYS.groups, []);
        $("#groupList").innerHTML = groups.map((group) => `
            <article class="data-card">
                <h3>${escapeHtml(group.name)}</h3>
                <p class="muted">${escapeHtml(group.courseTitle)} • ${escapeHtml(group.access)} • limit ${escapeHtml(group.limit)}</p>
                <p>Lecturer: ${escapeHtml(group.lecturerName)} • Students joined: ${escapeHtml(group.members?.length || 0)}</p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Lecturer membership groups will appear here.</p></article>`;
    }

    function renderPayments() {
        const payments = readJson(KEYS.payments, []);
        $("#paymentList").innerHTML = payments.map((payment) => `
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
        renderExams();
        renderGroups();
        renderPayments();
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
            const course = getCourses().find((item) => item.id === editId);
            if (!course) return;
            $("#courseId").value = course.id;
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
            saveCourses(getCourses().filter((course) => course.id !== deleteId));
            renderAll();
            return;
        }

        const lecturerId = event.target.dataset.lecturerStatus;
        if (lecturerId) {
            const status = event.target.dataset.status;
            writeJson(KEYS.lecturers, readJson(KEYS.lecturers, []).map((lecturer) => (
                lecturer.id === lecturerId ? { ...lecturer, status } : lecturer
            )));
            renderAll();
            return;
        }

        const examId = event.target.dataset.examStatus;
        if (examId) {
            const status = event.target.dataset.status;
            writeJson(KEYS.exams, readJson(KEYS.exams, []).map((exam) => (
                exam.id === examId ? { ...exam, status } : exam
            )));
            renderAll();
        }
    }

    function main() {
        ensureStarterRecords();
        $("#adminLoginForm")?.addEventListener("submit", handleLogin);
        $("#courseAdminForm")?.addEventListener("submit", saveCourse);
        $("#seedDataBtn")?.addEventListener("click", () => {
            ensureStarterRecords();
            renderAll();
        });
        $("#adminLogout")?.addEventListener("click", () => {
            localStorage.removeItem(KEYS.session);
            showAuth();
        });
        document.addEventListener("click", handleClicks);

        const session = readJson(KEYS.session, null);
        if (session?.role === "admin") {
            showApp();
        } else {
            showAuth();
        }
    }

    document.addEventListener("DOMContentLoaded", main);
})();
