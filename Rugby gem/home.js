(function () {
  const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12;
  const layout = document.getElementById("portalLayout");
  const toggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const usernameEl = document.getElementById("portalUsername");
  const topUserAvatar = document.getElementById("topUserAvatar");
  const menuItems = document.querySelectorAll(".menu-item[data-section]");
  const sections = document.querySelectorAll(".portal-section");
  const logoutLink = document.getElementById("logoutLink");
  const paymentForm = document.getElementById("paymentForm");
  const payUserInput = document.getElementById("payUser");
  const payPhoneInput = document.getElementById("payPhone");
  const payMonthInput = document.getElementById("payMonth");
  const payAmountInput = document.getElementById("payAmount");
  const payMethodInput = document.getElementById("payMethod");
  const payAmountPreview = document.getElementById("payAmountPreview");
  const paymentMessage = document.getElementById("paymentMessage");
  const paymentTableBody = document.getElementById("paymentTableBody");
  const paymentTotal = document.getElementById("paymentTotal");
  const profileForm = document.getElementById("profileForm");
  const profileUsernameInput = document.getElementById("profileUsernameInput");
  const profilePhoneInput = document.getElementById("profilePhoneInput");
  const profileOriginInput = document.getElementById("profileOriginInput");
  const profileParentGuardianInput = document.getElementById("profileParentGuardianInput");
  const profileParentGuardianPhoneInput = document.getElementById("profileParentGuardianPhoneInput");
  const profileImageInput = document.getElementById("profileImageInput");
  const profileImagePreview = document.getElementById("profileImagePreview");
  const profileMessage = document.getElementById("profileMessage");
  const submitPlayerDetailsBtn = document.getElementById("submitPlayerDetailsBtn");
  const submitParentGuardianBtn = document.getElementById("submitParentGuardianBtn");
  const openComplaintBtn = document.getElementById("openComplaintBtn");
  const complaintBox = document.getElementById("complaintBox");
  const complaintForm = document.getElementById("complaintForm");
  const complaintText = document.getElementById("complaintText");
  const complaintMessage = document.getElementById("complaintMessage");
  const daysGraph = document.querySelector(".days-graph");
  const daysBars = document.querySelectorAll(".days-fill[data-days]");
  const userDaysName = document.getElementById("userDaysName");
  const userDaysFill = document.getElementById("userDaysFill");
  const userDaysValue = document.getElementById("userDaysValue");
  const playerButtons = document.querySelectorAll(".player-btn");
  const playerGroups = document.querySelectorAll(".player-group");

  if (!layout || !toggle) {
    return;
  }

  const currentUser = localStorage.getItem("rugbyGemCurrentUser");
  const sessionAt = Number(localStorage.getItem("rugbyGemSessionAt"));

  if (!currentUser || !sessionAt || Date.now() - sessionAt > SESSION_MAX_AGE_MS) {
    localStorage.removeItem("rugbyGemCurrentUser");
    localStorage.removeItem("rugbyGemSessionAt");
    window.location.replace("login.html");
    return;
  }

  localStorage.setItem("rugbyGemSessionAt", String(Date.now()));

  const activeUser = currentUser;
  const activeUserNormalized = activeUser.toLowerCase();
  function formatDisplayName(value) {
    return String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }
  const activeUserDisplay = formatDisplayName(activeUser);
  let users = JSON.parse(localStorage.getItem("rugbyGemUsers") || "[]");
  let matchedUser = users.find(function (user) {
    const storedUsername = (user.username || user.fullName || "").trim().toLowerCase();
    return storedUsername === activeUserNormalized;
  });

  if (usernameEl) {
    usernameEl.textContent = activeUserDisplay || "Username";
  }
  if (userDaysName) {
    userDaysName.textContent = activeUserDisplay || "User";
  }

  function renderTopAvatar(imageSrc) {
    if (!topUserAvatar) {
      return;
    }
    const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%25' height='100%25' rx='32' ry='32' fill='%23e5e7eb'/><circle cx='32' cy='24' r='10' fill='%239ca3af'/><rect x='16' y='38' width='32' height='18' rx='9' fill='%239ca3af'/></svg>";
    topUserAvatar.src = imageSrc || defaultAvatar;
    topUserAvatar.style.display = "block";
  }

  if (payUserInput) {
    payUserInput.value = activeUserDisplay || "username";
  }

  if (payPhoneInput) {
    payPhoneInput.value = matchedUser && matchedUser.phone ? matchedUser.phone : "";
  }

  function showProfileMessage(text, type) {
    if (!profileMessage) {
      return;
    }
    profileMessage.innerText = text;
    profileMessage.className = "profile-message " + type;
  }

  function renderProfile() {
    if (!matchedUser) {
      renderTopAvatar("");
      return;
    }
    if (profileUsernameInput) {
      profileUsernameInput.value = matchedUser.username || "";
    }
    if (profilePhoneInput) {
      profilePhoneInput.value = matchedUser.phone || "";
    }
    if (profileOriginInput) {
      profileOriginInput.value = matchedUser.origin || "";
    }
    if (profileParentGuardianInput) {
      profileParentGuardianInput.value = matchedUser.parentGuardian || "";
    }
    if (profileParentGuardianPhoneInput) {
      profileParentGuardianPhoneInput.value = matchedUser.parentGuardianPhone || "";
    }
    if (profileImagePreview) {
      if (matchedUser.profileImage) {
        profileImagePreview.src = matchedUser.profileImage;
        profileImagePreview.style.display = "block";
      } else {
        profileImagePreview.removeAttribute("src");
        profileImagePreview.style.display = "none";
      }
    }
    renderTopAvatar(matchedUser.profileImage || "");
  }

  renderProfile();

  if (payMonthInput) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    payMonthInput.value = now.getFullYear() + "-" + month;
  }

  if (payAmountInput && payAmountPreview) {
    payAmountInput.addEventListener("input", function () {
      const amount = Number(payAmountInput.value);
      if (amount > 0) {
        payAmountPreview.innerText = "You are about to pay KES " + amount.toFixed(2) + " to the team.";
        payAmountPreview.classList.add("visible");
      } else {
        payAmountPreview.innerText = "";
        payAmountPreview.classList.remove("visible");
      }
    });
  }

  if (daysBars.length > 0) {
    const maxDays = Number(daysGraph && daysGraph.dataset.maxDays ? daysGraph.dataset.maxDays : 7) || 7;

    if (matchedUser && userDaysFill) {
      const trainingDaysRaw = Number(matchedUser.trainingDays);
      const trainingDays = Number.isFinite(trainingDaysRaw) ? trainingDaysRaw : Number(userDaysFill.dataset.days || 0);
      const clampedUserDays = Math.max(0, Math.min(maxDays, trainingDays));
      userDaysFill.dataset.days = String(clampedUserDays);
      if (userDaysValue) {
        userDaysValue.textContent = clampedUserDays + (clampedUserDays === 1 ? " day" : " days");
      }
    }

    daysBars.forEach(function (bar) {
      const days = Number(bar.dataset.days);
      const clamped = Math.max(0, Math.min(maxDays, days));
      bar.style.width = (clamped / maxDays) * 100 + "%";
    });
  }

  toggle.addEventListener("click", function () {
    layout.classList.toggle("menu-open");
  });

  document.addEventListener("click", function (event) {
    if (!layout.classList.contains("menu-open")) {
      return;
    }
    const clickedInsideSidebar = sidebar && sidebar.contains(event.target);
    const clickedToggle = toggle.contains(event.target);
    if (!clickedInsideSidebar && !clickedToggle) {
      layout.classList.remove("menu-open");
    }
  });

  function openSection(sectionName) {
    menuItems.forEach(function (item) {
      item.classList.toggle("active", item.dataset.section === sectionName);
    });

    sections.forEach(function (section) {
      section.classList.toggle("active", section.id === "section-" + sectionName);
    });

    layout.classList.remove("menu-open");
  }

  menuItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      openSection(item.dataset.section);
    });
  });

  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      localStorage.removeItem("rugbyGemCurrentUser");
      localStorage.removeItem("rugbyGemSessionAt");
      window.location.replace("login.html");
    });
  }

  function openPlayerGroup(groupName) {
    playerButtons.forEach(function (button) {
      button.classList.toggle("active", button.dataset.playerGroup === groupName);
    });

    playerGroups.forEach(function (group) {
      group.classList.toggle("active", group.id === "player-" + groupName);
    });
  }

  playerButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      openPlayerGroup(button.dataset.playerGroup);
    });
  });

  if (openComplaintBtn && complaintBox) {
    openComplaintBtn.addEventListener("click", function () {
      complaintBox.classList.toggle("visible");
    });
  }

  function showComplaintMessage(text, type) {
    if (!complaintMessage) {
      return;
    }
    complaintMessage.innerText = text;
    complaintMessage.className = "complaint-message " + type;
  }

  if (complaintForm && complaintText) {
    complaintForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const text = complaintText.value.trim();
      if (!text) {
        showComplaintMessage("Please write your complaint first.", "error");
        return;
      }

      const complaints = JSON.parse(localStorage.getItem("rugbyGemComplaints") || "[]");
      complaints.push({
        user: activeUser,
        text: text,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("rugbyGemComplaints", JSON.stringify(complaints));

      complaintText.value = "";
      showComplaintMessage("Complaint sent successfully.", "success");
    });
  }

  if (submitPlayerDetailsBtn) {
    submitPlayerDetailsBtn.addEventListener("click", function () {
      if (!matchedUser) {
        showProfileMessage("No profile found for this user.", "error");
        return;
      }

      const origin = profileOriginInput.value.trim();
      const phone = profilePhoneInput.value.trim().replace(/\s+/g, "");

      if (!origin || !phone) {
        showProfileMessage("Please fill in origin and phone.", "error");
        return;
      }

      if (!/^\+?\d{10,15}$/.test(phone)) {
        showProfileMessage("Use a valid player phone number.", "error");
        return;
      }

      matchedUser.origin = origin;
      matchedUser.phone = phone;
      localStorage.setItem("rugbyGemUsers", JSON.stringify(users));
      if (payPhoneInput) {
        payPhoneInput.value = phone;
      }
      showProfileMessage("Player details saved successfully.", "success");
    });
  }

  if (submitParentGuardianBtn) {
    submitParentGuardianBtn.addEventListener("click", function () {
      if (!matchedUser) {
        showProfileMessage("No profile found for this user.", "error");
        return;
      }

      const parentGuardian = profileParentGuardianInput.value.trim();
      const parentGuardianPhone = profileParentGuardianPhoneInput.value.trim().replace(/\s+/g, "");

      if (!parentGuardian || !parentGuardianPhone) {
        showProfileMessage("Please fill in parent/guardian details.", "error");
        return;
      }

      if (!/^\+?\d{10,15}$/.test(parentGuardianPhone)) {
        showProfileMessage("Use a valid parent/guardian phone number.", "error");
        return;
      }

      matchedUser.parentGuardian = parentGuardian;
      matchedUser.parentGuardianPhone = parentGuardianPhone;
      localStorage.setItem("rugbyGemUsers", JSON.stringify(users));
      showProfileMessage("Parent/guardian details saved successfully.", "success");
    });
  }

  if (profileImageInput) {
    profileImageInput.addEventListener("change", function () {
      if (!matchedUser) {
        return;
      }
      const file = profileImageInput.files && profileImageInput.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        const imageSrc = event.target && event.target.result ? String(event.target.result) : "";
        if (!imageSrc) {
          return;
        }
        matchedUser.profileImage = imageSrc;
        localStorage.setItem("rugbyGemUsers", JSON.stringify(users));
        renderProfile();
        showProfileMessage("Profile photo updated.", "success");
      };
      reader.readAsDataURL(file);
    });
  }

  function getAllPayments() {
    return JSON.parse(localStorage.getItem("rugbyGemPayments") || "[]");
  }

  function saveAllPayments(payments) {
    localStorage.setItem("rugbyGemPayments", JSON.stringify(payments));
  }

  function showPaymentMessage(text, type) {
    if (!paymentMessage) {
      return;
    }
    paymentMessage.textContent = text;
    paymentMessage.className = "payment-message " + type;
  }

  function renderPayments() {
    if (!paymentTableBody || !paymentTotal) {
      return;
    }

    const payments = getAllPayments()
      .filter(function (payment) {
        return (payment.user || "").toLowerCase() === activeUserNormalized;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    paymentTableBody.innerHTML = "";

    if (payments.length === 0) {
      paymentTableBody.innerHTML = "<tr><td colspan=\"6\">No payments recorded yet.</td></tr>";
      paymentTotal.textContent = "KES 0.00";
      return;
    }

    let total = 0;
    payments.forEach(function (payment) {
      total += Number(payment.amount);

      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + payment.date + "</td>" +
        "<td>" + payment.month + "</td>" +
        "<td>" + payment.user + "</td>" +
        "<td>" + payment.phone + "</td>" +
        "<td>" + payment.method + "</td>" +
        "<td>KES " + Number(payment.amount).toFixed(2) + "</td>";
      paymentTableBody.appendChild(row);
    });

    paymentTotal.textContent = "KES " + total.toFixed(2);
  }

  if (paymentForm) {
    paymentForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const user = payUserInput.value.trim().toLowerCase();
      const phone = payPhoneInput.value.trim();
      const month = payMonthInput.value;
      const amount = Number(payAmountInput.value);
      const method = payMethodInput.value;

      if (!user || !phone || !month || !amount || amount <= 0 || !method) {
        showPaymentMessage("Fill all payment fields correctly.", "error");
        return;
      }

      const today = new Date();
      const payments = getAllPayments();
      payments.push({
        user: user,
        phone: phone,
        month: month,
        amount: amount,
        method: method,
        date: today.toLocaleDateString(),
        createdAt: today.toISOString()
      });

      saveAllPayments(payments);
      showPaymentMessage("Payment recorded successfully.", "success");
      payAmountInput.value = "";
      if (payAmountPreview) {
        payAmountPreview.innerText = "";
        payAmountPreview.classList.remove("visible");
      }
      renderPayments();
    });
  }

  renderPayments();
})();
