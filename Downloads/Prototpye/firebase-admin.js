let cachedAdmin = null;

function initFirebaseAdmin() {
    if (cachedAdmin) return cachedAdmin;

    let admin;
    try {
        // Optional dependency. Install with: npm i firebase-admin
        admin = require("firebase-admin");
    } catch {
        return null;
    }

    if (admin.apps && admin.apps.length > 0) {
        cachedAdmin = admin;
        return admin;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
        return null;
    }

    const privateKey = String(privateKeyRaw).replace(/\\n/g, "\n");

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined
    });

    cachedAdmin = admin;
    return admin;
}

module.exports = { initFirebaseAdmin };

