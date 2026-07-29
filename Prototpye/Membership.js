(() => {
    const STORAGE_KEYS = {
        session: 'nurseprep_session',
        membershipsByUser: 'nurseprep_membership_by_user',
        groupsByUser: 'nurseprep_groups_by_user'
    };

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

    const GROUPS = [
        { id: 'anatomy', name: 'Human Anatomy', desc: 'Systems review, clinical landmarks, A&P drills.' },
        { id: 'pharm', name: 'Pharmacology', desc: 'Drug classes, calculations, interactions, safety checks.' },
        { id: 'osce', name: 'OSCE Practice', desc: 'Stations practice, checklists, feedback and repetition.' },
        { id: 'icu', name: 'Critical Care (ICU)', desc: 'ABG basics, sepsis recognition, monitoring, escalation.' },
        { id: 'peds', name: 'Pediatrics', desc: 'Family-centered care, dosing, assessment, red flags.' },
        { id: 'career', name: 'Career Clinic', desc: 'CV review, interviews, specialties, career goals.' }
    ];

    const $ = (selector) => document.querySelector(selector);

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== 'string' || raw.trim() === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function loadJson(key, fallback) {
        return safeJsonParse(localStorage.getItem(key), fallback);
    }

    function saveJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getMap(key) {
        const data = loadJson(key, {});
        return data && typeof data === 'object' ? data : {};
    }

    function requireSession() {
        const session = loadJson(STORAGE_KEYS.session, null);
        if (!session || !session.userId) {
            window.location.replace('login.html');
            return null;
        }
        return session;
    }

    function getSelectedPlan(userId) {
        const map = getMap(STORAGE_KEYS.membershipsByUser);
        return map[userId] || null;
    }

    function setSelectedPlan(userId, planId) {
        const map = getMap(STORAGE_KEYS.membershipsByUser);
        map[userId] = planId;
        saveJson(STORAGE_KEYS.membershipsByUser, map);
    }

    function getUserGroups(userId) {
        const map = getMap(STORAGE_KEYS.groupsByUser);
        return Array.isArray(map[userId]) ? map[userId] : [];
    }

    function setUserGroups(userId, groups) {
        const map = getMap(STORAGE_KEYS.groupsByUser);
        map[userId] = groups;
        saveJson(STORAGE_KEYS.groupsByUser, map);
    }

    function renderSelectedLabel(userId) {
        const label = $('#selectedPlanLabel');
        if (!label) return;
        const planId = getSelectedPlan(userId);
        const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
        label.textContent = plan ? plan.title : 'Not selected';
    }

    function renderPlans(userId) {
        const grid = $('#plansGrid');
        if (!grid) return;
        const selected = getSelectedPlan(userId);
        grid.innerHTML = '';

        MEMBERSHIP_PLANS.forEach((plan) => {
            const card = document.createElement('div');
            card.className = 'plan-card';

            const tags = document.createElement('div');
            tags.className = 'tag-row';
            tags.innerHTML = `
                <span class="tag">${plan.price}</span>
                <span class="tag alt">${selected === plan.id ? 'Selected' : 'Choose'}</span>
            `;

            const title = document.createElement('h4');
            title.textContent = plan.title;

            const desc = document.createElement('p');
            desc.className = 'muted';
            desc.textContent = plan.description;

            const list = document.createElement('ul');
            plan.features.forEach((f) => {
                const li = document.createElement('li');
                li.textContent = f;
                list.appendChild(li);
            });

            const actions = document.createElement('div');
            actions.className = 'plan-actions';

            const joinBtn = document.createElement('button');
            joinBtn.type = 'button';
            joinBtn.className = selected === plan.id ? 'secondary-button' : 'primary-button';
            joinBtn.textContent = selected === plan.id ? 'Selected' : 'Join plan';

            joinBtn.addEventListener('click', () => {
                setSelectedPlan(userId, plan.id);
                renderSelectedLabel(userId);
                renderPlans(userId);
            });

            const homeBtn = document.createElement('a');
            homeBtn.className = 'pill-button';
            homeBtn.href = 'homepage.html#memberships';
            homeBtn.textContent = 'View on homepage';

            actions.appendChild(joinBtn);
            actions.appendChild(homeBtn);

            card.appendChild(tags);
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(list);
            card.appendChild(actions);
            grid.appendChild(card);
        });
    }

    function renderGroups(userId) {
        const grid = $('#groupsGrid');
        if (!grid) return;
        const selectedGroups = new Set(getUserGroups(userId));
        grid.innerHTML = '';

        GROUPS.forEach((group) => {
            const card = document.createElement('div');
            card.className = 'group-card';

            const title = document.createElement('strong');
            title.textContent = group.name;

            const desc = document.createElement('div');
            desc.className = 'muted';
            desc.textContent = group.desc;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = selectedGroups.has(group.id) ? 'secondary-button' : 'primary-button';
            btn.textContent = selectedGroups.has(group.id) ? 'Joined' : 'Join group';

            btn.addEventListener('click', () => {
                const next = new Set(getUserGroups(userId));
                if (next.has(group.id)) next.delete(group.id);
                else next.add(group.id);
                setUserGroups(userId, Array.from(next));
                renderGroups(userId);
            });

            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(btn);
            grid.appendChild(card);
        });
    }

    function initLogout() {
        $('#logoutBtn')?.addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEYS.session);
            window.location.replace('login.html');
        });
    }

    function main() {
        const session = requireSession();
        if (!session) return;

        initLogout();
        renderSelectedLabel(session.userId);
        renderPlans(session.userId);
        renderGroups(session.userId);
    }

    document.addEventListener('DOMContentLoaded', main);
})();
