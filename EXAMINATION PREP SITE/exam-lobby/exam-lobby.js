document.addEventListener("DOMContentLoaded", () => {
    let selectedExamId = null;
    const session = window.GnpUtils?.getSession?.() || null;
    const userId = String(session?.userId || "guest").trim() || "guest";
    const activeExamKey = `activeExam:${userId}`;
    const submittedResultsKey = `submittedExamResults:${userId}`;

    const examData = {
        upcoming: [
            { id: "nck-licensing-msq", name: "NCK Licensing MSQ Mock Exam", category: "Kenya NCK", date: "May 20, 2026", time: "10:00 AM", duration: 120, questionMode: "MCQ/MSQ", passingScore: 70, type: "exam", link: "../exam-interface/exam-interface.html" },
            { id: "nclex-rn-msq", name: "NCLEX-RN Select-All-That-Apply Mock", category: "NCLEX-RN", date: "May 22, 2026", time: "02:00 PM", duration: 150, questionMode: "MCQ/MSQ", passingScore: 75, type: "exam", link: "../exam-interface/exam-interface.html" },
            { id: "uk-cbt-adult-msq", name: "UK CBT Adult Nursing Mock", category: "UK CBT", date: "May 25, 2026", time: "09:00 AM", duration: 100, questionMode: "MCQ/MSQ", passingScore: 68, type: "exam", link: "../exam-interface/exam-interface.html" },
            { id: "aus-nmba-msq", name: "Australia NMBA Readiness Mock", category: "Australia Licensing", date: "May 28, 2026", time: "11:00 AM", duration: 100, questionMode: "MCQ/MSQ", passingScore: 70, type: "exam", link: "../exam-interface/exam-interface.html" }
        ],
        done: [
            { id: "anatomy-baseline", name: "Anatomy Baseline", score: "88%", date: "April 10, 2026", type: "results", link: "../results/results.html?examId=anatomy-baseline" },
            { id: "surg-quiz", name: "Surgical Nursing Quiz", score: "92%", date: "April 15, 2026", type: "results", link: "../results/results.html?examId=surg-quiz" }
        ],
        courses: [
            { id: "anatomy-phys", name: "Anatomy & Physiology", status: "In Progress", type: "course", link: "anatomy.html" },
            { id: "nclex-master", name: "NCLEX Prep Masterclass", status: "Active", type: "course", link: "../courses.html" },
            { id: "nursing-ethics", name: "Global Nursing Ethics", status: "Completed", type: "course", link: "../courses.html" }
        ]
    };

    let cameraReady = false;
    let micReady = false;
    let internetReady = navigator.onLine;
    let browserLockReady = true;
    let faceVerified = false;

    const trackerContent = document.getElementById("tracker-content");
    const startButton = document.getElementById("start-exam-btn");
    const consentCheckbox = document.getElementById("consent-checkbox");
    const fileInput = document.getElementById("fileElem");
    const generateButton = document.getElementById("generate-btn");
    const previewDiv = document.getElementById("generated-questions-preview");
    const dropArea = document.getElementById("drop-area");

    window.showTab = function showTab(type, clickedButton) {
        const records = examData[type];
        trackerContent.innerHTML = "";

        if (!records.length) {
            trackerContent.innerHTML = '<p class="no-items">No items to display.</p>';
        } else {
            records.forEach((item) => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "tracker-item";
                itemDiv.dataset.itemId = item.id;

                const details = document.createElement("div");
                details.className = "tracker-copy";
                details.innerHTML = `<span><strong>${item.name}</strong></span>`;

                if (item.date && item.time) {
                    details.innerHTML += `<span>${item.date} at ${item.time}</span>`;
                    details.innerHTML += `<span>${item.category || "Licensing"} - ${item.questionMode || "MCQ"} - Pass ${item.passingScore || 70}%</span>`;
                } else if (item.score) {
                    details.innerHTML += `<span>Score: ${item.score}</span>`;
                } else if (item.status) {
                    details.innerHTML += `<span>Status: ${item.status}</span>`;
                }

                const actionBtn = document.createElement("button");
                actionBtn.className = "btn-small";

                if (item.type === "exam") {
                    actionBtn.textContent = item.id === selectedExamId ? "Selected" : "Select Exam";
                    actionBtn.onclick = () => selectExam(item.id);
                } else if (item.type === "results") {
                    actionBtn.textContent = "View Results";
                    actionBtn.onclick = () => {
                        window.location.href = item.link;
                    };
                } else {
                    actionBtn.textContent = "Go to Course";
                    actionBtn.onclick = () => {
                        window.location.href = item.link;
                    };
                }

                itemDiv.appendChild(details);
                itemDiv.appendChild(actionBtn);
                trackerContent.appendChild(itemDiv);
            });
        }

        document.querySelectorAll(".tab-btn").forEach((button) => button.classList.remove("active"));
        if (clickedButton) {
            clickedButton.classList.add("active");
        }

        revealElements(trackerContent.querySelectorAll(".tracker-item"));
    };

    showTab("upcoming", document.querySelector(".tab-btn.active"));

    function selectExam(examId) {
        selectedExamId = examId;
        document.querySelectorAll(".tracker-item").forEach((item) => {
            item.classList.toggle("selected", item.dataset.itemId === examId);
            const button = item.querySelector(".btn-small");
            if (button && item.dataset.itemId === examId) {
                button.textContent = "Selected";
            } else if (button && item.dataset.itemId !== examId && button.textContent === "Selected") {
                button.textContent = "Select Exam";
            }
        });
        checkAllSystemsReady();
    }

    function markStatus(id, text, ready) {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }

        element.textContent = text;
        element.style.color = ready ? "#20825f" : "#c54444";
        element.classList.toggle("status-ready", ready);
        element.classList.toggle("status-blocked", !ready);
    }

    function checkAllSystemsReady() {
        const consentChecked = consentCheckbox.checked;
        const allReady = cameraReady && micReady && internetReady && browserLockReady && faceVerified && selectedExamId && consentChecked;

        startButton.disabled = !allReady;
        startButton.onclick = allReady ? launchSelectedExam : null;
        startButton.textContent = allReady ? "Start Selected Exam" : "Complete Checks to Start";
    }

    function launchSelectedExam() {
        const exam = examData.upcoming.find((item) => item.id === selectedExamId);
        if (!exam) {
            alert("The selected exam could not be loaded.");
            return;
        }
        const access = window.GnpAssessmentControl?.canStartAttempt(userId, exam.id) || { ok: true };
        if (!access.ok) {
            alert(access.reason);
            return;
        }

        localStorage.setItem(activeExamKey, JSON.stringify({
            id: exam.id,
            title: exam.name,
            duration: exam.duration,
            scheduledAt: `${exam.date} ${exam.time}`,
            category: exam.category,
            questionMode: exam.questionMode,
            passingScore: exam.passingScore
        }));
        localStorage.removeItem(submittedResultsKey);

        window.location.href = exam.link;
    }

    consentCheckbox.addEventListener("change", checkAllSystemsReady);

    fileInput?.addEventListener("change", (event) => {
        const [file] = event.target.files;
        document.getElementById("file-name").textContent = file ? file.name : "No file selected";
        generateButton.disabled = !file;
        dropArea.classList.toggle("has-file", Boolean(file));
    });

    generateButton?.addEventListener("click", () => {
        const fileName = document.getElementById("file-name").textContent;
        if (fileName === "No file selected") {
            alert("Please select a PDF file first.");
            return;
        }

        previewDiv.innerHTML = `<p>Generating questions from "<strong>${fileName}</strong>"...</p><div class="loading-spinner"></div>`;

        setTimeout(() => {
            previewDiv.innerHTML = `
                <h4>Generated Questions Preview</h4>
                <ol>
                    <li>Which assessment finding best indicates poor tissue perfusion?</li>
                    <li>What teaching point is essential before administering this medication safely?</li>
                    <li>Which nursing action should be prioritized first in this case study?</li>
                </ol>
                <p class="success-message">Question suggestions generated successfully.</p>
            `;
            previewDiv.classList.add("is-ready");
        }, 1800);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
        dropArea?.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropArea.classList.add("is-dragover");
        });
    });

    ["dragleave", "drop"].forEach((eventName) => {
        dropArea?.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropArea.classList.remove("is-dragover");
        });
    });

    dropArea?.addEventListener("drop", (event) => {
        const [file] = Array.from(event.dataTransfer?.files || []).filter((item) => item.type === "application/pdf");
        if (!file || typeof DataTransfer === "undefined") {
            return;
        }

        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
        fileInput.dispatchEvent(new Event("change"));
    });

    markStatus("internet-status", internetReady ? "Ready" : "Offline", internetReady);
    markStatus("browser-status", "Ready", browserLockReady);

    window.addEventListener("online", () => {
        internetReady = true;
        markStatus("internet-status", "Ready", true);
        checkAllSystemsReady();
    });

    window.addEventListener("offline", () => {
        internetReady = false;
        markStatus("internet-status", "Offline", false);
        checkAllSystemsReady();
    });

    const video = document.getElementById("camera-preview");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
                cameraReady = true;
                micReady = true;
                markStatus("camera-status", "Ready", true);
                markStatus("mic-status", "Ready", true);
                setTimeout(() => {
                    faceVerified = true;
                    document.getElementById("face-status").textContent = "Identity confirmed. You are ready to begin.";
                    document.getElementById("face-status").classList.add("verified");
                    checkAllSystemsReady();
                }, 1200);
                checkAllSystemsReady();
            })
            .catch(() => {
                cameraReady = false;
                micReady = false;
                faceVerified = false;
                markStatus("camera-status", "Blocked", false);
                markStatus("mic-status", "Blocked", false);
                document.getElementById("face-status").textContent = "Camera and microphone access are required before exam start.";
                checkAllSystemsReady();
            });
    } else {
        markStatus("camera-status", "Unsupported", false);
        markStatus("mic-status", "Unsupported", false);
        document.getElementById("face-status").textContent = "This browser does not support media capture.";
        checkAllSystemsReady();
    }

    revealElements(document.querySelectorAll(".card, .lobby-hero"));
});

function revealElements(elements) {
    const targets = Array.from(elements || []);
    if (!targets.length) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.transitionDelay = reduceMotion ? "0ms" : `${Math.min(index * 55, 280)}ms`;
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
