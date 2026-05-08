document.addEventListener("DOMContentLoaded", () => {
    const fallbackResult = {
        examTitle: "NCLEX-RN Mock Exam",
        score: 85,
        answeredCount: 4,
        totalQuestions: 4,
        strengths: ["Anatomy", "Pediatrics"],
        weakAreas: ["Pharmacology"],
        performanceBreakdown: [
            { category: "Anatomy", score: 90 },
            { category: "Pharmacology", score: 80 },
            { category: "Pediatrics", score: 85 }
        ],
        proctoringEvents: ["Looked away from screen (10:15 AM)", "Tab switch detected (10:45 AM)"],
        answerReview: []
    };

    const result = JSON.parse(localStorage.getItem("submittedExamResults") || "null") || fallbackResult;

    document.querySelector("h1").textContent = `${result.examTitle} Completed`;
    document.getElementById("score").textContent = `${result.score}%`;

    document.getElementById("performance-breakdown").innerHTML = `
        <ul class="metric-list">
            ${result.performanceBreakdown.map((item) => `<li><span>${item.category}</span><strong>${item.score}%</strong></li>`).join("")}
            <li><span>Answered</span><strong>${result.answeredCount}/${result.totalQuestions}</strong></li>
        </ul>
    `;

    document.getElementById("analytics").innerHTML = `
        <div class="insight-block"><b>Strengths:</b> ${result.strengths.length ? result.strengths.join(", ") : "Building steadily"}</div>
        <div class="insight-block"><b>Weak Areas:</b> ${result.weakAreas.length ? result.weakAreas.join(", ") : "No urgent weak areas detected"}</div>
    `;

    document.getElementById("proctoring-events").innerHTML = `
        <ul class="metric-list">
            ${result.proctoringEvents.map((item) => `<li><span>${item}</span></li>`).join("")}
        </ul>
    `;

    document.getElementById("review-answers-btn").onclick = () => {
        const reviewMarkup = result.answerReview.length
            ? `<ul class="metric-list">${result.answerReview.map((item) => `<li><span>${item.category}: ${item.question}</span><strong>${item.flagged ? "Flagged" : "Reviewed"}</strong><div>${item.answer}</div></li>`).join("")}</ul>`
            : '<p class="review-placeholder">Answer review is only available after a live exam submission.</p>';

        const reviewSection = document.querySelector(".review-section");
        let panel = document.getElementById("answer-review-panel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "answer-review-panel";
            panel.className = "answer-review-panel";
            reviewSection.appendChild(panel);
        }

        panel.innerHTML = reviewMarkup;
        panel.classList.add("is-visible");
    };
});
