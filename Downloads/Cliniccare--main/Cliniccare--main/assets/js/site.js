(function () {
  const CC = window.CC || {};
  let firebasePromise = null;

  function loadFirebase() {
    if (!firebasePromise) firebasePromise = import('./firebase.js');
    return firebasePromise;
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }

  function getFirstName(name) {
    if (!name) return 'there';
    return name.trim().split(' ')[0];
  }

  function initNav() {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    const header = document.querySelector(".site-header");

    if (hamburger && mobileMenu) {
      hamburger.addEventListener("click", () => {
        mobileMenu.classList.toggle("open");
      });

      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => mobileMenu.classList.remove("open"));
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const target = document.querySelector(anchor.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    if (header) {
      const setShadow = () => {
        header.style.boxShadow = window.scrollY > 10 ? "0 8px 30px rgba(15,23,42,0.08)" : "none";
      };
      setShadow();
      window.addEventListener("scroll", setShadow, { passive: true });
    }
  }

  function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = contactForm.querySelector('button[type="submit"]');
      if (!button) return;

      const originalText = button.textContent;
      button.textContent = "Message Sent";
      button.disabled = true;
      button.style.background = "linear-gradient(135deg,#16a34a,#06b6d4)";

      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = "";
        contactForm.reset();
      }, 2800);
    });
  }

  function initRevealAnimations() {
    const items = Array.from(document.querySelectorAll(".reveal, .reveal-stagger"));
    if (!items.length) return;
    document.body.classList.add("reveal-ready");

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const groups = new Map();
    items.forEach((item) => {
      if (!item.classList.contains("reveal-stagger")) return;
      const parent = item.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(item);
    });

    groups.forEach((group) => {
      group.forEach((item, index) => {
        item.style.transitionDelay = `${Math.min(index * 80, 420)}ms`;
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach((item) => observer.observe(item));
  }

  function initCounters() {
    const counters = Array.from(document.querySelectorAll(".counter"));
    if (!counters.length) return;

    const formatValue = (value) => new Intl.NumberFormat("en-US").format(Math.round(value));

    const animateCounter = (counter) => {
      const target = Number(counter.dataset.target || 0);
      const duration = 1300;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = formatValue(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.55 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  function initHeroTilt() {
    const tilt = document.getElementById("heroTilt");
    const card = tilt && tilt.querySelector(".hero-3d-card");
    if (!tilt || !card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const floatingCards = Array.from(card.querySelectorAll(".float-card"));

    tilt.addEventListener("pointermove", (event) => {
      const rect = tilt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 12;
      const rotateX = y * -10;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

      floatingCards.forEach((item) => {
        const depth = Number(item.dataset.depth || 0.05);
        item.style.translate = `${x * depth * 220}px ${y * depth * 220}px`;
      });
    });

    tilt.addEventListener("pointerleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
      floatingCards.forEach((item) => {
        item.style.translate = "0 0";
      });
    });
  }

  function initHeroMesh() {
    const canvas = document.getElementById("heroMesh");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let rafId = 0;
    let particles = [];

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.max(28, Math.min(64, Math.round(width / 24)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.4 + Math.random() * 2.3,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        hue: index % 3 === 0 ? "37,99,235" : index % 3 === 1 ? "6,182,212" : "124,58,237"
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
          const next = particles[nextIndex];
          const dx = particle.x - next.x;
          const dy = particle.y - next.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 145) {
            ctx.strokeStyle = `rgba(${particle.hue}, ${0.12 * (1 - distance / 145)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${particle.hue}, 0.34)`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId), { once: true });
  }

  CC.initLanding = function initLanding() {
    initNav();
    initContactForm();
    initRevealAnimations();
    initCounters();
    initHeroTilt();
    initHeroMesh();

    loadFirebase().then(function (firebase) {
      firebase.useSessionPersistence().then(function () {
        firebase.auth.onAuthStateChanged(async function (user) {
          const actions = document.querySelector('.nav-actions');
          const mobileMenu = document.querySelector('.mobile-menu');
          if (!user || !actions) return;

          const profile = await firebase.ensureUserProfile(user);
          const portal = firebase.getPortalRoute(profile.role);
          const first = getFirstName(profile.name || user.displayName || 'User');
          const initials = getInitials(profile.name || user.displayName || 'User');

          actions.innerHTML =
            '<div class="nav-user-chip">' +
              '<div class="nav-user-avatar">' + initials + '</div>' +
              '<span>Hi, ' + first + '</span>' +
            '</div>' +
            '<a class="btn btn-primary" href="' + portal + '">Go to Portal →</a>';

          if (mobileMenu) {
            const signIn = mobileMenu.querySelector('a[href="login.html"]');
            const getStarted = mobileMenu.querySelector('a[href="signup.html"]');
            if (signIn) signIn.remove();
            if (getStarted) {
              getStarted.textContent = 'Go to Portal →';
              getStarted.href = portal;
            }
          }

          const heroActions = document.querySelector('.hero-actions');
          if (heroActions) {
            heroActions.innerHTML =
              '<a class="btn btn-primary btn-lg" href="' + portal + '">Go to Your Portal →</a>' +
              '<a class="btn btn-ghost btn-lg" href="#portals">Explore Features</a>';
          }

          const heroBadge = document.querySelector('.hero-badge');
          if (heroBadge) {
            heroBadge.innerHTML = '<span class="badge-dot"></span> Welcome back, ' + first + '!';
          }
        });
      });
    });
  };

  window.CC = CC;
})();
