(function () {
  const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
  const LOCK_MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 1000 * 60 * 10;

  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  const rememberMe = document.getElementById("rememberMe");
  const message = document.getElementById("loginMessage");

  if (!form || !usernameInput || !passwordInput || !rememberMe || !message) {
    return;
  }

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem("rugbyGemUsers") || "[]");
  }

  function saveUsers(users) {
    localStorage.setItem("rugbyGemUsers", JSON.stringify(users));
  }

  function getAttempts() {
    return JSON.parse(localStorage.getItem("rugbyGemLoginAttempts") || "{}");
  }

  function saveAttempts(attempts) {
    localStorage.setItem("rugbyGemLoginAttempts", JSON.stringify(attempts));
  }

  function formatWaitTime(ms) {
    const mins = Math.ceil(ms / 60000);
    return mins + (mins === 1 ? " minute" : " minutes");
  }

  async function sha256(text) {
    if (!window.crypto || !window.crypto.subtle) {
      return "plain:" + text;
    }
    const data = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function isSessionValid() {
    const currentUser = localStorage.getItem("rugbyGemCurrentUser");
    const sessionAt = Number(localStorage.getItem("rugbyGemSessionAt"));
    if (!currentUser || !sessionAt) {
      return false;
    }
    return Date.now() - sessionAt <= SESSION_MAX_AGE_MS;
  }

  if (isSessionValid()) {
    window.location.replace("home.html");
    return;
  }

  const rememberedUsername = localStorage.getItem("rugbyGemRememberedUsername");
  if (rememberedUsername) {
    usernameInput.value = rememberedUsername;
    rememberMe.checked = true;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = normalizeUsername(usernameInput.value);
    const password = passwordInput.value;

    if (!username || !password) {
      showMessage("Please enter both username and password.", "error");
      return;
    }

    const attempts = getAttempts();
    const lockInfo = attempts[username] || { count: 0, lockUntil: 0 };
    if (lockInfo.lockUntil && Date.now() < lockInfo.lockUntil) {
      const waitMs = lockInfo.lockUntil - Date.now();
      showMessage("Account temporarily locked. Try again in " + formatWaitTime(waitMs) + ".", "error");
      return;
    }

    const users = getUsers();
    const userIndex = users.findIndex(function (user) {
      const storedUsername = normalizeUsername(user.username || user.fullName || user.email);
      return storedUsername === username;
    });
    const matchedUser = userIndex >= 0 ? users[userIndex] : null;

    if (!matchedUser) {
      lockInfo.count += 1;
      if (lockInfo.count >= LOCK_MAX_ATTEMPTS) {
        lockInfo.lockUntil = Date.now() + LOCK_DURATION_MS;
        lockInfo.count = 0;
      }
      attempts[username] = lockInfo;
      saveAttempts(attempts);
      showMessage("We could not match that username/password.", "error");
      return;
    }

    const inputHash = await sha256(password);
    const storedHash = matchedUser.passwordHash || "";
    const isLegacyMatch = matchedUser.password && matchedUser.password === password;
    const isHashMatch = storedHash && storedHash === inputHash;

    if (!isLegacyMatch && !isHashMatch) {
      lockInfo.count += 1;
      if (lockInfo.count >= LOCK_MAX_ATTEMPTS) {
        lockInfo.lockUntil = Date.now() + LOCK_DURATION_MS;
        lockInfo.count = 0;
      }
      attempts[username] = lockInfo;
      saveAttempts(attempts);
      showMessage("We could not match that username/password.", "error");
      return;
    }

    if (isLegacyMatch && !storedHash) {
      matchedUser.passwordHash = inputHash;
      delete matchedUser.password;
      users[userIndex] = matchedUser;
      saveUsers(users);
    }

    delete attempts[username];
    saveAttempts(attempts);

    if (rememberMe.checked) {
      localStorage.setItem("rugbyGemRememberedUsername", username);
    } else {
      localStorage.removeItem("rugbyGemRememberedUsername");
    }

    localStorage.setItem("rugbyGemCurrentUser", username);
    localStorage.setItem("rugbyGemSessionAt", String(Date.now()));
    showMessage("Login successful. Welcome back!", "success");
    setTimeout(function () {
      window.location.replace("home.html");
    }, 500);
  });
})();
