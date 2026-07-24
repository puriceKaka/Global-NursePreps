const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const { initFirebaseAdmin } = require('./firebase-admin');

const app = express();
app.disable('x-powered-by');
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

function requestId() {
    return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function sendOk(res, data = {}, status = 200) {
    res.status(status).json({ ok: true, requestId: res.locals.requestId, ...data });
}

function sendError(res, status, message, code = 'REQUEST_FAILED') {
    res.status(status).json({ ok: false, requestId: res.locals.requestId, code, error: message });
}

function cleanText(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function splitSentences(value, limit = 4) {
    return cleanText(value)
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, limit);
}

function splitParagraphs(value) {
    return cleanText(value)
        .split(/\n{2,}/)
        .map((part) => part.replace(/\s+\n/g, ' ').trim())
        .filter(Boolean);
}

function titleCase(value) {
    return String(value || '')
        .split(/[\s_-]+/)
        .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
        .filter(Boolean)
        .join(' ');
}

function extractKeywords(text, limit = 4) {
    const stopwords = new Set([
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'about', 'will', 'have', 'are', 'was',
        'were', 'been', 'use', 'used', 'using', 'lesson', 'lessons', 'pdf', 'notes', 'course', 'nursing', 'patient',
        'patients', 'study', 'teacher', 'student', 'students', 'clinical', 'care', 'should', 'would', 'could', 'also',
        'their', 'there', 'then', 'than', 'when', 'what', 'which', 'where', 'while', 'after', 'before', 'over',
        'under', 'through', 'during', 'each', 'more', 'most', 'less', 'very', 'into', 'onto', 'because', 'being'
    ]);
    const counts = new Map();
    String(text || '')
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((word) => word.trim())
        .filter((word) => word.length > 3 && !stopwords.has(word))
        .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([word]) => titleCase(word));
}

function deriveLessonTitle(chunk, index) {
    const firstLine = splitParagraphs(chunk)[0] || splitSentences(chunk, 1)[0] || `Lesson ${index + 1}`;
    const cleaned = firstLine.replace(/^[\d.\-\s:]+/, '').trim();
    const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
    return titleCase(words || `Lesson ${index + 1}`);
}

function buildGeneratedLessons(sourceText, fileName = 'Uploaded PDF') {
    const text = cleanText(sourceText);
    const paragraphs = splitParagraphs(text);
    const chunks = [];
    if (paragraphs.length >= 3) {
        const perChunk = Math.ceil(paragraphs.length / 3);
        for (let i = 0; i < 3; i += 1) {
            chunks.push(paragraphs.slice(i * perChunk, (i + 1) * perChunk).join('\n\n'));
        }
    } else {
        const words = text.split(/\s+/).filter(Boolean);
        const perChunk = Math.max(1, Math.ceil(words.length / 3));
        for (let i = 0; i < 3; i += 1) {
            chunks.push(words.slice(i * perChunk, (i + 1) * perChunk).join(' '));
        }
    }

    return chunks.map((chunk, index) => {
        const lessonText = cleanText(chunk || text);
        const title = deriveLessonTitle(lessonText || fileName, index);
        const keywords = extractKeywords(lessonText, 3);
        const overview = splitSentences(lessonText, 3);
        return {
            title: `${title}`,
            lectureTitle: `PDF lesson ${index + 1}`,
            objective: `Understand ${title} from the uploaded source and apply it in nursing practice.`,
            body: lessonText || text || `Uploaded source material from ${fileName}.`,
            concepts: [
                keywords[0] || title,
                keywords[1] || 'Assessment cues',
                keywords[2] || 'Safe action'
            ],
            summary: overview.join(' ') || `Auto-generated lesson from ${fileName}.`
        };
    }).filter((lesson) => lesson.body);
}

function pdfDataUrlToBuffer(dataUrl) {
    const value = String(dataUrl || '');
    const match = value.match(/^data:application\/pdf(?:;charset=[^;]+)?;base64,(.+)$/i);
    const base64 = match ? match[1] : value.replace(/^data:[^,]+,/, '');
    return Buffer.from(base64, 'base64');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex'), iterations = 210000) {
    const hash = crypto.pbkdf2Sync(String(password), salt, iterations, 32, 'sha256').toString('hex');
    return { passwordHash: hash, passwordSalt: salt, passwordIterations: iterations, passwordVersion: 3 };
}

function verifyPassword(password, account) {
    if (!account?.passwordHash || !account?.passwordSalt) return false;
    const record = hashPassword(password, account.passwordSalt, Number(account.passwordIterations || 210000));
    const expected = Buffer.from(String(account.passwordHash), 'hex');
    const actual = Buffer.from(record.passwordHash, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

function validatePassword(password) {
    const value = String(password || '');
    return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function parseCookies(req) {
    return String(req.headers.cookie || '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((cookies, part) => {
            const idx = part.indexOf('=');
            const key = idx === -1 ? part : part.slice(0, idx);
            const value = idx === -1 ? '' : part.slice(idx + 1);
            if (key) {
                cookies[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
            return cookies;
        }, {});
}

function serializeCookie(name, value, options = {}) {
    const segments = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
    const maxAge = Number(options.maxAge);
    if (Number.isFinite(maxAge) && maxAge >= 0) {
        segments.push(`Max-Age=${Math.floor(maxAge)}`);
    }
    if (options.expires instanceof Date) {
        segments.push(`Expires=${options.expires.toUTCString()}`);
    }
    segments.push(`Path=${options.path || '/'}`);
    if (options.httpOnly !== false) segments.push('HttpOnly');
    if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
    if (options.secure) segments.push('Secure');
    return segments.join('; ');
}

function getAuthToken(req) {
    const header = String(req.headers.authorization || '');
    if (header.toLowerCase().startsWith('bearer ')) {
        return header.slice(7).trim();
    }
    const cookies = parseCookies(req);
    return String(cookies.gnp_admin_session || cookies.gnp_session || '').trim();
}

function createSessionToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role || 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    })).toString('base64url');
    const secret = process.env.JWT_SECRET || 'dev-change-this-secret';
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
}

function verifySessionToken(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const secret = process.env.JWT_SECRET || 'dev-change-this-secret';
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) return null;
    try {
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!decoded?.sub || Number(decoded.exp || 0) <= Math.floor(Date.now() / 1000)) return null;
        return decoded;
    } catch {
        return null;
    }
}

const memoryUsers = new Map();
const memoryAdminStore = {
    profile: null,
    state: null
};
const SESSION_COOKIE = 'gnp_session';
const ADMIN_SESSION_COOKIE = 'gnp_admin_session';
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const STUDENT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function buildDefaultAdminState() {
    const createdAt = new Date().toISOString();
    return {
        courses: [],
        lecturers: [],
        groups: [],
        meetings: [],
        exams: [],
        resources: [],
        payments: [
            {
                id: 'pay_student_1',
                payerRole: 'student',
                payerName: 'Student Account',
                item: 'NCLEX-RN Comprehensive Prep',
                method: 'M-Pesa',
                amount: 3500,
                status: 'recorded',
                createdAt
            },
            {
                id: 'pay_lecturer_1',
                payerRole: 'lecturer',
                payerName: 'Nurse Educator',
                item: 'Professional Lecturer Subscription',
                method: 'PayPal',
                amount: 2500,
                status: 'recorded',
                createdAt
            }
        ]
    };
}

function normalizeAdminState(candidate = {}) {
    const state = candidate && typeof candidate === 'object' ? candidate : {};
    const defaults = buildDefaultAdminState();
    return {
        courses: Array.isArray(state.courses) ? state.courses : defaults.courses,
        lecturers: Array.isArray(state.lecturers) ? state.lecturers : defaults.lecturers,
        groups: Array.isArray(state.groups) ? state.groups : defaults.groups,
        meetings: Array.isArray(state.meetings) ? state.meetings : defaults.meetings,
        exams: Array.isArray(state.exams) ? state.exams : defaults.exams,
        resources: Array.isArray(state.resources) ? state.resources : defaults.resources,
        payments: Array.isArray(state.payments) ? state.payments : defaults.payments
    };
}

function normalizeAdminProfile(profile) {
    if (!profile) return null;
    return {
        ...profile,
        email: String(profile.email || '').trim().toLowerCase(),
        role: 'admin'
    };
}

function adminConfigReady() {
    return Boolean(process.env.ADMIN_SETUP_KEY);
}

function adminCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ADMIN_SESSION_TTL_MS / 1000
    };
}

function issueAdminCookie(res, token) {
    res.setHeader('Set-Cookie', serializeCookie(ADMIN_SESSION_COOKIE, token, adminCookieOptions()));
}

function clearAdminCookie(res) {
    res.setHeader('Set-Cookie', serializeCookie(ADMIN_SESSION_COOKIE, '', {
        ...adminCookieOptions(),
        maxAge: 0,
        expires: new Date(0)
    }));
}

function sessionCookieOptions() {
    return {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: STUDENT_SESSION_TTL_MS / 1000
    };
}

function issueSessionCookie(res, token) {
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, token, sessionCookieOptions()));
}

function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, '', {
        ...sessionCookieOptions(),
        maxAge: 0,
        expires: new Date(0)
    }));
}

function getSessionFromRequest(req) {
    const token = getAuthToken(req);
    const decoded = verifySessionToken(token);
    if (!decoded || decoded.role !== 'admin') return null;
    return decoded;
}

async function loadAdminProfile(admin) {
    if (!admin) {
        return normalizeAdminProfile(memoryAdminStore.profile);
    }
    const snap = await admin.firestore().collection('adminAuth').doc('primary').get();
    return snap.exists ? normalizeAdminProfile(snap.data()) : null;
}

async function saveAdminProfile(admin, profile) {
    const next = normalizeAdminProfile(profile);
    memoryAdminStore.profile = next;
    if (admin) {
        await admin.firestore().collection('adminAuth').doc('primary').set(next, { merge: true });
    }
    return next;
}

async function loadAdminState(admin) {
    if (!admin) {
        if (!memoryAdminStore.state) {
            memoryAdminStore.state = buildDefaultAdminState();
        }
        return normalizeAdminState(memoryAdminStore.state);
    }
    const snap = await admin.firestore().collection('adminState').doc('main').get();
    const state = snap.exists ? snap.data()?.state : null;
    return normalizeAdminState(state || buildDefaultAdminState());
}

async function saveAdminState(admin, state) {
    const next = normalizeAdminState(state);
    memoryAdminStore.state = next;
    if (admin) {
        await admin.firestore().collection('adminState').doc('main').set({
            state: next,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    return next;
}

async function ensureAdminConfigured(admin) {
    const profile = await loadAdminProfile(admin);
    return Boolean(profile?.email);
}

async function requireAdmin(req, res) {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return null;
    }
    return session;
}

app.use((req, res, next) => {
    res.locals.requestId = requestId();
    res.setHeader('X-Request-Id', res.locals.requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)');
    next();
});

app.use(cors({
    origin: process.env.CORS_ORIGIN || false,
    credentials: true
}));
app.use(express.json({ limit: '15mb' }));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.get('/admin-courses.html', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        res.redirect('/admin.html?next=admin-courses.html');
        return;
    }
    res.sendFile(`${__dirname}/admin-courses.html`);
}));

// --- API (DB-ready scaffold) ---
const learningStates = new Map();

app.get('/api/health', (req, res) => {
    sendOk(res, {
        status: 'healthy',
        stateless: true,
        time: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/ready', asyncRoute(async (req, res) => {
    const admin = initFirebaseAdmin();
    sendOk(res, {
        ready: true,
        database: admin ? 'firestore' : 'memory-fallback',
        loadBalancing: 'use external database/session store for multi-instance deployments'
    });
}));

app.get('/api/admin/status', asyncRoute(async (req, res) => {
    const admin = initFirebaseAdmin();
    const profile = await loadAdminProfile(admin);
    sendOk(res, {
        configured: Boolean(profile?.email),
        bootstrapEnabled: adminConfigReady()
    });
}));

app.post('/api/admin/bootstrap', asyncRoute(async (req, res) => {
    const admin = initFirebaseAdmin();
    const setupKey = String(req.body?.setupKey || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!adminConfigReady()) {
        sendError(res, 503, 'Admin bootstrap is not configured on this server.', 'CONFIGURATION_ERROR');
        return;
    }
    if (!setupKey || setupKey !== String(process.env.ADMIN_SETUP_KEY || '')) {
        sendError(res, 401, 'Invalid admin setup key.', 'INVALID_SETUP_KEY');
        return;
    }
    if (!email || !email.includes('@') || !validatePassword(password)) {
        sendError(res, 400, 'A valid email and strong password are required.', 'VALIDATION_ERROR');
        return;
    }

    const existing = await loadAdminProfile(admin);
    if (existing?.email) {
        sendError(res, 409, 'An admin account already exists.', 'ADMIN_ALREADY_CONFIGURED');
        return;
    }

    const profile = await saveAdminProfile(admin, {
        id: 'admin_primary',
        email,
        role: 'admin',
        ...hashPassword(password),
        createdAt: new Date().toISOString()
    });
    const token = createSessionToken(profile);
    issueAdminCookie(res, token);
    sendOk(res, {
        user: {
            id: profile.id,
            email: profile.email,
            role: 'admin'
        }
    }, 201);
}));

app.post('/api/admin/login', asyncRoute(async (req, res) => {
    const admin = initFirebaseAdmin();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
        sendError(res, 400, 'Email and password are required.', 'VALIDATION_ERROR');
        return;
    }

    const profile = await loadAdminProfile(admin);
    if (!profile?.email) {
        sendError(res, 404, 'No admin account is configured yet.', 'ADMIN_NOT_CONFIGURED');
        return;
    }
    if (profile.email !== email || !verifyPassword(password, profile)) {
        sendError(res, 401, 'Invalid admin email or password.', 'INVALID_CREDENTIALS');
        return;
    }

    const token = createSessionToken({ id: profile.id, email: profile.email, role: 'admin' });
    issueAdminCookie(res, token);
    sendOk(res, {
        user: {
            id: profile.id,
            email: profile.email,
            role: 'admin'
        }
    });
}));

app.post('/api/admin/logout', asyncRoute(async (req, res) => {
    clearAdminCookie(res);
    sendOk(res, { loggedOut: true });
}));

app.get('/api/admin/me', asyncRoute(async (req, res) => {
    const admin = initFirebaseAdmin();
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const profile = await loadAdminProfile(admin);
    if (!profile?.email) {
        sendError(res, 404, 'No admin account is configured yet.', 'ADMIN_NOT_CONFIGURED');
        return;
    }
    sendOk(res, {
        user: {
            id: session.sub,
            email: session.email,
            role: 'admin'
        }
    });
}));

app.get('/api/admin/state', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const admin = initFirebaseAdmin();
    const state = await loadAdminState(admin);
    sendOk(res, { state });
}));

app.put('/api/admin/state', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const admin = initFirebaseAdmin();
    const nextState = await saveAdminState(admin, req.body?.state || {});
    sendOk(res, { state: nextState });
}));

app.post('/api/admin/seed', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const admin = initFirebaseAdmin();
    const current = await loadAdminState(admin);
    const defaults = buildDefaultAdminState();
    const nextState = await saveAdminState(admin, {
        ...current,
        payments: Array.isArray(current.payments) && current.payments.length ? current.payments : defaults.payments
    });
    sendOk(res, { state: nextState });
}));

app.get('/api/admin/courses', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const admin = initFirebaseAdmin();
    const state = await loadAdminState(admin);
    sendOk(res, { courses: state.courses || [] });
}));

app.put('/api/admin/courses', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const admin = initFirebaseAdmin();
    const courses = Array.isArray(req.body?.courses) ? req.body.courses : [];
    const state = await loadAdminState(admin);
    const nextState = await saveAdminState(admin, {
        ...state,
        courses
    });
    sendOk(res, { courses: nextState.courses });
}));

app.post('/api/admin/pdf-to-lessons', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }

    const fileName = String(req.body?.fileName || 'uploaded.pdf').trim();
    const pdfDataUrl = String(req.body?.pdfDataUrl || '').trim();
    if (!pdfDataUrl) {
        sendError(res, 400, 'A PDF file is required.', 'VALIDATION_ERROR');
        return;
    }

    let text = '';
    try {
        const data = await pdfParse(pdfDataUrlToBuffer(pdfDataUrl));
        text = cleanText(data?.text || '');
    } catch (error) {
        sendError(res, 400, 'The uploaded PDF could not be read.', 'PDF_PARSE_FAILED');
        return;
    }

    const lessons = buildGeneratedLessons(text, fileName);
    sendOk(res, {
        fileName,
        contentNotes: text,
        generatedLessons: lessons
    });
}));

app.delete('/api/admin/courses/:courseId', asyncRoute(async (req, res) => {
    const session = getSessionFromRequest(req);
    if (!session) {
        sendError(res, 401, 'Admin login required.', 'ADMIN_AUTH_REQUIRED');
        return;
    }
    const courseId = String(req.params.courseId || '').trim();
    const admin = initFirebaseAdmin();
    const state = await loadAdminState(admin);
    const nextState = await saveAdminState(admin, {
        ...state,
        courses: (state.courses || []).filter((course) => course.id !== courseId)
    });
    sendOk(res, { courses: nextState.courses });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!name || !email || !email.includes('@') || !validatePassword(password)) {
        sendError(res, 400, 'Name, valid email, and strong 8-character password are required.', 'VALIDATION_ERROR');
        return;
    }

    const admin = initFirebaseAdmin();
    const existingMemoryUser = memoryUsers.get(email);
    if (existingMemoryUser) {
        sendError(res, 409, 'Email is already registered.', 'ACCOUNT_EXISTS');
        return;
    }

    const user = {
        id: `user_${crypto.randomBytes(12).toString('hex')}`,
        name,
        email,
        role: 'student',
        ...hashPassword(password),
        createdAt: new Date().toISOString()
    };

    if (admin) {
        const doc = admin.firestore().collection('users').doc(email);
        const existing = await doc.get();
        if (existing.exists) {
            sendError(res, 409, 'Email is already registered.', 'ACCOUNT_EXISTS');
            return;
        }
        await doc.set(user);
    } else {
        memoryUsers.set(email, user);
    }

    const token = createSessionToken(user);
    issueSessionCookie(res, token);
    sendOk(res, {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, 201);
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
        sendError(res, 400, 'Email and password are required.', 'VALIDATION_ERROR');
        return;
    }

    const admin = initFirebaseAdmin();
    let user = memoryUsers.get(email);
    if (admin) {
        const doc = await admin.firestore().collection('users').doc(email).get();
        user = doc.exists ? doc.data() : null;
    }

    if (!user || !verifyPassword(password, user)) {
        sendError(res, 401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
        return;
    }

    const token = createSessionToken(user);
    issueSessionCookie(res, token);
    sendOk(res, {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role || 'student' }
    });
}));

app.get('/api/auth/verify', asyncRoute(async (req, res) => {
    const token = getAuthToken(req);
    const decoded = verifySessionToken(token);
    if (!decoded) {
        sendError(res, 401, 'Invalid or expired token.', 'INVALID_TOKEN');
        return;
    }

    sendOk(res, {
        user: {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role
        },
        expiresAt: new Date(Number(decoded.exp) * 1000).toISOString()
    });
}));

app.get('/api/auth/me', asyncRoute(async (req, res) => {
    const token = getAuthToken(req);
    const decoded = verifySessionToken(token);
    if (!decoded) {
        sendError(res, 401, 'Invalid or expired token.', 'INVALID_TOKEN');
        return;
    }

    sendOk(res, {
        user: {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role
        },
        expiresAt: new Date(Number(decoded.exp) * 1000).toISOString()
    });
}));

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
    clearSessionCookie(res);
    sendOk(res, { loggedOut: true });
}));

app.get('/api/learning/state', asyncRoute(async (req, res) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
        sendError(res, 400, 'Missing userId', 'VALIDATION_ERROR');
        return;
    }

    const admin = initFirebaseAdmin();
    if (admin) {
        try {
            const snap = await admin.firestore().collection('learningStates').doc(userId).get();
            sendOk(res, { state: snap.exists ? snap.data()?.state || null : null, source: 'firestore' });
            return;
        } catch (error) {
            throw error;
        }
    }

    sendOk(res, { state: learningStates.get(userId) || null, source: 'memory' });
}));

app.put('/api/learning/state', asyncRoute(async (req, res) => {
    const userId = String(req.body?.userId || '').trim();
    const state = req.body?.state ?? null;
    if (!userId) {
        sendError(res, 400, 'Missing userId', 'VALIDATION_ERROR');
        return;
    }

    const admin = initFirebaseAdmin();
    if (admin) {
        try {
            await admin.firestore().collection('learningStates').doc(userId).set(
                {
                    state,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                },
                { merge: true }
            );
            sendOk(res, { saved: true, source: 'firestore' });
            return;
        } catch (error) {
            throw error;
        }
    }

    learningStates.set(userId, state);
    sendOk(res, { saved: true, source: 'memory' });
}));

app.use(express.static('.', {
    setHeaders(res, filePath) {
        if (/\.(?:html|css|js)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId, userName, cameraOn = true) => {
        console.log(`User ${userName} (${socket.id}) joining room ${roomId}`);

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userName = userName;

        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }

        const roomUsers = rooms.get(roomId);
        const existingUsers = Array.from(roomUsers.entries()).map(([userId, user]) => ({
            userId,
            userName: user.userName,
            cameraOn: user.cameraOn,
            handRaised: user.handRaised === true
        }));

        roomUsers.set(socket.id, {
            socketId: socket.id,
            userName,
            cameraOn,
            handRaised: false
        });

        socket.emit('room-users', existingUsers);
        socket.to(roomId).emit('user-connected', socket.id, userName, cameraOn);
    });

    socket.on('webrtc-offer', ({ targetUserId, offer, roomId, userName }) => {
        socket.to(targetUserId).emit('webrtc-offer', {
            fromUserId: socket.id,
            roomId,
            userName,
            offer
        });
    });

    socket.on('webrtc-answer', ({ targetUserId, answer }) => {
        socket.to(targetUserId).emit('webrtc-answer', {
            fromUserId: socket.id,
            answer
        });
    });

    socket.on('webrtc-ice-candidate', ({ targetUserId, candidate }) => {
        socket.to(targetUserId).emit('webrtc-ice-candidate', {
            fromUserId: socket.id,
            candidate
        });
    });

    socket.on('leave-room', (roomId) => {
        console.log(`User ${socket.id} leaving room ${roomId}`);

        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(socket.id);
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
            }
        }

        socket.to(roomId).emit('user-disconnected', socket.id);
        socket.leave(roomId);
        socket.data.roomId = null;
    });

    socket.on('chat-message', (roomId, message) => {
        socket.to(roomId).emit('chat-message', message);
    });

    socket.on('camera-state-changed', (roomId, cameraOn) => {
        if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
            rooms.get(roomId).get(socket.id).cameraOn = cameraOn;
        }

        socket.to(roomId).emit('camera-state-changed', {
            userId: socket.id,
            cameraOn
        });
    });

    socket.on('hand-state-changed', (roomId, handRaised) => {
        if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
            rooms.get(roomId).get(socket.id).handRaised = handRaised === true;
        }

        socket.to(roomId).emit('hand-state-changed', {
            userId: socket.id,
            handRaised: handRaised === true
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        rooms.forEach((roomUsers, roomId) => {
            if (roomUsers.has(socket.id)) {
                roomUsers.delete(socket.id);
                socket.to(roomId).emit('user-disconnected', socket.id);
            }

            if (roomUsers.size === 0) {
                rooms.delete(roomId);
            }
        });
    });
});

app.use((req, res) => {
    sendError(res, 404, 'Route not found.', 'NOT_FOUND');
});

app.use((error, req, res, next) => {
    console.error(`[${res.locals.requestId}]`, error);
    if (res.headersSent) {
        next(error);
        return;
    }
    sendError(res, 500, 'A temporary server error occurred. Please try again.', 'SERVER_ERROR');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
    console.log(`${signal} received. Closing server gracefully...`);
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
