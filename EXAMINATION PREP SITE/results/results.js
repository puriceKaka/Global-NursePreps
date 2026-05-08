document.addEventListener("DOMContentLoaded", () => {
    const fallbackResult = {
        examTitle: "NCLEX-RN Mock Exam",
        score: 85,
        answeredCount: 92,
        totalQuestions: 100,
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

    const strengths = Array.isArray(result.strengths) ? result.strengths : [];
    const weakAreas = Array.isArray(result.weakAreas) ? result.weakAreas : [];

    document.getElementById("analytics").innerHTML = `
        <div class="insight-grid">
            <article class="insight-block strength-block">
                <strong>Strengths</strong>
                <ul>${(strengths.length ? strengths : ["Building steadily"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </article>
            <article class="insight-block weakness-block">
                <strong>Weak Areas</strong>
                <ul>${(weakAreas.length ? weakAreas : ["No urgent weak areas detected"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </article>
        </div>
    `;

    document.getElementById("study-plan").innerHTML = `
        <div class="study-plan-card">
            <h3>Recommended Next Step</h3>
            <p>${weakAreas.length
                ? `Repeat ${escapeHtml(weakAreas[0])}, review the rationale, then retake the module test.`
                : "Continue to the next module or attempt another course final test."}</p>
        </div>
    `;

    document.getElementById("proctoring-events").innerHTML = `
        <ul class="metric-list">
            ${result.proctoringEvents.map((item) => `<li><span>${item}</span></li>`).join("")}
        </ul>
    `;

    document.getElementById("review-answers-btn").onclick = () => {
        const reviewMarkup = result.answerReview.length
            ? `<ul class="metric-list answer-review-list">${result.answerReview.map((item) => {
                const isCorrect = item.answer === item.correctAnswer;
                return `
                    <li>
                        <span>${escapeHtml(item.category)}: ${escapeHtml(item.question)}</span>
                        <strong class="${isCorrect ? "review-correct" : "review-missed"}">${isCorrect ? "Correct" : item.flagged ? "Flagged" : "Review"}</strong>
                        <div><b>Your answer:</b> ${escapeHtml(item.answer)}</div>
                        <div><b>Correct answer:</b> ${escapeHtml(item.correctAnswer || "Available after instructor review")}</div>
                        ${item.explanation ? `<div><b>Why:</b> ${escapeHtml(item.explanation)}</div>` : ""}
                    </li>
                `;
            }).join("")}</ul>`
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

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
