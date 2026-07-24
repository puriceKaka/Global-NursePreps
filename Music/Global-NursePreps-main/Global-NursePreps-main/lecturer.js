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
    const STUDENT_SESSION_KEY = "nurseprep_session";
    const ADMIN_SESSION_KEY = "gnp_admin_session";

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
        return [];
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

    function saveLecturerAccount(account) {
        const lecturers = readJson(KEYS.lecturers, []);
        const email = account.email.toLowerCase();
        const existing = lecturers.find((lecturer) => String(lecturer.email || "").toLowerCase() === email);
        if (existing) {
            writeJson(KEYS.lecturers, lecturers.map((lecturer) => (
                String(lecturer.email || "").toLowerCase() === email
                    ? { ...lecturer, ...account, id: lecturer.id || account.id, status: lecturer.status || "pending", subscription: lecturer.subscription || "Not paid" }
                    : lecturer
            )));
            return;
        }
        writeJson(KEYS.lecturers, [{
            ...account,
            status: "pending",
            subscription: "Not paid",
            createdAt: new Date().toISOString()
        }, ...lecturers]);
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
        setAuthMode("login");
    }

    function setAuthMode(mode) {
        $("#lecturerLoginForm")?.classList.toggle("hidden", mode !== "login");
        $("#lecturerRegisterForm")?.classList.toggle("hidden", mode !== "register");
    }

    async function handleRegister(event) {
        event.preventDefault();
        const name = ($("#lecturerRegisterName")?.value || "").trim();
        const email = ($("#lecturerRegisterEmail")?.value || "").trim().toLowerCase();
        const password = $("#lecturerRegisterPassword")?.value || "";
        const message = $("#lecturerRegisterMessage");

        if (!name || !email || !password) {
            if (message) {
                message.textContent = "Enter lecturer name, email, and password.";
                message.className = "form-message error";
            }
            return;
        }

        const passwordCheck = window.GnpAuthSecurity?.validatePassword(password);
        if (!passwordCheck?.ok) {
            if (message) {
                message.textContent = passwordCheck?.message || "Use a stronger password.";
                message.className = "form-message error";
            }
            return;
        }

        const lecturers = readJson(KEYS.lecturers, []);
        const existing = lecturers.find((lecturer) => String(lecturer.email || "").toLowerCase() === email);
        if (existing?.passwordHash) {
            if (message) {
                message.textContent = "This email is already registered. Login instead.";
                message.className = "form-message error";
            }
            return;
        }

        const passwordRecord = await window.GnpAuthSecurity.createPasswordRecord(password);
        saveLecturerAccount({
            id: existing?.id || `lecturer_${email.replace(/[^a-z0-9]/g, "_")}`,
            role: "lecturer",
            name,
            email,
            ...passwordRecord
        });
        localStorage.removeItem(KEYS.session);
        event.currentTarget.reset();
        setAuthMode("login");
        if ($("#lecturerEmail")) $("#lecturerEmail").value = email;
        const loginMessage = $("#lecturerLoginMessage");
        if (loginMessage) {
            loginMessage.textContent = "Account created. Login with your lecturer email and password.";
            loginMessage.className = "form-message success";
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const email = ($("#lecturerEmail")?.value || "").trim().toLowerCase();
        const password = $("#lecturerPassword")?.value || "";
        const message = $("#lecturerLoginMessage");

        if (!email || !password) {
            if (message) {
                message.textContent = "Enter lecturer email and password.";
                message.className = "form-message error";
            }
            return;
        }

        const lecturers = readJson(KEYS.lecturers, []);
        const existing = lecturers.find((lecturer) => String(lecturer.email || "").toLowerCase() === email);
        if (!existing?.passwordHash) {
            if (message) {
                message.textContent = "Lecturer account not found. Create an account first.";
                message.className = "form-message error";
            }
            return;
        }

        const ok = await window.GnpAuthSecurity.verifyPassword(password, existing);
        if (!ok) {
            if (message) {
                message.textContent = "The lecturer email or password is incorrect.";
                message.className = "form-message error";
            }
            return;
        }
        await window.GnpAuthSecurity.upgradePasswordIfNeeded(password, existing, (upgraded) => {
            writeJson(KEYS.lecturers, lecturers.map((lecturer) => lecturer.id === existing.id ? upgraded : lecturer));
        });

        const session = {
            id: existing.id,
            role: "lecturer",
            name: existing.name || "Lecturer",
            email: existing.email,
            loginAt: new Date().toISOString()
        };
        localStorage.removeItem(STUDENT_SESSION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        writeJson(KEYS.session, session);
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
        const matches = readJson(KEYS.lecturers, []).filter((lecturer) => (
            lecturer.id === session?.id || String(lecturer.email || "").toLowerCase() === String(session?.email || "").toLowerCase()
        ));
        return matches.find((lecturer) => lecturer.status === "approved") || matches[0] || null;
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
            groupName: group?.name || "Unassigned group",
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

    function addCourseToCatalog(course) {
        if (window.GnpLearning?.addCourse) {
            window.GnpLearning.addCourse(course);
            return;
        }
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Failed to read uploaded file"));
            reader.readAsDataURL(file);
        });
    }

    function parseModuleTitles(rawValue, fallbackCount, courseTitle) {
        const lines = String(rawValue || "")
            .split(/\r?\n/)
            .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
            .filter(Boolean);

        if (lines.length) {
            return lines;
        }

        const count = Math.max(1, Number(fallbackCount || 1));
        const base = String(courseTitle || "Course").trim();
        return Array.from({ length: count }, (_, index) => `${base} Module ${index + 1}`);
    }

    function parseLines(rawValue) {
        return String(rawValue || "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function parseStructuredRows(rawValue, defaults = {}) {
        return parseLines(rawValue).map((line, index) => {
            const parts = line.split("|").map((part) => part.trim());
            return {
                id: `${defaults.prefix || "item"}-${index + 1}`,
                title: parts[0] || `${defaults.label || "Item"} ${index + 1}`,
                type: parts[1] || defaults.type || "",
                dueDate: parts[1] && /marks?|pass|score/i.test(parts[2] || "") ? "" : (parts[1] || ""),
                marks: parts[2] || defaults.marks || "",
                link: parts[2] && !/marks?|pass|score/i.test(parts[2]) ? parts[2] : (parts[3] || ""),
                instructions: parts[3] || defaults.instructions || ""
            };
        });
    }

    function loadDocumentIntoNotes(file) {
        const message = $("#publishMessage");
        if (!file) return;
        const notes = $("#publishNotes");
        if (/\.(txt|md|rtf)$/i.test(file.name)) {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                notes.value = String(reader.result || "");
                if (message) {
                    message.textContent = "Document text loaded into the course notes.";
                    message.className = "form-message success";
                }
            });
            reader.readAsText(file);
            return;
        }
        if (message) {
            message.textContent = "Document attached. For PDF or Word files, paste the main notes into the course notes box before posting.";
            message.className = "form-message";
        }
    }

    function handlePublishCourse(event) {
        event.preventDefault();
        const session = getSession();
        const file = $("#publishDocument").files?.[0] || null;
        const documentImageFile = $("#publishDocumentImage").files?.[0] || null;
        const courseImageFile = $("#publishCourseImage").files?.[0] || null;
        const videoFile = $("#publishVideoFile").files?.[0] || null;
        const notes = $("#publishNotes").value.trim();
        const title = $("#publishTitle").value.trim();
        const price = Number($("#publishPrice").value || 0);
        const access = $("#publishAccess").value;
        const unit = ($("#publishUnit").value || "").trim();
        const subunit = ($("#publishSubunit").value || "").trim();
        const moduleCount = Number($("#publishModuleCount").value || 1);
        const moduleTitles = parseModuleTitles($("#publishModuleTitles").value || "", moduleCount, title);
        const courseImagePromise = documentImageFile
            ? readFileAsDataUrl(documentImageFile)
            : (courseImageFile ? readFileAsDataUrl(courseImageFile) : Promise.resolve(""));
        const videoPromise = videoFile
            ? readFileAsDataUrl(videoFile)
            : Promise.resolve(($("#publishVideoUrl").value || "").trim());

        void Promise.all([courseImagePromise, videoPromise]).then(([courseImage, lectureVideo]) => {
            const course = {
                id: `lecturer-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Date.now().toString(36)}`,
                title,
                unit,
                subunit,
                category: $("#publishCategory").value.trim(),
                faculty: ($("#publishFaculty").value || "").trim(),
                department: ($("#publishDepartment").value || "").trim(),
                courseCode: ($("#publishCourseCode").value || "").trim(),
                difficulty: $("#publishLevel").value,
                access,
                price: access === "paid" ? price : 0,
                language: ($("#publishLanguage").value || "English").trim(),
                prerequisites: parseLines($("#publishPrerequisites").value || ""),
                learningOutcomes: parseLines($("#publishOutcomes").value || ""),
                lecturer: session.name,
                lecturerId: session.id,
                badge: access === "paid" ? "Paid" : "Free",
                durationHours: Math.max(12, Math.ceil((notes.length || 2400) / 1200)),
                questions: 100,
                exams: 1,
                format: "Lecturer notes",
                summary: $("#publishSummary").value.trim(),
                image: courseImage || "assets/course-images/default.jpg",
                courseImage: courseImage || "assets/course-images/default.jpg",
                documentCoverImage: courseImage || "",
                lessonBackgroundImage: courseImage || "assets/course-images/default.jpg",
                moduleCount,
                moduleTitles,
                contentNotes: notes,
                uploadedDocument: file ? { name: file.name, type: file.type, size: file.size } : null,
                generatedLessons: moduleTitles.map((moduleTitle, index) => ({
                    title: moduleTitle,
                    lectureTitle: subunit || unit || "Lecturer module",
                    objective: `Understand ${moduleTitle} within the ${unit || $("#publishCategory").value.trim() || "course"} unit.`,
                    body: notes || `${moduleTitle} supports the learning path for ${title}.`,
                    concepts: [moduleTitle, unit || subunit || $("#publishCategory").value.trim(), "Lecture notes"],
                    summary: `${moduleTitle} for ${title}.`,
                    materials: {
                        videoLecture: lectureVideo || "",
                        pdfNotes: file?.name || "",
                        slides: "",
                        downloads: file ? [{ title: file.name, type: file.type || "Document", link: file.name }] : [],
                        discussion: true,
                        assignment: null
                    }
                })),
                assignments: parseStructuredRows($("#publishAssignments").value || "", { prefix: "assignment", label: "Assignment", type: "Assignment" }),
                assessments: parseStructuredRows($("#publishAssessments").value || "", { prefix: "assessment", label: "Assessment", type: "Assessment" }),
                resources: parseStructuredRows($("#publishResources").value || "", { prefix: "resource", label: "Resource" }),
                announcements: parseLines($("#publishAnnouncements").value || "").map((message, index) => ({
                    id: `announcement-${index + 1}`,
                    title: `Announcement ${index + 1}`,
                    message,
                    createdAt: new Date().toISOString()
                })),
                lectureVideo,
                lectureVideoName: videoFile?.name || "",
                lectureVideoSource: videoFile?.name || ($("#publishVideoUrl").value || "").trim(),
                source: "lecturer"
            };

            addCourseToCatalog(course);
            saveOwnItem(KEYS.resources, {
                id: uid("resource"),
                lecturerId: session.id,
                lecturerName: session.name,
                title: `${title} course notes`,
                courseId: course.id,
                courseTitle: title,
                type: "Course Notes",
                link: file?.name || "Manual notes",
                createdAt: new Date().toISOString()
            });
            event.currentTarget.reset();
            populateCourseSelects();
            renderAll();
            const message = $("#publishMessage");
            if (message) {
                message.textContent = "Course posted to the student course catalog.";
                message.className = "form-message success";
            }
        }).catch((error) => {
            const message = $("#publishMessage");
            if (message) {
                message.textContent = error?.message || "Unable to post course.";
                message.className = "form-message error";
            }
        });
    }

    function renderPayments() {
        const payments = readJson(KEYS.payments, []).filter((payment) => payment.lecturerId === getSession()?.id);
        $("#lecturerPayments").innerHTML = payments.map((payment) => `
            <article class="data-card">
                <h3>${escapeHtml(payment.item)}</h3>
                <p class="muted">${escapeHtml(payment.method)} • ${escapeHtml(payment.reference || "Reference pending")}</p>
                <p><strong>${money(payment.amount)}</strong> <span class="status-pill">${escapeHtml(payment.status)}</span></p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Teaching payment records will appear here.</p></article>`;
    }

    function renderGroups() {
        const groups = ownItems(KEYS.groups);
        $("#groupsList").innerHTML = groups.map((group) => `
            <article class="data-card">
                <h3>${escapeHtml(group.name)}</h3>
                <p class="muted">${escapeHtml(group.courseTitle)} • ${escapeHtml(group.access)} • limit ${escapeHtml(group.limit)}</p>
                <p><span class="status-pill">${escapeHtml(group.members?.length || 0)} students joined</span></p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Create a membership group to organize students by course or cohort.</p></article>`;
    }

    function renderMeetings() {
        const meetings = ownItems(KEYS.meetings);
        $("#meetingsList").innerHTML = meetings.map((meeting) => `
            <article class="data-card">
                <h3>${escapeHtml(meeting.title)}</h3>
                <p class="muted">${escapeHtml(meeting.groupName)} • ${escapeHtml(meeting.date || "Date pending")}</p>
                <p><a href="${escapeHtml(meeting.link)}" target="_blank" rel="noopener">Open meeting link</a></p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Scheduled teaching sessions will appear here.</p></article>`;
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
        `).join("") || `<article class="data-card empty-card"><p class="muted">Submitted exams will appear here with their review status.</p></article>`;
    }

    function renderResources() {
        const resources = ownItems(KEYS.resources);
        $("#resourcesList").innerHTML = resources.map((resource) => `
            <article class="data-card">
                <h3>${escapeHtml(resource.title)}</h3>
                <p class="muted">${escapeHtml(resource.courseTitle)} • ${escapeHtml(resource.type)}</p>
                <p><a href="${escapeHtml(resource.link)}" target="_blank" rel="noopener">Open resource</a></p>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Add notes, links, worksheets, or question banks for your courses.</p></article>`;
    }

    function renderAll() {
        renderStats();
        renderPayments();
        renderGroups();
        renderMeetings();
        renderExams();
        renderResources();
        renderPublishedCourses();
    }

    function renderPublishedCourses() {
        const session = getSession();
        const courses = getCourses().filter((course) => (
            course.source === "lecturer" && (course.lecturerId === session?.id || course.lecturer === session?.name)
        ));
        const container = $("#publishedCoursesList");
        if (!container) return;
        container.innerHTML = courses.map((course) => `
            <article class="data-card">
                <h3>${escapeHtml(course.title)}</h3>
                <p class="muted">${escapeHtml(course.category)} • ${escapeHtml(course.difficulty)} • ${course.access === "paid" ? money(course.price) : "Free"}</p>
                <p>${escapeHtml(course.summary)}</p>
                <span class="status-pill">Posted to students</span>
            </article>
        `).join("") || `<article class="data-card empty-card"><p class="muted">Published courses will appear here after posting.</p></article>`;
    }

    function handleTabs(event) {
        const tab = event.target.closest(".tab-button");
        if (!tab) return;
        $$(".tab-button").forEach((button) => button.classList.toggle("active", button === tab));
        $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === tab.dataset.panel));
    }

    function main() {
        $("#lecturerLoginForm")?.addEventListener("submit", handleLogin);
        $("#lecturerRegisterForm")?.addEventListener("submit", handleRegister);
        $("#showLecturerRegister")?.addEventListener("click", () => setAuthMode("register"));
        $("#showLecturerLogin")?.addEventListener("click", () => setAuthMode("login"));
        $("#lecturerPaymentForm")?.addEventListener("submit", handlePayment);
        $("#groupForm")?.addEventListener("submit", handleGroup);
        $("#meetingForm")?.addEventListener("submit", handleMeeting);
        $("#examForm")?.addEventListener("submit", handleExam);
        $("#resourceForm")?.addEventListener("submit", handleResource);
        $("#publishCourseForm")?.addEventListener("submit", handlePublishCourse);
        $("#publishDocument")?.addEventListener("change", (event) => loadDocumentIntoNotes(event.target.files?.[0]));
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
