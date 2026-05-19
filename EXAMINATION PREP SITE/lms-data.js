window.GnpLmsData = (() => {
    const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=1200`;

    const courses = [
        {
            id: "bsn-year-1-foundations",
            title: "BSN Year 1 Foundations",
            category: "BSN Curriculum",
            level: "Beginner",
            format: "Lectures + Guided Practice",
            durationHours: 64,
            questions: 420,
            image: image("photo-1576091160399-112ba8d25d1d"),
            summary: "A structured first-year nursing pathway covering anatomy, physiology, fundamentals, communication, microbiology, and basic pharmacology.",
            outcomes: ["Build core nursing vocabulary", "Connect normal findings to early warning signs", "Prepare for term-based school assessments"],
            terms: [
                {
                    id: "term-1",
                    title: "Term 1",
                    description: "Normal structure, function, and safe beginner nursing habits.",
                    lessons: [
                        lesson("anatomy-i", "Anatomy I", "System structure and body organization", "Explain anatomical language, body cavities, and organ-system relationships.", "Start by understanding the normal map of the body. In nursing, anatomy is not only naming structures; it helps you locate pain, explain procedures, and communicate clearly with the team.", "Body planes and directional terms", "Major body cavities", "Organ-system overview"),
                        lesson("physiology-i", "Physiology I", "Normal body function", "Describe homeostasis and how changes in function create assessment clues.", "Physiology turns memorized body parts into clinical reasoning. When a vital sign changes, ask which function is no longer stable and what the nurse should assess first.", "Homeostasis", "Feedback loops", "Vital sign meaning"),
                        lesson("foundations", "Foundations of Nursing", "Safe beginner nursing practice", "Apply patient safety, hygiene, communication, and basic care principles.", "Foundations questions reward safety. Before doing a task, confirm identity, explain the action, protect privacy, reduce infection risk, and document clearly.", "Patient identification", "Infection prevention", "Basic care priorities")
                    ]
                },
                {
                    id: "term-2",
                    title: "Term 2",
                    description: "Microbes, medication basics, and first health assessment routines.",
                    lessons: [
                        lesson("microbiology", "Microbiology", "Infection and transmission", "Recognize infection chain links and nursing actions that break transmission.", "Microbiology matters at the bedside because one missed hygiene step can affect a whole ward. Learn the chain of infection and where nursing action interrupts it.", "Chain of infection", "Standard precautions", "Specimen safety"),
                        lesson("basic-pharmacology", "Basic Pharmacology", "Medication safety foundations", "Use rights of medication administration and early adverse-effect recognition.", "Medication safety is a sequence. Verify, assess, administer, monitor, teach, and document.", "Medication rights", "Contraindication checks", "Adverse effects"),
                        lesson("health-assessment", "Health Assessment Basics", "Head-to-toe assessment", "Collect subjective and objective findings and identify urgent cues.", "Assessment is pattern recognition. Compare baseline with current findings and sort what is urgent, important, and routine.", "Subjective data", "Objective data", "Urgent findings")
                    ]
                }
            ]
        },
        {
            id: "nck-licensing-masterclass",
            title: "NCK Licensing Exam Masterclass",
            category: "Licensing Prep",
            level: "Intermediate",
            format: "Video Review + QBank + Mock Exams",
            durationHours: 48,
            questions: 1500,
            image: image("photo-1580281657527-47c57d5a0b8b"),
            summary: "A focused licensing pathway with high-yield systems review, rationales, mock readiness, and weak-topic repair.",
            outcomes: ["Master priority frameworks", "Practice exam-style rationales", "Track readiness before the main exam"],
            terms: [
                {
                    id: "systems-review",
                    title: "Systems Review",
                    description: "High-yield review by body system.",
                    lessons: [
                        lesson("cardio-priority", "Cardiovascular Priorities", "Perfusion and urgent assessment", "Recognize poor cardiac output and choose the safest first action.", "Look for trends: chest pain, dyspnea, hypotension, cool skin, altered mentation, and low urine output. The safest action protects perfusion and escalates deterioration.", "Low perfusion cues", "Chest pain sequence", "Escalation"),
                        lesson("resp-priority", "Respiratory Priorities", "Oxygenation and ventilation", "Identify respiratory decline early and apply safe first interventions.", "A rising respiratory rate often appears before oxygen saturation drops. Position, oxygen support, reassessment, and escalation are common first actions.", "Work of breathing", "Oxygen delivery", "ABG basics"),
                        lesson("pharm-safety", "Medication Safety", "High-alert medication choices", "Assess before administration and monitor for adverse effects.", "Medication questions are safety questions. Never give before checking the assessment or lab value that makes the dose safe.", "High-alert medications", "Hold parameters", "Monitoring")
                    ]
                },
                {
                    id: "exam-readiness",
                    title: "Exam Readiness",
                    description: "Mock strategy, weak-topic repair, and final readiness.",
                    lessons: [
                        lesson("priority-frameworks", "Priority Frameworks", "ABCs, safety, Maslow, and nursing process", "Select the best first action under exam pressure.", "Use frameworks as a filter, not as a replacement for reading the question. Unstable, acute, and unsafe findings come first.", "ABCs", "Safety", "Nursing process"),
                        lesson("mock-rationales", "Mock Exam Rationales", "Turning misses into revision", "Create a weak-topic log from every incorrect item.", "A wrong answer is useful only if it becomes a correction plan. Capture topic, missed cue, correct rule, and one review action.", "Error log", "Rationale review", "Repeat testing"),
                        lesson("final-readiness", "Final Readiness", "Readiness score and exam plan", "Decide when to sit using performance trends, not emotion.", "Readiness is a pattern: stable practice scores, fewer repeated errors, and strong performance in priority topics.", "Readiness trend", "Final week plan", "Exam-day pacing")
                    ]
                }
            ]
        },
        {
            id: "nclex-rn-comprehensive",
            title: "NCLEX-RN Comprehensive Prep",
            category: "NCLEX Preparation",
            level: "Advanced",
            format: "Lectures + CAT Practice + Reports",
            durationHours: 72,
            questions: 2200,
            image: image("photo-1584308666744-24d5c474f2ae"),
            summary: "A comprehensive NCLEX track with NGN cases, adaptive practice, clinical judgment, video lectures, and readiness reporting.",
            outcomes: ["Build NGN clinical judgment", "Practice CAT-style decision making", "Repair weak systems with targeted lectures"],
            terms: [
                {
                    id: "clinical-judgment",
                    title: "Clinical Judgment",
                    description: "Cue recognition, hypotheses, interventions, and evaluation.",
                    lessons: [
                        lesson("ngn-cues", "NGN Cue Recognition", "Reading case data", "Identify abnormal findings, trends, and what changed from baseline.", "NGN cases test how you notice. Highlight abnormal, urgent, and changing cues before choosing interventions.", "Relevant cues", "Baseline change", "Urgency"),
                        lesson("hypotheses", "Hypotheses and Priorities", "Clinical reasoning", "Connect cues to likely problems and prioritize nursing response.", "Name the patient problem before choosing what to do. A clear problem makes unsafe options easier to reject.", "Hypothesis formation", "Priority response", "Risk reduction"),
                        lesson("evaluation", "Evaluate Outcomes", "Reassessment and response", "Choose evaluation actions that prove whether care worked.", "After intervention, reassess the finding that showed the problem. Evaluation is not documentation only; it checks patient response.", "Reassessment", "Expected outcomes", "Escalation")
                    ]
                },
                {
                    id: "practice-readiness",
                    title: "Practice Readiness",
                    description: "Adaptive practice, self-assessment, and reports.",
                    lessons: [
                        lesson("cat-strategy", "CAT Strategy", "Adaptive exam endurance", "Maintain answer quality across an unpredictable adaptive exam.", "CAT testing feels uncertain by design. Focus on one high-quality answer at a time and avoid emotional scorekeeping.", "Pacing", "Reset routine", "Answer confidence"),
                        lesson("delegation", "Delegation and Scope", "RN decision boundaries", "Separate routine delegated tasks from RN-only judgment.", "Teaching, triage, initial assessment, and unstable patients stay with the RN. Delegate predictable tasks with clear follow-up.", "Scope", "Stable vs unstable", "Follow-up"),
                        lesson("readiness-report", "Readiness Report", "Weak-topic diagnostics", "Use reports to decide the next study action.", "Reports should point to action: which system, which concept, which question type, and which lecture to review next.", "System score", "Question type", "Remediation")
                    ]
                }
            ]
        }
    ];

    function lesson(id, title, lectureTitle, objective, body, a, b, c) {
        return {
            id,
            title,
            lectureTitle,
            objective,
            body,
            duration: 8 + (id.length % 5),
            tutorScript: `Today we are studying ${title}. Focus on the clinical cue, the safest nursing action, and the reason behind the answer.`,
            concepts: [a, b, c],
            quiz: {
                prompt: `What is the safest study approach for ${title}?`,
                options: [
                    "Memorize only one definition",
                    "Connect the concept to assessment cues, nursing action, and rationales",
                    "Skip practice questions until the final exam",
                    "Focus only on long explanations"
                ],
                correct: 1,
                rationale: "Correct. Strong nursing preparation connects content, patient cues, safe action, and rationale review."
            }
        };
    }

    function flattenLessons(course) {
        return course.terms.flatMap((term) => term.lessons.map((lessonItem) => ({
            ...lessonItem,
            termId: term.id,
            termTitle: term.title
        })));
    }

    function getCourse(courseId) {
        return courses.find((course) => course.id === courseId) || courses[0];
    }

    (window.GnpLearning?.getCourses?.() || []).forEach((external) => {
        if (!external?.id || courses.some((course) => course.id === external.id)) return;
        courses.push({
            id: external.id,
            title: external.title || "Lecturer Course",
            category: external.category || "Lecturer Published",
            level: external.difficulty || "Beginner",
            format: external.format || "Lecturer Notes",
            durationHours: Number(external.durationHours || 12),
            questions: Number(external.questions || 100),
            image: /^https?:\/\//i.test(String(external.image || "")) ? external.image : image("photo-1516549655169-df83a0774514"),
            summary: external.summary || "Lecturer-published nursing course.",
            outcomes: ["Study lecturer notes", "Complete checkpoints", "Prepare for assessment"],
            terms: [
                {
                    id: "lecturer-notes",
                    title: "Lecturer Notes",
                    description: "Generated lessons from the lecturer course outline.",
                    lessons: [
                        lesson(`${external.id}-intro`, "Course Introduction", "Course overview", `Understand the purpose and structure of ${external.title || "this course"}.`, external.contentNotes || external.summary || "Review the lecturer notes, identify the main nursing concepts, and connect each concept to patient assessment and safe action.", "Course overview", "Assessment cues", "Safe action"),
                        lesson(`${external.id}-practice`, "Guided Practice", "Rationale review", "Apply the course concepts to practice questions and rationales.", "Practice is where knowledge becomes decision making. Review each question by identifying the patient cue, the safest action, and the rationale for rejecting unsafe options.", "Practice questions", "Rationales", "Weak-topic repair"),
                        lesson(`${external.id}-readiness`, "Readiness Check", "Final review", "Confirm readiness for the lecturer assessment.", "Before the main assessment, check that you can explain the core concepts, identify urgent findings, and choose safe nursing interventions consistently.", "Readiness score", "Final review", "Assessment plan")
                    ]
                }
            ]
        });
    });

    return { courses, getCourse, flattenLessons };
})();
