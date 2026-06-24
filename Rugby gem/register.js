(function () {
  const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;

  const form = document.getElementById("registerForm");
  const usernameInput = document.getElementById("username");
  const phoneInput = document.getElementById("phone");
  const passwordInput = document.getElementById("regPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const termsInput = document.getElementById("terms");
  const viewTermsBtn = document.getElementById("viewTermsBtn");
  const termsModal = document.getElementById("termsModal");
  const closeTermsBtn = document.getElementById("closeTermsBtn");
  const message = document.getElementById("registerMessage");

  if (!form || !usernameInput || !phoneInput || !passwordInput || !confirmPasswordInput || !termsInput || !message) {
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

  function isSessionValid() {
    const currentUser = localStorage.getItem("rugbyGemCurrentUser");
    const sessionAt = Number(localStorage.getItem("rugbyGemSessionAt"));
    if (!currentUser || !sessionAt) {
      return false;
    }
    return Date.now() - sessionAt <= SESSION_MAX_AGE_MS;
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

  function openTermsModal() {
    if (!termsModal) {
      return;
    }
    termsModal.classList.add("visible");
    termsModal.setAttribute("aria-hidden", "false");
  }

  function closeTermsModal() {
    if (!termsModal) {
      return;
    }
    termsModal.classList.remove("visible");
    termsModal.setAttribute("aria-hidden", "true");
  }

  if (isSessionValid()) {
    window.location.replace("home.html");
    return;
  }

  if (viewTermsBtn) {
    viewTermsBtn.addEventListener("click", openTermsModal);
  }

  if (closeTermsBtn) {
    closeTermsBtn.addEventListener("click", closeTermsModal);
  }

  if (termsModal) {
    termsModal.addEventListener("click", function (event) {
      if (event.target === termsModal) {
        closeTermsModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeTermsModal();
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = normalizeUsername(usernameInput.value);
    const phone = phoneInput.value.trim().replace(/\s+/g, "");
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!username || !phone || !password || !confirmPassword) {
      showMessage("Please fill in all fields.", "error");
      return;
    }

    if (!/^\+?\d{10,15}$/.test(phone)) {
      showMessage("Enter a valid phone number (10 to 15 digits).", "error");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/.test(password)) {
      showMessage("Password needs 8+ chars with uppercase, lowercase, number, and symbol.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    if (!termsInput.checked) {
      showMessage("You must agree to the terms.", "error");
      return;
    }

    const users = getUsers();
    const exists = users.some(function (user) {
      const storedUsername = normalizeUsername(user.username || user.fullName || user.email);
      return storedUsername === username || user.phone === phone;
    });

    if (exists) {
      showMessage("That username or phone is already registered. Please log in.", "error");
      return;
    }

    const passwordHash = await sha256(password);
    users.push({
      username: username,
      fullName: username,
      phone: phone,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    });

    saveUsers(users);
    showMessage("Registration complete. Redirecting to login...", "success");
    form.reset();

    setTimeout(function () {
      window.location.replace("login.html");
    }, 1200);
  });
})();
