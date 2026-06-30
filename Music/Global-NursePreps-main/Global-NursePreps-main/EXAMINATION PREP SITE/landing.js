document.addEventListener("DOMContentLoaded", () => {
    const navigate = (path) => {
        window.location.href = path;
    };

    const routeMap = {
        "go-courses": "courses.html",
        "go-lobby": "exam-lobby/exam-lobby.html",
        "cta-courses": "courses.html",
        "cta-lobby": "exam-lobby/exam-lobby.html"
    };

    Object.entries(routeMap).forEach(([id, path]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("click", () => navigate(path));
        }
    });

    initializeLandingMotion();
});

function initializeLandingMotion() {
    const revealTargets = document.querySelectorAll([
        ".hero-image-wrap",
        ".hero-content",
        ".brand-message",
        ".brand-points article",
        ".stat-item",
        ".program-card",
        ".experience-copy",
        ".experience-image",
        ".step",
        ".question-panel",
        ".question-image",
        ".cta-section"
    ].join(","));

    applyRevealMotion(revealTargets);
}

function applyRevealMotion(elements) {
    const targets = Array.from(elements || []);
    if (!targets.length) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.transitionDelay = reduceMotion ? "0ms" : `${Math.min(index * 60, 320)}ms`;
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
        targets.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });

    targets.forEach((element) => observer.observe(element));
}
document.addEventListener("DOMContentLoaded", () => {
    const landingImages = [
        "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1576765607924-b0e5c0f7eb82?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
    ];

    document.querySelectorAll(".hero-media img, .program-card img, .feature-card img, .step-card img").forEach((img, index) => {
        const fallback = landingImages[index % landingImages.length];

        if (!img.getAttribute("src")) {
            img.src = fallback;
        }

        img.addEventListener("error", () => {
            img.src = fallback;
        }, { once: true });
    });

    document.querySelectorAll(".program-card, .feature-card, .step-card").forEach((card, index) => {
        if (card.querySelector("img, .card-media")) {
            return;
        }

        const media = document.createElement("div");
        media.className = "card-media auto-media";
        media.innerHTML = `<img src="${landingImages[index % landingImages.length]}" alt="Learning support visual">`;
        card.prepend(media);
    });
});
