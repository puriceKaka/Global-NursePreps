const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
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

const memoryUsers = new Map();

app.use((req, res, next) => {
    res.locals.requestId = requestId();
    res.setHeader('X-Request-Id', res.locals.requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)');
    next();
});

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

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

    sendOk(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
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

    sendOk(res, {
        token: createSessionToken(user),
        user: { id: user.id, name: user.name, email: user.email, role: user.role || 'student' }
    });
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
