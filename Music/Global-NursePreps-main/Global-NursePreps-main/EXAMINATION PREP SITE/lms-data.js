window.GnpLmsData = (() => {
    const image = (name) => `../assets/course-images/${name}.jpg`;
    const photo = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=1200`;
    const coursePhotos = {
        bsn: photo("1530026405186-ed1f139313f8"),
        nck: photo("1455390582262-044cdead277a"),
        nclex: photo("1516321318423-f06f85e504b3"),
        lectures: photo("1516549655169-df83a0774514"),
        pharmacology: photo("1587854692152-cbe660dbde88"),
        pediatrics: photo("1584515933487-779824d29309"),
        medSurg: photo("1582719478250-c89cae4dc85b"),
        fundamentals: photo("1580281657527-47c57d5a0b8b"),
        assessment: photo("1584433144859-1fc3ab64a957"),
        anatomy: photo("1530497610245-94d3c16cda28"),
        maternal: photo("1576091160399-112ba8d25d1d"),
        mentalHealth: photo("1576765608866-5b51046452be"),
        community: photo("1594824476967-48c8b964273f"),
        leadership: photo("1517048676732-d65bc937f952"),
        research: photo("1454165804606-c3d57bc86b40")
    };
    const courseArt = (label, colorA, colorB) => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
                <defs>
                    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0" stop-color="${colorA}"/>
                        <stop offset="1" stop-color="${colorB}"/>
                    </linearGradient>
                </defs>
                <rect width="1200" height="760" fill="url(#bg)"/>
                <circle cx="1020" cy="140" r="190" fill="#ffffff" opacity=".13"/>
                <circle cx="210" cy="650" r="240" fill="#ffffff" opacity=".10"/>
                <rect x="92" y="130" width="1016" height="500" rx="36" fill="#ffffff" opacity=".13"/>
                <path d="M230 385h210m-105-105v210M695 250v250M620 325h150M620 425h150" stroke="#ffffff" stroke-width="42" stroke-linecap="round" opacity=".88"/>
                <text x="92" y="690" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800">${label}</text>
            </svg>
        `.replace(/\s+/g, " ").trim();
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };
    const externalImages = {
        "nck-masterclass": coursePhotos.nck,
        "nclex-comprehensive": coursePhotos.nclex,
        "lecture-series": coursePhotos.lectures,
        "pharmacology-intensive": coursePhotos.pharmacology,
        "pediatrics-clinical": coursePhotos.pediatrics,
        "med-surg-bootcamp": coursePhotos.medSurg
    };
    const fallbackCourseImages = [
        coursePhotos.fundamentals,
        coursePhotos.assessment,
        coursePhotos.anatomy,
        coursePhotos.maternal,
        coursePhotos.mentalHealth,
        coursePhotos.community,
        coursePhotos.leadership,
        coursePhotos.research
    ];

    const courses = [
        {
            id: "bsn-year-1-foundations",
            title: "BSN Year 1 Foundations",
            category: "BSN Curriculum",
            level: "Beginner",
            format: "Lectures + Guided Practice",
            durationHours: 64,
            questions: 420,
            image: coursePhotos.bsn,
            summary: "A structured first-year nursing pathway covering anatomy, physiology, fundamentals, communication, microbiology, and basic pharmacology.",
            unit: "BSN",
            yearLabel: "Year 1",
            subunit: "Foundations",
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
            image: coursePhotos.nck,
            summary: "Prepare for NCK with priority frameworks, Kenyan-style licensing review, mock checks, and weak-topic repair.",
            unit: "Licensing",
            yearLabel: "",
            subunit: "NCK",
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
            image: coursePhotos.nclex,
            summary: "Train for NCLEX-RN with NGN cases, delegation, CAT-style practice, and clinical judgment reports.",
            unit: "NCLEX",
            yearLabel: "",
            subunit: "NCLEX-RN",
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

    function createCourseSeries(config, lessonSpecs) {
        return {
            ...config,
            terms: [
                {
                    id: `${config.id}-term-1`,
                    title: config.yearLabel || config.category || "Study Unit",
                    description: config.subunit || config.summary || "Course lessons and practice.",
                    lessons: lessonSpecs.map((spec, index) => lesson(
                        `${config.id}-lesson-${index + 1}`,
                        spec.title,
                        spec.lectureTitle,
                        spec.objective,
                        spec.body,
                        spec.concepts[0],
                        spec.concepts[1],
                        spec.concepts[2]
                    ))
                }
            ]
        };
    }

    const anatomyExpansionCourses = [
        createCourseSeries({
            id: "anatomy-year-1-cells-tissues",
            title: "Anatomy Year 1: Cells and Tissues",
            category: "Anatomy",
            level: "Beginner",
            badge: "Year 1",
            durationHours: 18,
            questions: 260,
            image: coursePhotos.anatomy,
            summary: "Cell structure, tissue types, and how microscopic anatomy supports safe nursing assessment.",
            unit: "Anatomy",
            yearLabel: "Year 1",
            subunit: "Cells and Tissues",
            keywords: ["anatomy", "cells", "tissues", "year 1"]
        }, [
            {
                title: "Cell Structure",
                lectureTitle: "Cell basics",
                objective: "Explain the parts of the cell and why they matter in health and disease.",
                body: "This unit introduces the cell as the basic unit of life. Understand the cell membrane, nucleus, cytoplasm, and organelles, then connect damage to the way organs stop working safely.",
                concepts: ["Cell membrane", "Nucleus", "Organelles"]
            },
            {
                title: "Tissue Types",
                lectureTitle: "Body tissue groups",
                objective: "Differentiate epithelial, connective, muscle, and nervous tissue.",
                body: "Tissues build organs. Learn the four main tissue groups and the common nursing clues that show when tissue function is abnormal, inflamed, or injured.",
                concepts: ["Epithelial", "Connective", "Nervous tissue"]
            },
            {
                title: "Clinical Link",
                lectureTitle: "Assessment link",
                objective: "Connect microscopic anatomy to wound healing and regeneration.",
                body: "Nursing care depends on how tissue heals. This lesson links cell repair, inflammation, and recovery to wound healing, infection risk, and nutrition support.",
                concepts: ["Healing", "Inflammation", "Regeneration"]
            }
        ]),
        createCourseSeries({
            id: "anatomy-year-1-skeletal-muscular",
            title: "Anatomy Year 1: Skeletal and Muscular Systems",
            category: "Anatomy",
            level: "Beginner",
            badge: "Year 1",
            durationHours: 20,
            questions: 280,
            image: coursePhotos.anatomy,
            summary: "Bones, joints, and muscles for movement, protection, and postural support.",
            unit: "Anatomy",
            yearLabel: "Year 1",
            subunit: "Skeletal and Muscular Systems",
            keywords: ["anatomy", "skeleton", "muscle", "year 1"]
        }, [
            {
                title: "Bone Framework",
                lectureTitle: "Skeletal basics",
                objective: "Describe the function of the skeletal system and key bone landmarks.",
                body: "Bones support the body, protect organs, and store minerals. Learn the big picture of axial and appendicular skeletons before moving to clinical exam clues like fractures and reduced mobility.",
                concepts: ["Axial skeleton", "Appendicular skeleton", "Mineral storage"]
            },
            {
                title: "Muscle Action",
                lectureTitle: "Movement science",
                objective: "Explain how skeletal muscles create movement and posture.",
                body: "Muscles pull on bones to create movement. This lesson links contraction, tone, and strength to how nurses assess mobility, pain, and activity tolerance.",
                concepts: ["Contraction", "Tone", "Posture"]
            },
            {
                title: "Clinical Link",
                lectureTitle: "Mobility care",
                objective: "Apply skeletal and muscular knowledge to safe nursing care.",
                body: "Patient turning, lifting, ambulation, and fall prevention all depend on skeletal and muscular function. Use this unit to reason about mobility aids, pain control, and safe transfer technique.",
                concepts: ["Transfers", "Pain control", "Fall prevention"]
            }
        ]),
        createCourseSeries({
            id: "anatomy-year-1-cardiovascular",
            title: "Anatomy Year 1: Cardiovascular System",
            category: "Anatomy",
            level: "Beginner",
            badge: "Year 1",
            durationHours: 20,
            questions: 300,
            image: coursePhotos.anatomy,
            summary: "Heart chambers, vessels, and circulation patterns used in bedside assessment.",
            unit: "Anatomy",
            yearLabel: "Year 1",
            subunit: "Cardiovascular System",
            keywords: ["anatomy", "cardiac", "circulation", "year 1"]
        }, [
            {
                title: "Heart Anatomy",
                lectureTitle: "Cardiac structure",
                objective: "Identify chambers, valves, and major vessels of the heart.",
                body: "The heart pumps blood through the lungs and body. Learn the path blood takes through the chambers and valves so that perfusion questions make sense.",
                concepts: ["Atria", "Ventricles", "Valves"]
            },
            {
                title: "Blood Flow",
                lectureTitle: "Circulation path",
                objective: "Trace pulmonary and systemic circulation.",
                body: "Blood flow questions reward sequence. Start with the right side to the lungs, then the left side to the body, and connect each step to oxygen delivery and perfusion.",
                concepts: ["Pulmonary circulation", "Systemic circulation", "Perfusion"]
            },
            {
                title: "Clinical Link",
                lectureTitle: "Perfusion checks",
                objective: "Relate anatomy to urgent cardiovascular assessment.",
                body: "This lesson helps you recognize why chest pain, shortness of breath, and poor pulses are urgent. The anatomy tells you what structure may be failing and why the nurse must act quickly.",
                concepts: ["Chest pain", "Pulses", "Oxygen delivery"]
            }
        ]),
        createCourseSeries({
            id: "anatomy-year-1-respiratory",
            title: "Anatomy Year 1: Respiratory System",
            category: "Anatomy",
            level: "Beginner",
            badge: "Year 1",
            durationHours: 18,
            questions: 250,
            image: coursePhotos.anatomy,
            summary: "Airway anatomy, lungs, and breathing mechanics for respiratory care.",
            unit: "Anatomy",
            yearLabel: "Year 1",
            subunit: "Respiratory System",
            keywords: ["anatomy", "respiratory", "airway", "year 1"]
        }, [
            {
                title: "Airway Anatomy",
                lectureTitle: "Upper and lower airway",
                objective: "Label the main parts of the airway and lungs.",
                body: "Airway anatomy starts with the nose, pharynx, larynx, trachea, bronchi, and alveoli. Knowing the path helps you understand obstruction and oxygen therapy questions.",
                concepts: ["Trachea", "Bronchi", "Alveoli"]
            },
            {
                title: "Breathing Mechanics",
                lectureTitle: "Ventilation basics",
                objective: "Explain how the diaphragm and lungs support ventilation.",
                body: "Breathing depends on pressure changes and muscle action. This lesson connects inhalation, exhalation, and work of breathing with nursing assessment.",
                concepts: ["Diaphragm", "Pressure changes", "Work of breathing"]
            },
            {
                title: "Clinical Link",
                lectureTitle: "Oxygenation cues",
                objective: "Use respiratory anatomy to identify worsening breathing.",
                body: "When airways narrow or lungs fail to exchange gas, the nurse sees rapid breathing, low oxygen saturation, and distress. Use anatomy to anticipate what is wrong and what to do first.",
                concepts: ["Hypoxia", "Oxygen saturation", "Breathing distress"]
            }
        ]),
        createCourseSeries({
            id: "anatomy-year-1-digestive-endocrine",
            title: "Anatomy Year 1: Digestive and Endocrine Systems",
            category: "Anatomy",
            level: "Beginner",
            badge: "Year 1",
            durationHours: 18,
            questions: 240,
            image: coursePhotos.anatomy,
            summary: "Digestive organs, glands, and hormone pathways that influence nutrition and metabolism.",
            unit: "Anatomy",
            yearLabel: "Year 1",
            subunit: "Digestive and Endocrine Systems",
            keywords: ["anatomy", "digestive", "endocrine", "year 1"]
        }, [
            {
                title: "Digestive Tract",
                lectureTitle: "GI anatomy",
                objective: "Describe the organs that move and process food.",
                body: "The digestive tract turns food into usable nutrients. Learn the stomach, intestines, liver, gallbladder, and pancreas, then connect them to abdominal symptoms and diet questions.",
                concepts: ["Stomach", "Intestines", "Pancreas"]
            },
            {
                title: "Hormone Glands",
                lectureTitle: "Endocrine anatomy",
                objective: "Identify the major endocrine glands and what they control.",
                body: "Endocrine anatomy helps explain metabolism, growth, and glucose control. Study the pituitary, thyroid, adrenals, pancreas, and gonads as a system of chemical messages.",
                concepts: ["Pituitary", "Thyroid", "Adrenal glands"]
            },
            {
                title: "Clinical Link",
                lectureTitle: "Nutrition and glucose",
                objective: "Connect anatomy to diabetes, nutrition, and GI care.",
                body: "GI and endocrine anatomy appear together in nursing care for feeding, blood sugar, weight change, and digestion problems. Use the structure to understand symptoms and safe interventions.",
                concepts: ["Glucose control", "Nutrition", "GI symptoms"]
            }
        ]),
        createCourseSeries({
            id: "anatomy-year-1-nervous-endocrine",
            title: "Anatomy Year 1: Nervous and Special Senses",
            category: "Anatomy",
            level: "Beginner",
            badge: "Year 1",
            durationHours: 19,
            questions: 260,
            image: coursePhotos.anatomy,
            summary: "Brain, spinal cord, nerves, and sensory systems for basic neuro assessment.",
            unit: "Anatomy",
            yearLabel: "Year 1",
            subunit: "Nervous and Special Senses",
            keywords: ["anatomy", "nervous system", "special senses", "year 1"]
        }, [
            {
                title: "Nervous System Map",
                lectureTitle: "Brain and nerves",
                objective: "Describe the main parts of the nervous system.",
                body: "The nervous system controls sensation, movement, and response. Learn the brain, spinal cord, peripheral nerves, and why they are important for assessment.",
                concepts: ["Brain", "Spinal cord", "Peripheral nerves"]
            },
            {
                title: "Special Senses",
                lectureTitle: "Vision and hearing",
                objective: "Identify the anatomy of the eye and ear.",
                body: "Vision and hearing are often tested in nursing because they affect safety and communication. Use this lesson to understand eye and ear structure and related assessment clues.",
                concepts: ["Eye", "Ear", "Communication"]
            },
            {
                title: "Clinical Link",
                lectureTitle: "Neuro checks",
                objective: "Use nervous system anatomy during neurological assessment.",
                body: "Neuro checks depend on knowing what the brain and nerves control. This lesson connects anatomy to alertness, movement, sensation, and urgent changes.",
                concepts: ["Alertness", "Movement", "Sensation"]
            }
        ])
    ];

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
            image: externalImages[external.id] || fallbackCourseImages[courses.length % fallbackCourseImages.length],
            summary: external.summary || "Lecturer-published nursing course.",
            contentNotes: external.contentNotes || "",
            uploadedDocument: external.uploadedDocument || null,
            lectureVideo: external.lectureVideo || "",
            lectureVideoName: external.lectureVideoName || "",
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
