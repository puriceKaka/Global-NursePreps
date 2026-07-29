document.addEventListener("DOMContentLoaded", () => {
    const session = window.GnpUtils?.getSession?.() || null;
    const userId = String(session?.userId || "guest").trim() || "guest";
    const latestResult = JSON.parse(localStorage.getItem(`submittedExamResults:${userId}`) || "null");
    const examHistory = latestResult ? [latestResult] : [];

    document.getElementById("exams-completed").textContent = String(examHistory.length);
    document.getElementById("average-score").textContent = latestResult ? `${latestResult.score}%` : "0%";
    document.getElementById("upcoming-exams").textContent = "2";

    const examCards = [
        { name: "NCLEX-RN Mock", date: "2026-05-10", locked: false, href: "../exam-lobby/exam-lobby.html" },
        { name: "Pharmacology Quiz", date: "2026-05-15", locked: true, href: "../courses.html" }
    ];

    const examCardsContainer = document.getElementById("exam-cards");
    examCards.forEach((exam) => {
        const card = document.createElement("div");
        card.className = "exam-card reveal-on-scroll";
        card.innerHTML = `<strong>${exam.name}</strong><br>Date: ${exam.date}<br>` +
            (exam.locked ? "<button disabled>Locked</button>" : `<button data-href="${exam.href}">Enter</button>`);
        examCardsContainer.appendChild(card);
    });

    examCardsContainer.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-href]");
        if (button) {
            window.location.href = button.dataset.href;
        }
    });

    const recentActivity = latestResult ? [
        { exam: latestResult.examTitle, score: `${latestResult.score}%`, feedback: latestResult.weakAreas.length ? `Review ${latestResult.weakAreas.join(", ")}.` : "Strong performance across the paper." },
        { exam: "Exam Session Saved", score: `${latestResult.answeredCount}/${latestResult.totalQuestions}`, feedback: "Your latest session has been synced to results." }
    ] : [
        { exam: "No submitted exams", score: "0", feedback: "Your exam activity will appear here after you submit an exam." }
    ];

    const activityList = document.getElementById("recent-activity-list");
    recentActivity.forEach((item) => {
        const div = document.createElement("div");
        div.className = "activity-item reveal-on-scroll";
        div.innerHTML = `<b>${item.exam}</b> - Score: ${item.score} <br>Feedback: ${item.feedback}`;
        activityList.appendChild(div);
    });

    document.querySelectorAll(".practice-buttons button").forEach((button) => {
        button.addEventListener("click", () => {
            window.location.href = "../exam-lobby/anatomy.html";
        });
    });

    revealElements(document.querySelectorAll(".welcome-section, .stat-card, .practice-questions, .upcoming-exams, .recent-activity, .reveal-on-scroll"));
});

function revealElements(elements) {
    const targets = Array.from(elements || []);
    if (!targets.length) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.transitionDelay = reduceMotion ? "0ms" : `${Math.min(index * 55, 260)}ms`;
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
    }, { threshold: 0.15 });

    targets.forEach((element) => observer.observe(element));
}
