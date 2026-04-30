const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initFirebaseAdmin } = require('./firebase-admin');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/login.html`);
});

// --- API (DB-ready scaffold) ---
const learningStates = new Map();

app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/learning/state', async (req, res) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
        res.status(400).json({ ok: false, error: 'Missing userId' });
        return;
    }

    const admin = initFirebaseAdmin();
    if (admin) {
        try {
            const snap = await admin.firestore().collection('learningStates').doc(userId).get();
            res.json({ ok: true, state: snap.exists ? snap.data()?.state || null : null, source: 'firestore' });
            return;
        } catch (error) {
            res.status(500).json({ ok: false, error: String(error?.message || error) });
            return;
        }
    }

    res.json({ ok: true, state: learningStates.get(userId) || null, source: 'memory' });
});

app.put('/api/learning/state', async (req, res) => {
    const userId = String(req.body?.userId || '').trim();
    const state = req.body?.state ?? null;
    if (!userId) {
        res.status(400).json({ ok: false, error: 'Missing userId' });
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
            res.json({ ok: true, saved: true, source: 'firestore' });
            return;
        } catch (error) {
            res.status(500).json({ ok: false, error: String(error?.message || error) });
            return;
        }
    }

    learningStates.set(userId, state);
    res.json({ ok: true, saved: true, source: 'memory' });
});

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
