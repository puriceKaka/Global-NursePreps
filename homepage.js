(() => {
    const STORAGE_KEYS = {
        users: 'nurseprep_users',
        session: 'nurseprep_session',
        membershipsByUser: 'nurseprep_membership_by_user',
        enrollmentsByUser: 'nurseprep_enrollments_by_user',
        goalsByUser: 'nurseprep_goals_by_user',
        examByUser: 'nurseprep_examplan_by_user',
        questions: 'nurseprep_questions',
        practiceStats: 'nurseprep_practice_stats',
        ui: 'nurseprep_ui_settings'
    };

    const COURSES = [
        {
            id: 'fundamentals',
            title: 'Nursing Fundamentals',
            category: 'Fundamentals',
            level: 'Beginner',
            minutes: 180,
            description: 'Vitals, documentation, infection prevention, patient safety, communication, and basic care.'
        },
        {
            id: 'anatomy-physiology',
            title: 'Anatomy & Physiology Essentials',
            category: 'Anatomy',
            level: 'Beginner',
            minutes: 210,
            description: 'Core body systems, clinical landmarks, and how anatomy explains real nursing symptoms.'
        },
        {
            id: 'pharmacology-basics',
            title: 'Pharmacology Basics',
            category: 'Pharmacology',
            level: 'Intermediate',
            minutes: 240,
            description: 'Common drug classes, safe administration, calculations, side effects, and monitoring.'
        },
        {
            id: 'maternal-child',
            title: 'Maternal & Child Nursing',
            category: 'Maternal & Child',
            level: 'Intermediate',
            minutes: 195,
            description: 'Antenatal, intrapartum, postpartum care, newborn assessment, and pediatric priorities.'
        },
        {
            id: 'mental-health',
            title: 'Mental Health Nursing',
            category: 'Mental Health',
            level: 'Intermediate',
            minutes: 165,
            description: 'Therapeutic communication, risk assessment, common disorders, and safe care planning.'
        },
        {
            id: 'critical-care',
            title: 'Critical Care (ICU) Foundations',
            category: 'Critical Care',
            level: 'Advanced',
            minutes: 260,
            description: 'ABCDE assessment, ventilators basics, shock, sepsis recognition, and rapid escalation.'
        },
        {
            id: 'emergency-triage',
            title: 'Emergency & Triage',
            category: 'Emergency',
            level: 'Advanced',
            minutes: 220,
            description: 'Prioritization, red flags, trauma basics, and safe first-hour nursing interventions.'
        },
        {
            id: 'research-ebi',
            title: 'Research & Evidence-Based Practice',
            category: 'Research',
            level: 'Intermediate',
            minutes: 140,
            description: 'How to read papers, evaluate evidence, and apply guidelines at the bedside.'
        },
        {
            id: 'osce-skills',
            title: 'OSCE Skills Pack',
            category: 'Examination',
            level: 'Beginner',
            minutes: 200,
            description: 'Step-by-step stations: hand hygiene, medication checks, IV setup, wound care, SBAR.'
        },
        {
            id: 'nursing-calculations',
            title: 'Nursing Calculations',
            category: 'Mathematics',
            level: 'Beginner',
            minutes: 120,
            description: 'Dose calculations, drip rates, dilution, and quick mental math tips for safety.'
        },
        {
            id: 'leadership',
            title: 'Leadership & Professional Practice',
            category: 'Professional',
            level: 'Intermediate',
            minutes: 150,
            description: 'Delegation, prioritization, teamwork, ethics, scope of practice, and leadership basics.'
        },
        {
            id: 'patient-education',
            title: 'Patient Education & Health Promotion',
            category: 'Community',
            level: 'Beginner',
            minutes: 135,
            description: 'Teach-back method, lifestyle counseling, adherence, and patient-friendly communication.'
        }
    ];

    const CAREER_PATHS = [
        {
            id: 'icu',
            title: 'ICU / Critical Care Nurse',
            summary: 'Care for unstable patients, monitor complex conditions, and respond quickly to changes.',
            focus: ['ABCDE assessment', 'Sepsis recognition', 'Ventilation basics', 'Cardiac monitoring']
        },
        {
            id: 'er',
            title: 'Emergency Nurse',
            summary: 'Fast-paced triage, trauma basics, rapid stabilization, and prioritizing safe care.',
            focus: ['Triage prioritization', 'Trauma basics', 'Pain management', 'Communication under pressure']
        },
        {
            id: 'peds',
            title: 'Pediatric Nurse',
            summary: 'Family-centered care for children: assessment, medication safety, growth and development.',
            focus: ['Child assessment', 'Weight-based dosing', 'Family education', 'Safeguarding basics']
        },
        {
            id: 'maternity',
            title: 'Midwifery / Maternity Nurse',
            summary: 'Support mothers through pregnancy, delivery, postpartum, and newborn care.',
            focus: ['Antenatal care', 'Postpartum assessment', 'Newborn checks', 'Breastfeeding support']
        },
        {
            id: 'mental',
            title: 'Mental Health Nurse',
            summary: 'Therapeutic communication, risk management, and compassionate long-term support.',
            focus: ['De-escalation', 'Risk assessment', 'Medication monitoring', 'Care planning']
        },
        {
            id: 'oncology',
            title: 'Oncology Nurse',
            summary: 'Support patients through cancer treatment, symptom control, and compassionate education.',
            focus: ['Side effect monitoring', 'Pain & nausea care', 'Patient education', 'Psychosocial support']
        },
        {
            id: 'theatre',
            title: 'Perioperative / Theatre Nurse',
            summary: 'Maintain sterile safety, assist procedures, and deliver pre- and post-op nursing care.',
            focus: ['Aseptic technique', 'Instrument safety', 'Positioning', 'Handover quality']
        },
        {
            id: 'educator',
            title: 'Nurse Educator',
            summary: 'Teach students and staff, build skills programs, and guide practice improvement.',
            focus: ['Clinical teaching', 'Assessment tools', 'Feedback skills', 'Curriculum basics']
        },
        {
            id: 'community',
            title: 'Community Health Nurse',
            summary: 'Health promotion, chronic disease follow-up, home visits, and patient education.',
            focus: ['Health education', 'Screening', 'Follow-up planning', 'Community engagement']
        }
    ];

    const COURSE_IMAGE_BY_ID = {
        'nck-masterclass': 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&q=80&w=1200',
        'nclex-comprehensive': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200',
        'lecture-series': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
        'pharmacology-intensive': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=1200',
        'pediatrics-clinical': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
        'med-surg-bootcamp': 'https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200'
    };

    const COURSE_IMAGE_FALLBACKS = [
        'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200'
    ];

    function isGenericCourseImage(src) {
        const value = String(src || '').toLowerCase();
        return (
            value === '' ||
            value.includes('default.') ||
            value.includes('home image') ||
            value.includes('home%20image') ||
            value.endsWith('/nck.jpg') ||
            value.endsWith('/nclex.jpg') ||
            value.endsWith('/lectures.jpg') ||
            value.endsWith('/pharmacology.jpg') ||
            value.endsWith('/pediatrics.jpg') ||
            value.endsWith('/med-surg.jpg')
        );
    }

    function getCourseImage(course, index) {
        if (COURSE_IMAGE_BY_ID[course.id]) return COURSE_IMAGE_BY_ID[course.id];

        const text = `${course.title || ''} ${course.category || ''}`.toLowerCase();
        if (text.includes('nck') || text.includes('licensing')) return COURSE_IMAGE_FALLBACKS[0];
        if (text.includes('nclex')) return COURSE_IMAGE_FALLBACKS[1];
        if (text.includes('lecture') || text.includes('professional')) return COURSE_IMAGE_FALLBACKS[2];
        if (text.includes('pharmacology') || text.includes('drug') || text.includes('medication')) return COURSE_IMAGE_FALLBACKS[3];
        if (text.includes('pediatric')) return COURSE_IMAGE_FALLBACKS[4];
        if (text.includes('clinical') || text.includes('med-surg') || text.includes('surg')) return COURSE_IMAGE_FALLBACKS[5];

        if (!isGenericCourseImage(course.image)) return course.image;
        return COURSE_IMAGE_FALLBACKS[index % COURSE_IMAGE_FALLBACKS.length];
    }

    const EXAM_CHECKLIST_ITEMS = [
        { id: 'plan', label: 'Create a 4-week study plan (topics + days)' },
        { id: 'questions', label: 'Do 20+ practice questions per day' },
        { id: 'review', label: 'Review wrong answers with “why” notes' },
        { id: 'osce', label: 'Practice 2 OSCE stations per week' },
        { id: 'mock', label: 'Complete 1 timed mini-mock weekly' },
        { id: 'weak', label: 'Repeat weak topics every 3 days' },
        { id: 'sleep', label: 'Protect sleep + hydration on study days' }
    ];

    const MEMBERSHIP_PLANS = [
        {
            id: 'student',
            title: 'Student Membership',
            price: 'Best for learners',
            description: 'Structured learning, peer support, and weekly study sessions.',
            features: ['Study groups', 'Course enrollments', 'Question support', 'Exam checklists']
        },
        {
            id: 'professional',
            title: 'Professional Membership',
            price: 'For working nurses',
            description: 'Career growth, mentorship, and live lectures with practical case discussions.',
            features: ['Live lectures', 'Career planning', 'Mentorship circles', 'Clinical case Q&A']
        },
        {
            id: 'mentor',
            title: 'Mentor Membership',
            price: 'Teach & guide',
            description: 'Help others grow, lead sessions, and build your educator profile.',
            features: ['Host lectures', 'Answer questions', 'CV review clinics', 'Leadership practice']
        }
    ];

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== 'string' || raw.trim() === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function getBrandLogoSrc() {
        const bySrc = document.querySelector("img[src*='Screenshot_20260421-123818']");
        if (bySrc?.getAttribute("src")) return bySrc.getAttribute("src");

        const byAlt = document.querySelector("img[alt*='logo' i]");
        if (byAlt?.getAttribute("src")) return byAlt.getAttribute("src");

        return "";
    }

    function loadJson(key, fallback) {
        return safeJsonParse(localStorage.getItem(key), fallback);
    }

    function saveJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function uid(prefix = 'id') {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return `${prefix}_${window.crypto.randomUUID()}`;
        }
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    }

    function formatDateTime(iso) {
        try {
            return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return iso;
        }
    }

    function getSession() {
        return loadJson(STORAGE_KEYS.session, null);
    }

    function requireSession() {
        const session = getSession();
        if (!session || !session.userId) {
            window.location.replace('login.html');
            return null;
        }
        return session;
    }

    function getUsers() {
        return loadJson(STORAGE_KEYS.users, []);
    }

    function updateUser(userId, updater) {
        const users = getUsers();
        const idx = users.findIndex((u) => u.id === userId);
        if (idx === -1) return null;
        const next = updater({ ...users[idx] });
        if (!next) return null;
        users[idx] = next;
        saveJson(STORAGE_KEYS.users, users);
        return next;
    }

    function getMap(key) {
        const data = loadJson(key, {});
        return data && typeof data === 'object' ? data : {};
    }

    function setMap(key, map) {
        saveJson(key, map);
    }

    function getUserMembership(userId) {
        const map = getMap(STORAGE_KEYS.membershipsByUser);
        return map[userId] || null;
    }

    function setUserMembership(userId, planId) {
        const map = getMap(STORAGE_KEYS.membershipsByUser);
        map[userId] = planId;
        setMap(STORAGE_KEYS.membershipsByUser, map);
    }

    function getUserEnrollments(userId) {
        const core = window.GnpLearning;
        if (core?.loadState) {
            const state = core.loadState();
            return Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];
        }

        const map = getMap(STORAGE_KEYS.enrollmentsByUser);
        return Array.isArray(map[userId]) ? map[userId] : [];
    }

    function setUserEnrollments(userId, courseIds) {
        const core = window.GnpLearning;
        if (core?.loadState && core?.saveState) {
            const state = core.loadState();
            state.enrolledCourseIds = Array.isArray(courseIds) ? courseIds : [];
            core.saveState(state);
            return;
        }

        const map = getMap(STORAGE_KEYS.enrollmentsByUser);
        map[userId] = courseIds;
        setMap(STORAGE_KEYS.enrollmentsByUser, map);
    }

    function getUserGoals(userId) {
        const map = getMap(STORAGE_KEYS.goalsByUser);
        return Array.isArray(map[userId]) ? map[userId] : [];
    }

    function setUserGoals(userId, goals) {
        const map = getMap(STORAGE_KEYS.goalsByUser);
        map[userId] = goals;
        setMap(STORAGE_KEYS.goalsByUser, map);
    }

    function getUserExamPlan(userId) {
        const map = getMap(STORAGE_KEYS.examByUser);
        const plan = map[userId];
        return plan && typeof plan === 'object' ? plan : {};
    }

    function setUserExamPlan(userId, plan) {
        const map = getMap(STORAGE_KEYS.examByUser);
        map[userId] = plan;
        setMap(STORAGE_KEYS.examByUser, map);
    }

    function getQuestions() {
        const list = loadJson(STORAGE_KEYS.questions, []);
        return Array.isArray(list) ? list : [];
    }

    function setQuestions(list) {
        saveJson(STORAGE_KEYS.questions, list);
    }

    function getPracticeStats() {
        const stats = loadJson(STORAGE_KEYS.practiceStats, {});
        return stats && typeof stats === 'object' ? stats : {};
    }

    function setPracticeStats(stats) {
        saveJson(STORAGE_KEYS.practiceStats, stats);
    }

    function getCoursePracticeStats(courseId) {
        const stats = getPracticeStats();
        return stats[courseId] || { attempted: 0, correct: 0, weakAreas: {} };
    }

    function saveCoursePracticeResult(courseId, topic, isCorrect) {
        const stats = getPracticeStats();
        const current = stats[courseId] || { attempted: 0, correct: 0, weakAreas: {} };
        const weakAreas = current.weakAreas && typeof current.weakAreas === 'object' ? current.weakAreas : {};
        current.attempted += 1;
        if (isCorrect) {
            current.correct += 1;
        } else {
            weakAreas[topic] = (weakAreas[topic] || 0) + 1;
        }
        current.weakAreas = weakAreas;
        stats[courseId] = current;
        setPracticeStats(stats);
        return current;
    }

    function getUiSettings() {
        const settings = loadJson(STORAGE_KEYS.ui, { textSize: 'normal', reduceMotion: false });
        return settings && typeof settings === 'object'
            ? { textSize: settings.textSize || 'normal', reduceMotion: settings.reduceMotion === true }
            : { textSize: 'normal', reduceMotion: false };
    }

    function setUiSettings(next) {
        saveJson(STORAGE_KEYS.ui, next);
    }

    function applyUiSettings() {
        const settings = getUiSettings();
        document.body.classList.toggle('text-large', settings.textSize === 'large');
        document.body.classList.toggle('reduce-motion', settings.reduceMotion === true);

        $$('.pill-toggle[data-text-size]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.textSize === settings.textSize);
        });

        const reduceToggle = $('#reduceMotionToggle');
        if (reduceToggle) reduceToggle.checked = settings.reduceMotion === true;
    }

    function openDrawer() {
        $('#drawer')?.classList.remove('hidden');
        $('#drawerOverlay')?.classList.remove('hidden');
        $('#drawerOverlay')?.setAttribute('aria-hidden', 'false');
    }

    function closeDrawer() {
        $('#drawer')?.classList.add('hidden');
        $('#drawerOverlay')?.classList.add('hidden');
        $('#drawerOverlay')?.setAttribute('aria-hidden', 'true');
    }

    function scrollToTarget(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const settings = getUiSettings();
        el.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function initDrawerNav() {
        $('#menuToggle')?.addEventListener('click', openDrawer);
        $('#drawerClose')?.addEventListener('click', closeDrawer);
        $('#drawerOverlay')?.addEventListener('click', closeDrawer);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeDrawer();
        });

        $$('.drawer-link').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                if (target) scrollToTarget(target);
                closeDrawer();
            });
        });

        $$('a[data-target]').forEach((a) => {
            a.addEventListener('click', (event) => {
                const target = a.getAttribute('data-target');
                if (!target) return;
                const el = document.getElementById(target);
                if (!el) return;
                event.preventDefault();
                scrollToTarget(target);
                closeDrawer();
            });
        });
    }

    function initLogout() {
        $('#logoutBtn')?.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEYS.session);
            window.location.replace('login.html');
        });
    }

    function renderUserSummary(user, membershipPlanId) {
        const name = user?.name || 'Member';
        const email = user?.email || '—';
        const initials = name.trim().slice(0, 1).toUpperCase() || 'N';

        const avatar = $('#drawerAvatar');
        if (avatar) {
            const logoSrc = getBrandLogoSrc();
            const existingImg = avatar.querySelector("img");
            if (logoSrc) {
                if (!existingImg) {
                    avatar.innerHTML = `<img src="${logoSrc}" alt="Global NursePrep logo">`;
                } else if (existingImg.getAttribute("src") !== logoSrc) {
                    existingImg.setAttribute("src", logoSrc);
                }
            } else if (!existingImg) {
                avatar.textContent = initials;
            }
        }

        const drawerName = $('#drawerName');
        if (drawerName) drawerName.textContent = name;

        const drawerEmail = $('#drawerEmail');
        if (drawerEmail) drawerEmail.textContent = email;

        const profileName = $('#profileName');
        if (profileName) profileName.textContent = name;

        const profileEmail = $('#profileEmail');
        if (profileEmail) profileEmail.textContent = email;

        const membershipLabel = $('#profileMembership');
        if (membershipLabel) {
            const plan = MEMBERSHIP_PLANS.find((p) => p.id === membershipPlanId);
            membershipLabel.textContent = plan ? plan.title : 'Not selected';
        }
    }

    function renderCourses(userId) {
        const grid = $('#courseGrid');
        if (!grid) return;

        const searchValue = ($('#courseSearch')?.value || '').trim().toLowerCase();
        const categoryValue = ($('#courseCategory')?.value || 'all').trim();
        const levelValue = ($('#courseLevel')?.value || 'all').trim();

        const core = window.GnpLearning;
        const catalog = core?.getCourses ? core.getCourses() : core?.COURSE_META || [];
        const state = core?.loadState ? core.loadState() : { enrolledCourseIds: [], progress: {} };
        const enrolled = new Set(Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : []);

        const filtered = catalog.filter((course) => {
            const matchesSearch =
                searchValue === '' ||
                course.title.toLowerCase().includes(searchValue) ||
                course.category.toLowerCase().includes(searchValue) ||
                course.summary.toLowerCase().includes(searchValue);

            const matchesCategory = categoryValue === 'all' || course.category === categoryValue;
            const matchesLevel = levelValue === 'all' || course.difficulty === levelValue;
            return matchesSearch && matchesCategory && matchesLevel;
        });

        grid.innerHTML = '';

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'muted';
            empty.textContent = 'No courses match your search. Try another keyword or filter.';
            grid.appendChild(empty);
            return;
        }

        filtered.forEach((course, index) => {
            const card = document.createElement('div');
            card.className = 'course-card';

            const progress = core?.ensureCourseProgress ? core.ensureCourseProgress(state, course.id, course) : null;
            const percent = core?.getProgressPercent ? core.getProgressPercent(course.id, state) : 0;
            const totalModules = progress?.totalModules || course.moduleCount || 0;
            const doneModules = Array.isArray(progress?.completedModules) ? progress.completedModules.length : 0;

            const imageSrc = getCourseImage(course, index);
            const image = document.createElement('img');
            image.className = 'course-card-image';
            image.src = imageSrc;
            image.alt = `${course.title} course image`;
            image.loading = 'lazy';
            card.appendChild(image);

            const badges = document.createElement('div');
            badges.className = 'badge-row';
            badges.innerHTML = `
                <span class="badge">${course.category}</span>
                <span class="badge alt">${course.difficulty}</span>
                <span class="badge alt">${totalModules ? `${doneModules}/${totalModules} modules` : 'Modules'}</span>
            `;

            const title = document.createElement('h4');
            title.textContent = course.title;

            const desc = document.createElement('p');
            desc.textContent = course.summary;

            const meta = document.createElement('div');
            meta.className = 'muted small';
            meta.textContent = `Progress: ${percent}%`;

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const startBtn = document.createElement('button');
            startBtn.type = 'button';
            startBtn.className = 'primary-button';
            startBtn.textContent = enrolled.has(course.id) ? 'Continue learning' : 'Enroll & start';

            startBtn.addEventListener('click', () => {
                if (!core) return;
                if (!enrolled.has(course.id)) {
                    core.enrollCourse(course.id);
                }
                window.location.href = `EXAMINATION%20PREP%20SITE/exam-lobby/anatomy.html?course=${encodeURIComponent(course.id)}`;
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = enrolled.has(course.id) ? 'secondary-button' : 'pill-button';
            cancelBtn.textContent = enrolled.has(course.id) ? 'Cancel' : 'Open catalog';
            cancelBtn.addEventListener('click', () => {
                if (!core) return;
                if (!enrolled.has(course.id)) {
                    window.location.href = 'EXAMINATION%20PREP%20SITE/courses.html';
                    return;
                }

                const ok = window.confirm(`Cancel enrollment in "${course.title}"?`);
                if (!ok) return;
                core.cancelEnrollment(course.id);
                renderCourses(userId);
                renderProfileCounts(userId);
            });

            actions.appendChild(startBtn);
            actions.appendChild(cancelBtn);

            card.appendChild(badges);
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(meta);
            card.appendChild(actions);
            grid.appendChild(card);
        });
    }

    function initCourses(userId) {
        const categorySelect = $('#courseCategory');
        if (categorySelect) {
            const catalog = window.GnpLearning?.getCourses ? window.GnpLearning.getCourses() : window.GnpLearning?.COURSE_META || [];
            const categories = Array.from(new Set(catalog.map((c) => c.category))).sort((a, b) => a.localeCompare(b));
            categories.forEach((cat) => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                categorySelect.appendChild(opt);
            });
        }

        $('#courseSearch')?.addEventListener('input', () => renderCourses(userId));
        $('#courseCategory')?.addEventListener('change', () => renderCourses(userId));
        $('#courseLevel')?.addEventListener('change', () => renderCourses(userId));

        renderCourses(userId);
    }

    function initCareerPaths() {
        const pillsWrap = $('#careerPills');
        const detail = $('#careerDetail');
        const panel = $('#careerPathPanel');
        const toggle = $('#careerPathToggle');
        if (!pillsWrap || !detail) return;

        pillsWrap.innerHTML = '';

        function setActive(pathId) {
            $$('.pill-toggle.career-pill').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.careerId === pathId);
            });
            const path = CAREER_PATHS.find((p) => p.id === pathId) || CAREER_PATHS[0];
            detail.innerHTML = `
                <div class="muted small">${path.summary}</div>
                <div class="pill-row">
                    ${path.focus.map((t) => `<span class="pill">${t}</span>`).join('')}
                </div>
            `;
        }

        CAREER_PATHS.forEach((path, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pill-toggle career-pill';
            btn.dataset.careerId = path.id;
            btn.textContent = path.title;
            btn.addEventListener('click', () => setActive(path.id));
            pillsWrap.appendChild(btn);
            if (idx === 0) btn.classList.add('active');
        });

        setActive(CAREER_PATHS[0]?.id);

        toggle?.addEventListener('click', () => {
            const isHidden = panel?.classList.toggle('hidden');
            toggle.textContent = isHidden ? 'Show career paths' : 'Hide career paths';
        });
    }

    function renderGoals(userId) {
        const wrap = $('#goalsList');
        if (!wrap) return;
        const goals = getUserGoals(userId);

        wrap.innerHTML = '';

        if (goals.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'muted small';
            empty.textContent = 'Add your first goal to start tracking your progress.';
            wrap.appendChild(empty);
            return;
        }

        goals.forEach((goal) => {
            const item = document.createElement('div');
            item.className = 'goal-item';

            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = goal.done === true;
            checkbox.addEventListener('change', () => {
                const next = getUserGoals(userId).map((g) => (g.id === goal.id ? { ...g, done: checkbox.checked } : g));
                setUserGoals(userId, next);
                renderGoals(userId);
                renderProfileCounts(userId);
            });

            const textWrap = document.createElement('div');
            const title = document.createElement('div');
            title.style.fontWeight = '900';
            title.style.color = 'var(--navy)';
            title.textContent = goal.title;

            const meta = document.createElement('div');
            meta.className = 'goal-meta';
            meta.textContent = goal.targetDate ? `Target: ${goal.targetDate}` : 'No date set';

            textWrap.appendChild(title);
            textWrap.appendChild(meta);

            label.appendChild(checkbox);
            label.appendChild(textWrap);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'danger-link';
            remove.textContent = 'Remove';
            remove.addEventListener('click', () => {
                const next = getUserGoals(userId).filter((g) => g.id !== goal.id);
                setUserGoals(userId, next);
                renderGoals(userId);
                renderProfileCounts(userId);
            });

            item.appendChild(label);
            item.appendChild(remove);
            wrap.appendChild(item);
        });
    }

    function initGoals(userId) {
        $('#goalForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            const input = $('#goalInput');
            if (!input) return;
            const title = input.value.trim();
            if (!title) return;

            const date = ($('#goalDate')?.value || '').trim();
            const next = [
                { id: uid('goal'), title, targetDate: date || null, done: false, createdAt: new Date().toISOString() },
                ...getUserGoals(userId)
            ];

            setUserGoals(userId, next);
            input.value = '';
            const dateEl = $('#goalDate');
            if (dateEl) dateEl.value = '';
            renderGoals(userId);
            renderProfileCounts(userId);
        });

        renderGoals(userId);
    }

    function renderExamChecklist(userId) {
        const wrap = $('#examChecklist');
        if (!wrap) return;

        const plan = getUserExamPlan(userId);
        wrap.innerHTML = '';

        EXAM_CHECKLIST_ITEMS.forEach((item) => {
            const row = document.createElement('label');
            row.className = 'toggle-row';
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.checked = plan[item.id] === true;
            box.addEventListener('change', () => {
                const next = { ...getUserExamPlan(userId), [item.id]: box.checked };
                setUserExamPlan(userId, next);
            });
            const text = document.createElement('span');
            text.textContent = item.label;
            row.appendChild(box);
            row.appendChild(text);
            wrap.appendChild(row);
        });
    }

    function renderMemberships(userId) {
        const grid = $('#membershipGrid');
        if (!grid) return;
        const selected = getUserMembership(userId);

        grid.innerHTML = '';

        MEMBERSHIP_PLANS.forEach((plan) => {
            const card = document.createElement('div');
            card.className = 'membership-card';

            const badges = document.createElement('div');
            badges.className = 'badge-row';
            badges.innerHTML = `
                <span class="badge">${plan.price}</span>
                ${selected === plan.id ? '<span class="badge alt">Selected</span>' : '<span class="badge alt">Choose</span>'}
            `;

            const title = document.createElement('h4');
            title.textContent = plan.title;

            const desc = document.createElement('p');
            desc.textContent = plan.description;

            const list = document.createElement('ul');
            list.className = 'checklist';
            plan.features.forEach((f) => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="dot"></span>${f}`;
                list.appendChild(li);
            });

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = selected === plan.id ? 'secondary-button' : 'primary-button';
            btn.textContent = selected === plan.id ? 'Selected' : 'Join this membership';
            btn.addEventListener('click', () => {
                setUserMembership(userId, plan.id);
                renderMemberships(userId);
                renderProfileCounts(userId);
                renderUserSummary(getUsers().find((u) => u.id === userId), plan.id);
            });

            const openGroups = document.createElement('a');
            openGroups.className = 'pill-button';
            openGroups.href = 'Membership.html';
            openGroups.textContent = 'Open groups';

            actions.appendChild(btn);
            actions.appendChild(openGroups);

            card.appendChild(badges);
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(list);
            card.appendChild(actions);
            grid.appendChild(card);
        });
    }

    const PRACTICE_TEMPLATES = [
        {
            match: ['nck', 'licensing'],
            topic: 'Licensing priority and safety',
            stem: 'A nursing student is preparing for a licensing-style priority question. Which action is usually safest first?',
            options: ['Choose the longest answer', 'Assess the client and identify unstable cues', 'Skip assessment and start teaching', 'Document before intervening'],
            correct: 1,
            rationale: 'Licensing questions usually reward safe assessment, prioritization, and recognition of unstable findings before action.'
        },
        {
            match: ['nclex'],
            topic: 'NCLEX clinical judgment',
            stem: 'In an NCLEX-style clinical judgment item, what should the student do first after reading the case?',
            options: ['Pick the first familiar option', 'Identify the main patient problem and key cues', 'Ignore abnormal trends', 'Focus only on the diagnosis label'],
            correct: 1,
            rationale: 'NCLEX clinical judgment starts with recognizing cues and defining the patient problem before selecting interventions.'
        },
        {
            match: ['lecture', 'professional'],
            topic: 'Concept learning',
            stem: 'During a nursing lecture review, which study behavior builds the strongest clinical understanding?',
            options: ['Memorize isolated facts only', 'Connect concepts to patient assessment findings', 'Avoid practice questions', 'Read notes once and stop'],
            correct: 1,
            rationale: 'Concepts become useful when connected to assessment findings, priorities, and nursing actions.'
        },
        {
            match: ['pharmacology', 'drug', 'medication'],
            topic: 'Medication safety',
            stem: 'Before administering a high-risk medication, which nursing action is most important?',
            options: ['Give it quickly', 'Check the right patient, order, dose, route, time, and relevant vitals/labs', 'Skip allergies if the patient is busy', 'Document before giving'],
            correct: 1,
            rationale: 'Medication safety depends on verification plus checking relevant contraindications, vitals, labs, and allergies.'
        },
        {
            match: ['pediatric'],
            topic: 'Pediatric safety',
            stem: 'A pediatric medication dose is ordered. Which check is most important before administration?',
            options: ['Adult dose range', 'Weight-based dose calculation', 'Parent preference only', 'Medication color'],
            correct: 1,
            rationale: 'Pediatric medication safety depends heavily on accurate weight-based dosing.'
        },
        {
            match: ['clinical', 'med-surg', 'surg'],
            topic: 'Med-surg prioritization',
            stem: 'In med-surg prioritization, which patient should usually be assessed first?',
            options: ['A stable patient awaiting discharge teaching', 'A patient with new shortness of breath', 'A patient asking for a blanket', 'A patient with unchanged chronic pain'],
            correct: 1,
            rationale: 'New breathing difficulty may indicate acute deterioration and should be prioritized.'
        }
    ];

    function getPracticeTemplate(course) {
        const text = `${course?.title || ''} ${course?.category || ''} ${course?.summary || ''}`.toLowerCase();
        return PRACTICE_TEMPLATES.find((item) => item.match.some((term) => text.includes(term))) || {
            match: [],
            topic: 'Safe nursing reasoning',
            stem: `For ${course?.title || 'this nursing course'}, what is the best way to approach a difficult exam question?`,
            options: ['Guess quickly', 'Identify key cues, eliminate unsafe options, and choose the safest nursing action', 'Ignore the stem details', 'Choose based only on memory'],
            correct: 1,
            rationale: 'Most nursing questions test safe reasoning: cues, priority, elimination, and patient-centered action.'
        };
    }

    function initPracticeQuestions() {
        const select = $('#practiceCourseSelect');
        const generateBtn = $('#generatePracticeBtn');
        const card = $('#practiceQuestionCard');
        const countInput = $('#practiceQuestionCount');
        const scoreCard = $('#practiceScoreCard');
        if (!select || !generateBtn || !card) return;

        const courses = window.GnpLearning?.getCourses ? window.GnpLearning.getCourses() : window.GnpLearning?.COURSE_META || [];
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a course to begin';
        select.appendChild(placeholder);
        courses.forEach((course) => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.title} (${course.category || 'Nursing'})`;
            select.appendChild(option);
        });

        let activeCourseId = '';
        let session = null;

        function renderSessionScore() {
            if (!scoreCard || !session) return;
            const answered = session.answers.filter((item) => item !== null).length;
            const percentage = answered === 0 ? 0 : Math.round((session.correct / answered) * 100);
            const complete = answered === session.total;
            scoreCard.classList.remove('hidden');
            scoreCard.innerHTML = `
                <div>
                    <span class="panel-kicker">${complete ? 'Final score' : 'Live score'}</span>
                    <strong>${percentage}%</strong>
                </div>
                <div class="practice-meter" aria-label="Practice percentage">
                    <span style="width: ${percentage}%"></span>
                </div>
            `;
        }

        function getQuestionCount() {
            const raw = Number(countInput?.value || 10);
            if (!Number.isFinite(raw)) return 10;
            return Math.max(1, Math.min(100, Math.round(raw)));
        }

        function showSelectPrompt() {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Start practice';
            scoreCard?.classList.add('hidden');
            card.classList.add('hidden');
            card.innerHTML = '<div class="muted small">Select a course and enter how many questions you want.</div>';
        }

        function activateSelectedCourse() {
            activeCourseId = select.value;
            const course = courses.find((item) => item.id === activeCourseId);
            if (!course) {
                showSelectPrompt();
                return;
            }
            session = null;
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate questions';
            card.classList.add('hidden');
            scoreCard?.classList.add('hidden');
            card.innerHTML = '<div class="muted small">Enter how many questions you want, then start practice.</div>';
        }

        function buildQuestionSet(course, total) {
            return Array.from({ length: total }, (_, index) => {
                const template = getPracticeTemplate(course);
                return {
                    ...template,
                    number: index + 1,
                    stem: index === 0 ? template.stem : `${template.stem} (Practice round ${index + 1})`
                };
            });
        }

        function startPracticeSet() {
            const course = courses.find((item) => item.id === activeCourseId || item.id === select.value);
            if (!course) return;
            activeCourseId = course.id;
            const total = getQuestionCount();
            if (countInput) countInput.value = String(total);
            session = {
                course,
                total,
                currentIndex: 0,
                correct: 0,
                answers: Array(total).fill(null),
                weakAreas: {},
                questions: buildQuestionSet(course, total)
            };
            renderSessionScore();
            renderCurrentQuestion();
        }

        function renderCurrentQuestion() {
            if (!session) return;
            const template = session.questions[session.currentIndex];
            card.innerHTML = '';
            card.classList.remove('hidden');

            const meta = document.createElement('div');
            meta.className = 'badge-row';
            meta.innerHTML = `
                <span class="badge">${session.course.category || 'Course'}</span>
                <span class="badge alt">Question ${template.number} of ${session.total}</span>
                <span class="badge">${template.topic}</span>
            `;

            const title = document.createElement('h4');
            title.textContent = template.stem;

            const optionsWrap = document.createElement('div');
            optionsWrap.className = 'practice-option-list';

            const feedback = document.createElement('div');
            feedback.className = 'practice-feedback hidden';
            let answered = false;
            let next = null;

            template.options.forEach((optionText, index) => {
                const option = document.createElement('label');
                option.className = 'practice-option';
                option.innerHTML = `
                    <input type="checkbox" value="${index}">
                    <span>${optionText}</span>
                `;
                option.addEventListener('click', () => {
                    if (answered) return;
                    answered = true;
                    const isCorrect = index === template.correct;
                    const checkbox = option.querySelector('input');
                    if (checkbox) checkbox.checked = true;
                    Array.from(optionsWrap.children).forEach((child) => {
                        const input = child.querySelector('input');
                        if (input) input.disabled = true;
                    });
                    option.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
                    if (!isCorrect) {
                        optionsWrap.children[template.correct]?.classList.add('is-correct');
                    }
                    session.answers[session.currentIndex] = isCorrect;
                    if (isCorrect) {
                        session.correct += 1;
                    } else {
                        session.weakAreas[template.topic] = (session.weakAreas[template.topic] || 0) + 1;
                    }
                    saveCoursePracticeResult(session.course.id, template.topic, isCorrect);
                    const answeredCount = session.answers.filter(Boolean).length + session.answers.filter((item) => item === false).length;
                    const percentage = Math.round((session.correct / answeredCount) * 100);
                    feedback.innerHTML = `
                        <strong>${isCorrect ? 'Correct' : 'Needs review'} - ${percentage}%</strong>
                    `;
                    feedback.classList.remove('hidden');
                    renderSessionScore();
                    if (next) next.disabled = false;
                });
                optionsWrap.appendChild(option);
            });

            next = document.createElement('button');
            next.type = 'button';
            next.className = 'pill-button';
            next.textContent = session.currentIndex === session.total - 1 ? 'Finish and show percentage' : 'Next question';
            next.disabled = true;
            next.addEventListener('click', () => {
                if (session.currentIndex < session.total - 1) {
                    session.currentIndex += 1;
                    renderCurrentQuestion();
                    return;
                }
                const percentage = session.total === 0 ? 0 : Math.round((session.correct / session.total) * 100);
                card.innerHTML = `
                    <div class="practice-finished">
                        <span class="panel-kicker">Practice complete</span>
                        <h4>${percentage}% final score</h4>
                        <p>${session.correct} correct out of ${session.total} questions.</p>
                        <button type="button" class="primary-button" id="restartPracticeBtn">Start another set</button>
                    </div>
                `;
                renderSessionScore();
                $('#restartPracticeBtn')?.addEventListener('click', startPracticeSet);
            });

            card.append(meta, title, optionsWrap, feedback, next);
        }

        select.addEventListener('change', activateSelectedCourse);
        generateBtn.addEventListener('click', startPracticeSet);
        showSelectPrompt();
    }

    function buildTutorAnswer(title, category, details) {
        const combined = `${title} ${details}`.toLowerCase();
        if (combined.includes('insulin') || combined.includes('medication') || category === 'Pharmacology') {
            return 'Start with medication safety: identify the drug class, check the order, allergies, dose, route, time, and relevant vitals/labs. For insulin, connect onset, peak, and duration to hypoglycemia risk and meal timing.';
        }
        if (combined.includes('priority') || combined.includes('first') || category === 'Examination') {
            return 'Use a priority framework: assess airway, breathing, circulation, safety, acute changes, and unstable findings first. Eliminate answers that delay assessment or ignore risk.';
        }
        if (combined.includes('child') || combined.includes('pediatric')) {
            return 'For pediatric questions, focus on age, weight-based dosing, growth stage, family-centered care, hydration, respiratory status, and safety.';
        }
        if (combined.includes('anatomy') || category === 'Anatomy') {
            return 'Break the anatomy topic into structure, function, normal findings, abnormal findings, and the nursing action linked to the abnormal clue.';
        }
        return 'A good approach is to identify the key patient cues, decide what is unsafe or abnormal, connect it to the nursing concept, and choose the safest next action. Review the rationale and turn the weak point into a short study note.';
    }

    function renderQuestions(userId, userName) {
        const wrap = $('#questionsList');
        if (!wrap) return;

        const list = getQuestions();
        const recent = list.slice(0, 8);

        wrap.innerHTML = '';

        if (recent.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'muted small';
            empty.textContent = 'No questions yet. Be the first to ask something helpful.';
            wrap.appendChild(empty);
            return;
        }

        recent.forEach((q) => {
            const card = document.createElement('div');
            card.className = 'question-card';

            const title = document.createElement('p');
            title.className = 'question-title';
            title.textContent = q.title;

            const meta = document.createElement('div');
            meta.className = 'question-meta';
            meta.textContent = `${q.category} • ${q.authorName || 'Member'} • ${formatDateTime(q.createdAt)}`;

            const details = document.createElement('div');
            details.className = 'muted';
            details.style.marginTop = '10px';
            details.textContent = q.details;

            const answerList = document.createElement('div');
            answerList.className = 'answer-list';

            const answers = Array.isArray(q.answers) ? q.answers : [];
            if (answers.length > 0) {
                answers.slice(0, 3).forEach((a) => {
                    const item = document.createElement('div');
                    item.className = 'answer';
                    const author = document.createElement('div');
                    author.style.fontWeight = '900';
                    author.style.color = 'var(--navy)';
                    author.textContent = a.authorName || 'Member';

                    const text = document.createElement('div');
                    text.className = 'muted';
                    text.style.marginTop = '6px';
                    text.textContent = a.text || '';

                    const when = document.createElement('div');
                    when.className = 'muted small';
                    when.style.marginTop = '8px';
                    when.textContent = formatDateTime(a.createdAt);

                    item.appendChild(author);
                    item.appendChild(text);
                    item.appendChild(when);
                    answerList.appendChild(item);
                });
            }

            const answerRow = document.createElement('div');
            answerRow.className = 'answer-row';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Write a quick answer...';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'primary-button small';
            btn.textContent = 'Reply';

            btn.addEventListener('click', () => {
                const text = input.value.trim();
                if (!text) return;
                const nextList = getQuestions().map((item) => {
                    if (item.id !== q.id) return item;
                    const nextAnswers = Array.isArray(item.answers) ? [...item.answers] : [];
                    nextAnswers.unshift({
                        id: uid('ans'),
                        text,
                        authorId: userId,
                        authorName: userName,
                        createdAt: new Date().toISOString()
                    });
                    return { ...item, answers: nextAnswers };
                });
                setQuestions(nextList);
                input.value = '';
                renderQuestions(userId, userName);
            });

            answerRow.appendChild(input);
            answerRow.appendChild(btn);

            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(details);
            card.appendChild(answerRow);
            card.appendChild(answerList);
            wrap.appendChild(card);
        });
    }

    function initQuestions(userId, userName) {
        const questionForm = $('#questionForm');
        const askToggle = $('#askQuestionToggle');
        askToggle?.addEventListener('click', () => {
            if (!questionForm) return;
            const isHidden = questionForm.classList.toggle('hidden');
            askToggle.setAttribute('aria-expanded', String(!isHidden));
            askToggle.textContent = isHidden ? 'Ask your own question' : 'Hide question form';
        });

        $('#questionForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            const titleEl = $('#questionTitle');
            const categoryEl = $('#questionCategory');
            const detailsEl = $('#questionDetails');
            if (!titleEl || !categoryEl || !detailsEl) return;

            const title = titleEl.value.trim();
            const category = categoryEl.value;
            const details = detailsEl.value.trim();
            if (!title || !details) return;

            const next = [
                {
                    id: uid('q'),
                    title,
                    category,
                    details,
                    authorId: userId,
                    authorName: userName,
                    createdAt: new Date().toISOString(),
                    answers: [
                        {
                            id: uid('ans'),
                            text: buildTutorAnswer(title, category, details),
                            authorId: 'system',
                            authorName: 'Global NursePrep Tutor',
                            createdAt: new Date().toISOString()
                        }
                    ]
                },
                ...getQuestions()
            ];

            setQuestions(next);
            titleEl.value = '';
            detailsEl.value = '';
            renderQuestions(userId, userName);
            renderProfileCounts(userId);
        });

        renderQuestions(userId, userName);
        initPracticeQuestions();
    }

    function renderProfileCounts(userId) {
        const enrolled = getUserEnrollments(userId);
        const goals = getUserGoals(userId);
        const questions = getQuestions().filter((q) => q.authorId === userId);

        const enrolledLabel = $('#profileEnrollments');
        if (enrolledLabel) enrolledLabel.textContent = String(enrolled.length);

        const goalsLabel = $('#profileGoals');
        if (goalsLabel) goalsLabel.textContent = String(goals.length);

        const qLabel = $('#profileQuestions');
        if (qLabel) qLabel.textContent = String(questions.length);
    }

    function initSettings() {
        $$('.pill-toggle[data-text-size]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const settings = getUiSettings();
                const next = { ...settings, textSize: btn.dataset.textSize || 'normal' };
                setUiSettings(next);
                applyUiSettings();
            });
        });

        $('#reduceMotionToggle')?.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) return;
            const settings = getUiSettings();
            const next = { ...settings, reduceMotion: target.checked === true };
            setUiSettings(next);
            applyUiSettings();
        });

        applyUiSettings();
    }

    function initYear() {
        const year = new Date().getFullYear();
        const yearLabel = $('#yearLabel');
        if (yearLabel) yearLabel.textContent = String(year);
    }

    function main() {
        const session = requireSession();
        if (!session) return;

        const users = getUsers();
        const user = users.find((u) => u.id === session.userId) || { name: session.name || 'Member', email: session.email || '—' };

        const membership = getUserMembership(session.userId);
        renderUserSummary(user, membership);

        initDrawerNav();
        initLogout();
        initSettings();
        initYear();

        initCourses(session.userId);
        renderExamChecklist(session.userId);

        initCareerPaths();
        initGoals(session.userId);
        renderMemberships(session.userId);
        initQuestions(session.userId, user.name || 'Member');

        renderProfileCounts(session.userId);
    }

    document.addEventListener('DOMContentLoaded', main);
})();
