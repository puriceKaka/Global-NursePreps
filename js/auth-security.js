window.GnpAuthSecurity = (() => {
    const PASSWORD_POLICY_TEXT = "Use at least 8 characters with uppercase, lowercase, a number, and a symbol.";
    const encoder = new TextEncoder();

    function bytesToHex(bytes) {
        return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    function randomHex(byteLength = 16) {
        const bytes = new Uint8Array(byteLength);
        if (window.crypto?.getRandomValues) {
            window.crypto.getRandomValues(bytes);
            return bytesToHex(bytes);
        }
        return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.padEnd(byteLength * 2, "0").slice(0, byteLength * 2);
    }

    function createClientToken(prefix = "gnp") {
        return `${prefix}_${randomHex(32)}`;
    }

    function createSessionTokens(hours = 8) {
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + hours * 60 * 60 * 1000);
        return {
            tokenType: "Bearer",
            authToken: createClientToken("gnp_access"),
            refreshToken: createClientToken("gnp_refresh"),
            issuedAt: issuedAt.toISOString(),
            expiresAt: expiresAt.toISOString()
        };
    }

    function isSessionValid(session) {
        if (!session?.userId || !session?.authToken) return false;
        const expires = Date.parse(session.expiresAt || "");
        return Number.isFinite(expires) && expires > Date.now();
    }

    async function sha256Hex(text) {
        if (!window.crypto?.subtle) return text;
        const hash = await window.crypto.subtle.digest("SHA-256", encoder.encode(text));
        return bytesToHex(new Uint8Array(hash));
    }

    async function pbkdf2Hex(password, salt, iterations = 120000) {
        if (!window.crypto?.subtle) {
            return sha256Hex(`${salt}:${password}`);
        }
        const key = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
        const bits = await window.crypto.subtle.deriveBits({
            name: "PBKDF2",
            hash: "SHA-256",
            salt: encoder.encode(salt),
            iterations
        }, key, 256);
        return bytesToHex(new Uint8Array(bits));
    }

    function validatePassword(password) {
        const value = String(password || "");
        const missing = [];
        if (value.length < 8) missing.push("8 characters");
        if (!/[A-Z]/.test(value)) missing.push("one uppercase letter");
        if (!/[a-z]/.test(value)) missing.push("one lowercase letter");
        if (!/[0-9]/.test(value)) missing.push("one number");
        if (!/[^A-Za-z0-9]/.test(value)) missing.push("one symbol");

        return {
            ok: missing.length === 0,
            missing,
            message: missing.length ? `Password must include ${missing.join(", ")}.` : ""
        };
    }

    async function createPasswordRecord(password) {
        const salt = randomHex(16);
        const iterations = 120000;
        return {
            passwordHash: await pbkdf2Hex(password, salt, iterations),
            passwordSalt: salt,
            passwordIterations: iterations,
            passwordVersion: 2
        };
    }

    async function verifyPassword(password, account) {
        if (!account) return false;
        if (account.passwordVersion === 2 && account.passwordSalt && account.passwordHash) {
            const iterations = Number(account.passwordIterations || 120000);
            return (await pbkdf2Hex(password, account.passwordSalt, iterations)) === account.passwordHash;
        }
        return (await sha256Hex(password)) === account.passwordHash;
    }

    async function upgradePasswordIfNeeded(password, account, save) {
        if (!account || account.passwordVersion === 2 || typeof save !== "function") return;
        const record = await createPasswordRecord(password);
        save({ ...account, ...record, passwordUpgradedAt: new Date().toISOString() });
    }

    return {
        PASSWORD_POLICY_TEXT,
        validatePassword,
        createPasswordRecord,
        verifyPassword,
        upgradePasswordIfNeeded,
        sha256Hex,
        createClientToken,
        createSessionTokens,
        isSessionValid
    };
})();
