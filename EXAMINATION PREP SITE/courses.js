const STORAGE_KEY = window.GnpLearning?.getStorageKey?.() || "gnp-learning-state-v2";
const courseImages = {
    nurseTablet: "https://images.unsplash.com/photo-1580281657527-47c57d5a0b8b?auto=format&fit=crop&q=80&w=1200",
    simulationLab: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
    lectureRoom: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
    medicationTray: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=1200",
    blisterPack: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=1200",
    pediatricCare: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200",
    criticalCare: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200",
    ecgTraining: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&q=80&w=1200",
    doseReview: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1200",
    reasoningBoard: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    mentorSession: "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&q=80&w=1200",
    anatomyLab: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=1200",
    skeletalStudy: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=1200",
    respiratoryCare: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200",
    digestionNotes: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=1200",
    pediatricsPlay: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=1200",
    pediatricWard: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=1200",
    emergencyTriage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1200",
    nclexDesk: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200",
    nurseConference: "https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&q=80&w=1200",
    medMath: "https://images.unsplash.com/photo-1576671414121-aa0c81c86931?auto=format&fit=crop&q=80&w=1200"
};

const courseCatalog = [
    {
        id: "nck-masterclass",
        title: "NCK Licensing Exam Masterclass",
        category: "Licensing Prep (NCK)",
        difficulty: "Intermediate",
        badge: "Flagship",
        durationHours: 40,
        questions: 1500,
        exams: 8,
        format: "Live + Recorded",
        summary: "Complete syllabus coverage, guided revision, mock exams, and structured lecturer support for the NCK pathway.",
        image: courseImages.nurseTablet,
        outcomes: ["End-to-end syllabus roadmap", "Weekly revision checkpoints", "Timed mock readiness"],
        facts: ["Mentor-led", "Revision plans", "Mock exams"],
        keywords: ["nck", "licensing", "mock exams", "study plan"],
        modules: [
            {
                title: "Cardiovascular Assessment and Monitoring",
                objective: "Recognize unstable findings early and connect assessment with urgent action.",
                body: "Build a fast, safe cardiovascular assessment routine for exams and clinical reasoning. You will practice reading the stem for red flags (chest pain, dyspnea, syncope), linking symptoms to perfusion, and interpreting trends in BP, pulse, urine output, and mental status.\n\nKey focus:\n• Distinguish stable vs unstable findings and what to escalate first\n• Interpret common monitoring data (SpO2, ECG basics, fluid balance) in context\n• Match assessment clues to the safest first nursing action and reassessment plan",
                pearlTitle: "Clinical Pearl",
                pearl: "In nursing exams, the question often hides priority in the trend rather than the single value. Compare symptoms, vitals, and timing together.",
                structures: ["Focused chest pain assessment", "Fluid balance and perfusion monitoring", "Escalation cues in acute deterioration"],
                image: courseImages.ecgTraining,
                quiz: {
                    prompt: "Which finding most strongly suggests reduced cardiac output?",
                    options: ["Warm dry skin", "Bounding pulses", "Hypotension with cool extremities", "Mild thirst"],
                    correctOption: 2,
                    success: "Correct. Cool extremities with hypotension point toward poor perfusion.",
                    failure: "Look for the option that most directly signals low perfusion."
                }
            },
            {
                title: "Medication Safety in Adult Care",
                objective: "Prioritize safe administration and monitoring in common adult medical conditions.",
                body: "Medication questions are safety questions. This module builds a step-by-step routine: verify the order and patient, check allergies and key vitals/labs, confirm route and timing, then plan monitoring and teaching.\n\nYou will revise:\n• High-alert meds and common do-not-give cues (e.g., abnormal pulse, low BP, critical labs)\n• Contraindication patterns and drug-condition red flags\n• What to monitor and document after administration so the answer stays safe",
                pearlTitle: "Clinical Pearl",
                pearl: "Medication questions reward sequence thinking: verify, assess, give, monitor, teach.",
                structures: ["High-alert medication checks", "Common contraindication patterns", "Monitoring after administration"],
                image: courseImages.blisterPack,
                quiz: {
                    prompt: "Before giving digoxin, which action is prioritized?",
                    options: ["Check apical pulse", "Offer food", "Encourage walking", "Give with milk"],
                    correctOption: 0,
                    success: "Correct. Digoxin should be checked against the apical pulse before administration.",
                    failure: "This drug requires a cardiovascular assessment before giving it."
                }
            },
            {
                title: "Mock Strategy and Rationales",
                objective: "Convert revision into exam performance using timing, elimination, and rationale review.",
                body: "Mock exams are only useful when you review them the right way. You will learn how to answer under time pressure, then turn every missed item into a clear revision target.\n\nApproach:\n• Use elimination + priority frameworks (ABCs, safety, infection control)\n• Build an error log (topic, why you missed it, the correct rule, and a mini-flashcard)\n• Schedule repeat practice so weak areas become strengths before the next mock",
                pearlTitle: "Clinical Pearl",
                pearl: "The fastest score growth usually comes from pattern review of repeated mistakes, not just doing more questions.",
                structures: ["Timed answer strategy", "Elimination under pressure", "Using rationales for targeted review"],
                image: courseImages.reasoningBoard,
                quiz: {
                    prompt: "What is the strongest use of an incorrect mock answer?",
                    options: ["Ignore it and move on", "Memorize only the right option", "Review the rationale and identify the weak concept", "Retake immediately without review"],
                    correctOption: 2,
                    success: "Correct. Rationales turn mistakes into targeted revision.",
                    failure: "Use wrong answers as a map to weak concepts, not just as marks lost."
                }
            }
        ]
    },
    {
        id: "nclex-comprehensive",
        title: "NCLEX-RN Comprehensive Prep",
        category: "NCLEX Preparation",
        difficulty: "Advanced",
        badge: "High Demand",
        durationHours: 52,
        questions: 2000,
        exams: 12,
        format: "Live Coaching",
        summary: "Next Generation case studies, CAT-style strategy, and decision-based coaching for serious NCLEX preparation.",
        image: courseImages.simulationLab,
        outcomes: ["NGN case-style reasoning", "CAT readiness habits", "Delegation and prioritization mastery"],
        facts: ["Advanced track", "Case simulations", "Coach feedback"],
        keywords: ["nclex", "ngn", "cat", "coaching"],
        modules: [
            {
                title: "NGN Case Framing",
                objective: "Break down client cases into assessment, hypotheses, and prioritized nursing action.",
                body: "Next Generation (NGN) cases test how you think, not what you can memorize. This module gives you a repeatable process to read the case, extract key cues, and select the safest priority action.\n\nYou will practice:\n• Identifying what is abnormal and what changed from baseline\n• Turning cues into reasonable hypotheses before choosing interventions\n• Selecting actions that match nursing judgment categories (assessment, intervention, evaluation)",
                pearlTitle: "Clinical Pearl",
                pearl: "NGN questions punish rushing. Start by naming what the patient problem is before choosing what to do.",
                structures: ["Cue recognition", "Hypothesis formation", "Priority response selection"],
                image: courseImages.nurseConference,
                quiz: {
                    prompt: "What should be identified first in an NGN case?",
                    options: ["The nurse's shift schedule", "The main patient problem", "The discharge date", "The room number"],
                    correctOption: 1,
                    success: "Correct. The main problem anchors every later decision.",
                    failure: "Start with the patient problem before interventions."
                }
            },
            {
                title: "Prioritization and Delegation",
                objective: "Strengthen judgement in who to see first, what to delegate, and what cannot wait.",
                body: "Prioritization questions reward safety and scope awareness. This module trains you to sort clients by instability and to delegate tasks appropriately while keeping nursing judgment with the RN.\n\nRules you will apply:\n• Unstable or acute changes come first; stable chronic issues can wait\n• RN keeps initial assessments, teaching, triage, and evaluation of responses\n• Delegate predictable routine tasks with clear instructions and follow-up",
                pearlTitle: "Clinical Pearl",
                pearl: "A safe delegation answer still keeps unstable, teaching, and high-risk assessment tasks with the RN.",
                structures: ["Stable vs unstable sorting", "Delegation boundaries", "Urgent reassessment patterns"],
                image: courseImages.mentorSession,
                quiz: {
                    prompt: "Which task should stay with the RN?",
                    options: ["Routine bed making", "Stable vital signs on a recovering patient", "Initial assessment of chest pain", "Transport to imaging"],
                    correctOption: 2,
                    success: "Correct. Initial assessment of chest pain belongs to the RN.",
                    failure: "Think about instability and need for nursing judgement."
                }
            },
            {
                title: "CAT Exam Endurance",
                objective: "Develop pacing and emotional control for adaptive testing conditions.",
                body: "CAT testing can feel unpredictable, so your goal is consistency. This module builds pacing habits and emotional control so you protect answer quality from start to finish.\n\nYou will learn:\n• Pacing checkpoints to prevent rushing or getting stuck\n• A reset routine after hard questions (breathe, reread, apply framework)\n• How to avoid common traps: changing answers without a reason and scoring yourself emotionally",
                pearlTitle: "Clinical Pearl",
                pearl: "Not knowing whether you're doing well is part of CAT. Keep quality high one question at a time.",
                structures: ["Pacing targets", "Reset routines between questions", "Adaptive test mindset"],
                image: courseImages.nclexDesk,
                quiz: {
                    prompt: "What is the best mindset in CAT testing?",
                    options: ["Guess faster to save time", "Focus on one high-quality answer at a time", "Track every difficult item emotionally", "Change strategy every five questions"],
                    correctOption: 1,
                    success: "Correct. CAT rewards consistent answer quality more than emotional reacting.",
                    failure: "Adaptive exams need calm consistency, not panic pacing."
                }
            }
        ]
    },
    {
        id: "lecture-series",
        title: "Global Nursing Lecture Series",
        category: "Professional Lectures",
        difficulty: "Beginner",
        badge: "Core Track",
        durationHours: 36,
        questions: 600,
        exams: 6,
        format: "Recorded",
        summary: "Foundational lectures across anatomy, pharmacology, med-surg, pediatrics, and community health for broad clinical grounding.",
        image: courseImages.lectureRoom,
        outcomes: ["Foundational theory refresh", "Concept linking for practice questions", "Flexible self-paced revision"],
        facts: ["Recorded lessons", "Core sciences", "Lecture notes"],
        keywords: ["anatomy", "med surg", "pediatrics", "lectures"],
        modules: [
            {
                title: "Cardiovascular System",
                objective: "Understand the physiological relationship between the heart, vessels, and systemic circulation.",
                body: "This lecture refreshes core cardiovascular physiology so exam stems make sense. You will connect heart anatomy and blood flow with cardiac output, blood pressure, and tissue perfusion.\n\nKey ideas:\n• Cardiac output = heart rate x stroke volume; BP reflects output + vascular resistance\n• Preload, afterload, and contractility shape common clinical findings\n• Nursing assessment emphasizes perfusion signs (skin, mentation, urine output) and fluid balance",
                pearlTitle: "Clinical Pearl",
                pearl: "Peripheral edema, jugular venous distension, and changes in exercise tolerance often point to evolving heart failure before the patient names chest pain.",
                structures: [
                    "Systemic circuit delivers oxygenated blood from the left ventricle to tissues.",
                    "Pulmonary circuit carries deoxygenated blood to the lungs for gas exchange."
                ],
                image: courseImages.anatomyLab,
                quiz: {
                    prompt: "Which chamber pumps oxygenated blood into the aorta?",
                    options: ["Right atrium", "Right ventricle", "Left ventricle", "Left atrium"],
                    correctOption: 2,
                    success: "Correct. The left ventricle generates the pressure needed for systemic circulation.",
                    failure: "Review the blood flow path from the lungs through the left side of the heart."
                }
            },
            {
                title: "Skeletal System",
                objective: "Connect bone structure to movement, protection, and mineral balance in the clinical setting.",
                body: "Understand bones as living tissue: support, protection, mineral storage, and blood cell production. This module links structure (axial vs appendicular) to movement and common clinical problems.\n\nYou will review:\n• Bone remodeling and calcium balance, and why immobility, steroids, and nutrition affect fracture risk\n• Red vs yellow marrow and the basics of hematopoiesis\n• Key post-injury assessment points: pain, swelling, and neurovascular status (circulation, sensation, movement)",
                pearlTitle: "Clinical Pearl",
                pearl: "Fracture risk is not only about trauma; prolonged immobility, steroid use, and nutritional deficits quietly weaken bone quality.",
                structures: [
                    "Axial skeleton protects the brain, spinal cord, and thoracic organs.",
                    "Appendicular skeleton enables mobility and weight transfer."
                ],
                image: courseImages.skeletalStudy,
                quiz: {
                    prompt: "Where does hematopoiesis primarily occur in adults?",
                    options: ["Ligaments", "Bone marrow", "Cartilage", "Synovial fluid"],
                    correctOption: 1,
                    success: "Correct. Adult blood cell production mainly occurs in red bone marrow.",
                    failure: "Think about which skeletal structure produces red and white blood cells."
                }
            },
            {
                title: "Respiratory Mechanics",
                objective: "Explain how ventilation, diffusion, and perfusion work together to maintain oxygenation.",
                body: "Respiratory questions often test early recognition of deterioration. This lecture explains ventilation (moving air), diffusion (gas exchange), and perfusion (blood flow) and how mismatch causes hypoxia.\n\nYou will learn to:\n• Identify increased work of breathing and why respiratory rate is an early warning sign\n• Connect common causes to patterns (obstruction, alveolar collapse, fluid, anxiety)\n• Choose safe first actions: positioning, oxygen support, and reassessment",
                pearlTitle: "Clinical Pearl",
                pearl: "A rising respiratory rate often appears before oxygen saturation drops. It is one of the earliest clinical warning signs.",
                structures: [
                    "Alveoli provide the primary surface area for oxygen and carbon dioxide diffusion.",
                    "The diaphragm is the main muscle driving inspiration at rest."
                ],
                image: courseImages.respiratoryCare,
                quiz: {
                    prompt: "Which structure is the primary site of gas exchange?",
                    options: ["Bronchi", "Trachea", "Alveoli", "Pleura"],
                    correctOption: 2,
                    success: "Correct. Gas exchange happens across the alveolar-capillary membrane.",
                    failure: "Gas exchange happens deeper in the lungs than the conducting airways."
                }
            }
        ]
    },
    {
        id: "pharmacology-intensive",
        title: "Pharmacology Intensive",
        category: "Pharmacology",
        difficulty: "Advanced",
        badge: "Calculation Lab",
        durationHours: 28,
        questions: 480,
        exams: 5,
        format: "Recorded + Quiz Bank",
        summary: "Drug classes, dosage calculations, medication safety, and rapid-fire review drills for high-stakes medication questions.",
        image: courseImages.medicationTray,
        outcomes: ["Dosage confidence", "Medication group recall", "Safer answer choices under pressure"],
        facts: ["Quiz bank", "Safety emphasis", "Drug tables"],
        keywords: ["drugs", "dosage", "medication safety"],
        modules: [
            {
                title: "Drug Class Recognition",
                objective: "Group medications by use, action, and common adverse effects.",
                body: "Stop memorizing drugs one by one—learn patterns. This module teaches you to recognize drug classes by suffixes/prefixes, typical uses, and predictable adverse effects.\n\nStudy method:\n• Build a one-page class table: name pattern -> action -> key adverse effects -> nursing checks\n• Link each class to watch-outs (vitals, labs, interactions) that exam items test\n• Use small comparison pairs to prevent confusion between similar classes",
                pearlTitle: "Clinical Pearl",
                pearl: "Drug suffixes often point you to both the class and the likely adverse effects.",
                structures: ["Class naming patterns", "High-yield adverse effects", "Nursing implications before administration"],
                image: courseImages.doseReview,
                quiz: {
                    prompt: "What is the quickest clue to identify a medication class in many exam questions?",
                    options: ["Patient age", "Drug suffix pattern", "Room location", "Nurse shift"],
                    correctOption: 1,
                    success: "Correct. Many medications can be recognized by their suffix pattern.",
                    failure: "Think of the naming feature built into many pharmacology questions."
                }
            },
            {
                title: "Dosage Safety and Calculations",
                objective: "Apply unit conversion and dose logic accurately without rushing.",
                body: "Medication math is about safety, not speed. You will practice unit conversions and dimensional analysis, then add the nursing safety steps that protect patients.\n\nFocus areas:\n• Conversions (mg <-> g, mL <-> L) and weight-based dosing setups\n• Rounding rules and dose-range checks (does the answer make clinical sense?)\n• Final habits: confirm route and concentration, double-check the order, then document and monitor",
                pearlTitle: "Clinical Pearl",
                pearl: "A correct calculation is not enough if the clinical dose still looks unsafe. Always sense-check the answer.",
                structures: ["Dose formula flow", "Unit conversion", "Reasonableness check"],
                image: courseImages.medMath,
                quiz: {
                    prompt: "After computing a dose, what should be done next?",
                    options: ["Give immediately", "Reasonableness and safety check", "Skip documentation", "Ignore the route"],
                    correctOption: 1,
                    success: "Correct. Safe dosing requires a final sense-check.",
                    failure: "Medication safety always includes a final plausibility review."
                }
            }
        ]
    },
    {
        id: "pediatrics-clinical",
        title: "Pediatrics Clinical Review",
        category: "Pediatrics",
        difficulty: "Intermediate",
        badge: "Clinical Focus",
        durationHours: 24,
        questions: 360,
        exams: 4,
        format: "Live Review",
        summary: "Growth and development, emergencies, family-centered care, and scenario-based pediatrics revision.",
        image: courseImages.pediatricCare,
        outcomes: ["Age-based nursing judgement", "Parent education confidence", "Emergency prioritization in children"],
        facts: ["Live sessions", "Case review", "Growth milestones"],
        keywords: ["children", "growth", "pediatric emergencies"],
        modules: [
            {
                title: "Growth and Development",
                objective: "Use age-specific expectations to guide nursing assessment and parent teaching.",
                body: "Pediatrics stems are age questions disguised as behavior questions. This module helps you match the child's age to expected milestones, communication style, and safety risks.\n\nYou will practice:\n• Spotting normal vs abnormal findings for the stated age\n• Planning parent teaching (injury prevention, feeding, sleep, play) by stage\n• Choosing actions that reduce fear and improve cooperation (simple language, caregiver presence)",
                pearlTitle: "Clinical Pearl",
                pearl: "Pediatrics questions often hide the answer inside what is normal for that age group.",
                structures: ["Milestone recognition", "Age-based communication", "Safety teaching by stage"],
                image: courseImages.pediatricsPlay,
                quiz: {
                    prompt: "What is the safest first step when answering a pediatrics milestone question?",
                    options: ["Assume adult norms", "Identify the child's developmental stage", "Choose the longest option", "Ignore age data"],
                    correctOption: 1,
                    success: "Correct. Age and stage drive the interpretation.",
                    failure: "The developmental stage is the anchor for the answer."
                }
            },
            {
                title: "Pediatric Emergencies",
                objective: "Prioritize airway, hydration, and escalation in acute pediatric scenarios.",
                body: "Children can compensate and then deteriorate quickly—exams test early signs. This module reviews high-yield pediatric red flags and the priority sequence for safe nursing response.\n\nYou will learn to spot:\n• Respiratory distress cues (retractions, nasal flaring, grunting, color change)\n• Dehydration severity and which findings require urgent escalation\n• Fever complications and when to reassess, support airway/breathing, and call for help",
                pearlTitle: "Clinical Pearl",
                pearl: "In pediatrics, subtle deterioration can become severe quickly. Trend changes matter.",
                structures: ["Respiratory distress warning signs", "Hydration assessment", "Escalation priorities"],
                image: courseImages.pediatricWard,
                quiz: {
                    prompt: "Which sign in a child needs urgent escalation?",
                    options: ["Playful behavior", "Normal appetite", "Increased work of breathing", "Mild curiosity"],
                    correctOption: 2,
                    success: "Correct. Increased work of breathing is a high-priority sign.",
                    failure: "Watch for the option that signals respiratory compromise."
                }
            }
        ]
    },
    {
        id: "med-surg-bootcamp",
        title: "Med-Surg Readiness Bootcamp",
        category: "Clinical Practice",
        difficulty: "Intermediate",
        badge: "Mock Ready",
        durationHours: 32,
        questions: 540,
        exams: 7,
        format: "Live + Recorded",
        summary: "Adult health systems review, prioritization practice, and readiness checkpoints for med-surg confidence.",
        image: courseImages.criticalCare,
        outcomes: ["System-based review", "Prioritization under pressure", "Readiness checkpoint discipline"],
        facts: ["Adult health", "Timed checkpoints", "Coach-guided review"],
        keywords: ["adult health", "clinical reasoning", "med surg"],
        modules: [
            {
                title: "Respiratory and Oxygenation Priorities",
                objective: "Prioritize nursing response in respiratory compromise and oxygenation failure.",
                body: "Med-surg prioritization is built on ABCs and safety. This module trains you to recognize when breathing/oxygenation is the primary threat and to choose the safest first action.\n\nYou will apply:\n• Rapid respiratory assessment (rate, effort, breath sounds, SpO2, mental status)\n• Immediate supportive steps (positioning, oxygen per protocol, call for help) with reassessment\n• Common exam traps: focusing on comfort or labs while the patient is deteriorating",
                pearlTitle: "Clinical Pearl",
                pearl: "In med-surg questions, breathing problems often outrank everything except immediate airway collapse.",
                structures: ["Respiratory assessment order", "Oxygenation warning signs", "Urgent supportive action"],
                image: courseImages.emergencyTriage,
                quiz: {
                    prompt: "In a deteriorating adult patient, which problem usually takes priority?",
                    options: ["Mild boredom", "Breathing compromise", "Delayed lunch", "Room transfer"],
                    correctOption: 1,
                    success: "Correct. Oxygenation problems are high priority.",
                    failure: "Choose the option most directly related to ABC priorities."
                }
            },
            {
                title: "Fluids, Electrolytes, and Monitoring",
                objective: "Interpret imbalance patterns and act on unsafe shifts early.",
                body: "Electrolyte items test pattern recognition plus monitoring. This module links lab changes to symptoms and shows what nursing action keeps the patient safest.\n\nYou will review:\n• High-yield patterns (Na/K/Ca/Mg) and their neuro, cardiac, and GI signs\n• What to monitor first when symptoms are present (vitals, ECG, intake/output, mental status)\n• Safe responses: report critical values, follow protocol, and reassess after interventions",
                pearlTitle: "Clinical Pearl",
                pearl: "Electrolyte questions often reward pattern matching: muscle, cardiac, neurological, and GI clues cluster together.",
                structures: ["Common imbalance clues", "Monitoring priorities", "Escalation and safety response"],
                image: courseImages.digestionNotes,
                quiz: {
                    prompt: "What is most important when an electrolyte result returns abnormal with symptoms?",
                    options: ["Ignore symptoms", "Delay all reassessment", "Match lab change with clinical presentation", "Focus only on discharge planning"],
                    correctOption: 2,
                    success: "Correct. Clinical significance matters as much as the number.",
                    failure: "Always connect the abnormal result with the patient's presentation."
                }
            }
        ]
    }
];

const additionalCourseTracks = [
    ["fundamentals-nursing", "Fundamentals of Nursing", "Fundamentals", "Beginner", "Core Skills", 30, 520, 5, "Recorded + Practice", "Patient safety, hygiene, mobility, vital signs, documentation, communication, and bedside nursing foundations.", courseImages.nurseTablet, ["basic care", "vitals", "documentation"]],
    ["health-assessment", "Health Assessment Mastery", "Assessment", "Beginner", "Assessment Lab", 34, 620, 6, "Recorded + Skills Lab", "Head-to-toe assessment, history taking, vital signs, focused assessment, and clinical reporting.", courseImages.mentorSession, ["assessment", "history", "vitals"]],
    ["anatomy-physiology", "Anatomy and Physiology for Nurses", "Anatomy", "Beginner", "Core Science", 42, 700, 6, "Recorded", "Body systems explained for nursing assessment, symptoms, interventions, and exam reasoning.", courseImages.anatomyLab, ["anatomy", "physiology", "systems"]],
    ["community-health", "Community Health Nursing", "Community Health", "Intermediate", "Public Health", 28, 430, 4, "Recorded + Cases", "Health promotion, epidemiology, family health, disease prevention, and community assessment.", courseImages.nurseConference, ["community", "public health", "prevention"]],
    ["mental-health", "Mental Health Nursing Review", "Mental Health", "Intermediate", "Therapeutic Care", 30, 500, 5, "Live Review", "Therapeutic communication, risk assessment, psychiatric conditions, crisis care, and safety planning.", courseImages.mentorSession, ["mental health", "communication", "risk"]],
    ["maternal-newborn", "Maternal and Newborn Nursing", "Maternal Health", "Intermediate", "Mother-Baby", 36, 620, 6, "Live + Recorded", "Pregnancy, labor, postpartum, newborn assessment, emergencies, and parent teaching.", courseImages.pediatricCare, ["maternal", "newborn", "postpartum"]],
    ["emergency-nursing", "Emergency and Triage Nursing", "Emergency", "Advanced", "Urgent Care", 32, 580, 6, "Simulation", "Triage, trauma priorities, shock, rapid assessment, emergency medications, and escalation.", courseImages.emergencyTriage, ["emergency", "triage", "trauma"]],
    ["critical-care", "Critical Care Nursing Foundations", "Critical Care", "Advanced", "ICU Track", 44, 760, 8, "Simulation + Cases", "ICU assessment, oxygenation, sepsis, shock, ventilation basics, and high-risk monitoring.", courseImages.criticalCare, ["icu", "critical care", "shock"]],
    ["surgical-nursing", "Perioperative and Surgical Nursing", "Surgical Nursing", "Intermediate", "Surgery Prep", 26, 410, 4, "Recorded", "Pre-op, intra-op, post-op care, anesthesia safety, wound monitoring, and discharge teaching.", courseImages.simulationLab, ["surgery", "perioperative", "wound"]],
    ["leadership-management", "Nursing Leadership and Management", "Leadership", "Intermediate", "Management", 24, 360, 4, "Recorded", "Delegation, supervision, ethics, team communication, patient safety, and quality improvement.", courseImages.nurseConference, ["leadership", "delegation", "management"]],
    ["research-evidence", "Nursing Research and Evidence-Based Practice", "Research", "Intermediate", "Evidence", 22, 320, 3, "Recorded", "Research basics, evidence appraisal, ethics, data interpretation, and applying evidence to nursing care.", courseImages.reasoningBoard, ["research", "evidence", "ethics"]],
    ["nutrition-dietetics", "Nutrition and Dietetics for Nurses", "Nutrition", "Beginner", "Nutrition Care", 24, 380, 4, "Recorded", "Therapeutic diets, nutrition assessment, diabetes nutrition, feeding support, and patient education.", courseImages.digestionNotes, ["nutrition", "diet", "feeding"]],
    ["geriatric-nursing", "Geriatric Nursing Care", "Geriatrics", "Intermediate", "Older Adult", 28, 440, 4, "Cases", "Older adult assessment, falls, dementia care, polypharmacy, mobility, and family support.", courseImages.mentorSession, ["geriatric", "older adult", "falls"]],
    ["oncology-nursing", "Oncology Nursing Review", "Oncology", "Advanced", "Cancer Care", 30, 460, 5, "Recorded + Cases", "Cancer basics, chemotherapy safety, symptom control, infection risk, and psychosocial support.", courseImages.medicationTray, ["oncology", "chemotherapy", "cancer"]],
    ["infection-prevention", "Infection Prevention and Control", "Infection Control", "Beginner", "Safety Track", 24, 520, 5, "Recorded + Drills", "Standard precautions, isolation, sterilization, outbreak control, and healthcare-associated infection prevention.", courseImages.blisterPack, ["infection", "isolation", "prevention"]],
    ["wound-care", "Wound Care and Tissue Viability", "Wound Care", "Intermediate", "Clinical Skills", 26, 390, 4, "Skills Lab", "Wound assessment, dressing selection, pressure injury prevention, diabetic wounds, and documentation.", courseImages.simulationLab, ["wound", "pressure injury", "dressing"]],
    ["neonatal-nursing", "Neonatal Nursing Essentials", "Neonatal", "Intermediate", "Newborn Care", 30, 420, 4, "Recorded + Cases", "Newborn transition, feeding, thermoregulation, jaundice, respiratory distress, and family teaching.", courseImages.pediatricWard, ["neonatal", "newborn", "jaundice"]],
    ["renal-nursing", "Renal Nursing and Dialysis Basics", "Renal", "Advanced", "Renal Care", 30, 450, 5, "Recorded", "Kidney function, AKI, CKD, dialysis basics, fluid balance, electrolytes, and patient education.", courseImages.doseReview, ["renal", "dialysis", "electrolytes"]],
    ["diabetes-endocrine", "Diabetes and Endocrine Nursing", "Endocrine", "Intermediate", "Diabetes Care", 28, 520, 5, "Recorded + Questions", "Diabetes care, insulin safety, endocrine emergencies, patient teaching, and complication prevention.", courseImages.medMath, ["diabetes", "insulin", "endocrine"]],
    ["cardiac-nursing", "Cardiac Nursing and ECG Basics", "Cardiac", "Advanced", "Cardiac Track", 34, 620, 6, "Simulation", "Cardiac assessment, ECG basics, chest pain, heart failure, cardiac medications, and escalation.", courseImages.ecgTraining, ["cardiac", "ecg", "heart failure"]]
];

courseCatalog.push(...additionalCourseTracks.map((track) => ({
    id: track[0],
    title: track[1],
    category: track[2],
    difficulty: track[3],
    badge: track[4],
    durationHours: track[5],
    questions: track[6],
    exams: track[7],
    format: track[8],
    summary: track[9],
    image: track[10],
    outcomes: ["Structured topic learning", "Practice question readiness", "Weak-area revision"],
    facts: [track[2], track[3], track[8]],
    keywords: track[11],
    modules: []
})));

const externalCourses = window.GnpLearning?.getCourses?.() || [];
externalCourses.forEach((course) => {
    if (courseCatalog.some((item) => item.id === course.id)) {
        return;
    }
    courseCatalog.push({
        id: course.id,
        title: course.title,
        category: course.category || "Nursing",
        difficulty: course.difficulty || "Beginner",
        badge: course.access === "paid" || Number(course.price || 0) > 0 ? "Paid" : "Free",
        durationHours: Number(course.durationHours || 24),
        questions: Number(course.questions || 100),
        exams: Number(course.exams || 1),
        format: course.format || "Lecturer notes",
        summary: course.summary || "Lecturer-posted nursing course.",
        image: course.image || courseImages.nurseTablet,
        outcomes: ["Structured topic learning", "Practice question readiness", "Weak-area revision"],
        facts: [course.category || "Nursing", course.difficulty || "Beginner", course.format || "Lecturer notes"],
        keywords: [course.title, course.category, course.lecturer].filter(Boolean),
        contentNotes: course.contentNotes || "",
        access: course.access || "free",
        price: Number(course.price || 0),
        lecturer: course.lecturer || "",
        uploadedDocument: course.uploadedDocument || null,
        modules: []
    });
});

const COURSE_TOPIC_BLUEPRINTS = {
    "nck-masterclass": [
        "Introduction to the NCK pathway",
        "Professional nursing ethics and scope",
        "Adult assessment and vital signs",
        "Cardiovascular and respiratory priorities",
        "Maternal and newborn nursing",
        "Pediatric safety and growth",
        "Mental health and therapeutic communication",
        "Medication safety and calculations",
        "Community health and infection prevention",
        "Emergency care and triage"
    ],
    "nclex-comprehensive": [
        "Introduction to NCLEX-RN and NGN thinking",
        "Clinical judgment model",
        "Cue recognition and case analysis",
        "Prioritization and delegation",
        "Safety, infection control, and risk reduction",
        "Pharmacology and adverse effects",
        "Med-surg systems review",
        "Maternal-child and pediatrics review",
        "Psychosocial integrity",
        "CAT exam strategy and endurance",
        "Rationale review and weak-area repair"
    ],
    "lecture-series": [
        "Introduction to professional nursing study",
        "Anatomy language and body organization",
        "Cardiovascular system",
        "Respiratory system",
        "Digestive and metabolic systems",
        "Renal and fluid balance",
        "Neurological assessment basics",
        "Pharmacology foundations",
        "Community health foundations",
        "Clinical documentation and communication"
    ],
    "pharmacology-intensive": [
        "Introduction to medication safety",
        "Drug class recognition",
        "Dosage calculations and conversions",
        "Antibiotics and infection treatment",
        "Cardiovascular medications",
        "Endocrine medications and insulin",
        "Respiratory medications",
        "Pain, sedation, and mental health drugs",
        "IV therapy and high-alert medication checks",
        "Patient teaching and adverse-effect monitoring"
    ],
    "pediatrics-clinical": [
        "Introduction to pediatric nursing",
        "Growth and developmental milestones",
        "Pediatric assessment and communication",
        "Immunization and health promotion",
        "Respiratory problems in children",
        "Fluid balance and dehydration",
        "Pediatric medication safety",
        "Family-centered care",
        "Pediatric emergencies",
        "Neonatal and infant priorities"
    ],
    "med-surg-bootcamp": [
        "Introduction to med-surg reasoning",
        "Adult health assessment",
        "Cardiovascular disorders",
        "Respiratory disorders",
        "Neurological disorders",
        "Endocrine and diabetes care",
        "Renal and fluid-electrolyte problems",
        "Gastrointestinal and nutrition care",
        "Perioperative nursing",
        "Prioritization, discharge, and patient teaching"
    ]
};

const MODULE_IMAGE_SEQUENCE = [
    courseImages.nurseTablet,
    courseImages.anatomyLab,
    courseImages.respiratoryCare,
    courseImages.ecgTraining,
    courseImages.medicationTray,
    courseImages.pediatricCare,
    courseImages.mentorSession,
    courseImages.reasoningBoard,
    courseImages.emergencyTriage,
    courseImages.nclexDesk
];

function createTextbookModule(course, topic, index) {
    const phase = index === 0 ? "Introduction" : `Unit ${index + 1}`;
    const lecturerNotes = String(course.contentNotes || "").trim();
    const noteExcerpt = lecturerNotes
        ? `\n\nLecturer notes:\n${lecturerNotes.slice(0, 1800)}${lecturerNotes.length > 1800 ? "\n\nContinue with the uploaded notes and class guidance from your lecturer." : ""}`
        : "";
    const body = `${topic} gives the student a structured textbook-style lesson for ${course.title}. Start by reading the key idea, then connect it to patient assessment, nursing priorities, exam wording, and safe clinical action.

Study content:
- Definition and purpose: understand what the topic means in nursing practice.
- Assessment cues: identify symptoms, vital-sign trends, risk factors, and patient statements that matter.
- Nursing action: decide what to assess first, what to report, what to teach, and what to document.
- Exam focus: watch for priority words such as first, best, most important, immediate, unstable, and teaching.
- Clinical link: connect the topic to patient safety, infection prevention, medication safety, communication, and escalation.

Textbook notes:
The first step in this topic is to understand the normal finding before studying the abnormal finding. A nursing student should ask: what should I expect in a stable patient, what has changed, and which change can harm the patient first? This habit improves clinical judgement because it forces you to compare baseline, current findings, and risk.

Assessment guide:
Collect subjective data, objective data, vital signs, medication history, allergies, pain level, mental status, hydration, mobility, and safety risks. Group the findings into urgent, important, and routine. Urgent findings usually affect airway, breathing, circulation, neurological status, severe pain, bleeding, infection risk, medication safety, or rapid deterioration.

Nursing priorities:
Use ABCs, safety, Maslow, infection control, medication rights, and scope of practice. If a question asks what to do first, choose the option that assesses instability, protects life, prevents harm, or escalates urgent findings. If the patient is stable, teaching, comfort, documentation, and planning become more appropriate.

Patient teaching:
Explain the condition in simple language, confirm understanding, include warning signs, medication safety, follow-up, diet or activity guidance where relevant, and when to seek urgent help. Good teaching is specific and checks understanding rather than only giving information.

Common exam traps:
Avoid answers that delay assessment, ignore abnormal vital signs, provide teaching during an emergency, delegate nursing judgement, document before intervening, or focus on a less urgent symptom. Long answers are not always correct; safe and timely answers are correct.

Revision checklist:
- Define the topic in your own words.
- List three important assessment cues.
- Identify the safest first nursing action.
- Write one patient teaching point.
- Explain why one wrong answer is unsafe.
- Connect the topic to medication safety, infection prevention, and escalation.

Clinical example:
A patient with a change in breathing, confusion, low blood pressure, chest pain, new weakness, uncontrolled bleeding, severe allergic reaction, or sudden deterioration should be treated as a priority. A stable patient needing teaching or routine documentation can usually wait while unstable cues are addressed.${noteExcerpt}`;

    return {
        title: `${phase}: ${topic}`,
        objective: `Build clear understanding of ${topic.toLowerCase()} before moving to practice questions.`,
        body,
        pearlTitle: "Textbook Focus",
        pearl: `Do not memorize this unit in isolation. Link ${topic.toLowerCase()} to assessment cues, safe nursing action, and the reason one answer is safer than another.`,
        structures: [
            "Core concept and definition",
            "Assessment findings and warning signs",
            "Nursing intervention and patient teaching",
            "Exam traps and rationale review"
        ],
        image: MODULE_IMAGE_SEQUENCE[index % MODULE_IMAGE_SEQUENCE.length],
        quiz: {
            prompt: `What is the safest way to study ${topic.toLowerCase()}?`,
            options: [
                "Memorize one sentence and skip practice",
                "Connect the concept to assessment cues, nursing action, and rationales",
                "Read only the title of the topic",
                "Wait until the main exam to revise it"
            ],
            correctOption: 1,
            success: "Correct. Strong nursing study links content, cues, action, and rationales.",
            failure: "Review the unit procedure: content must connect to patient cues and safe nursing action."
        }
    };
}

function createFinalPracticeModule(course, index) {
    return {
        title: "Final Practice: 100 lecturer-prep questions",
        objective: "Use a 100-question practice block to prepare for the lecturer-set main exam.",
        body: `This final unit is the preparation bridge between course learning and the main exam set by the lecturer. Complete the course units first, then attempt a 100-question practice block in exam conditions.

Practice procedure:
1. Review your notes from every completed unit.
2. Attempt 100 mixed questions without checking answers during the block.
3. Mark every missed question by weak topic, not just by score.
4. Re-study the weakest three topics before attempting another practice block.
5. When your practice score is consistent, proceed to the lecturer-set main exam.

Use this unit as a readiness checkpoint. The goal is not only to finish questions, but to prove that you can explain why the correct option is safest.`,
        pearlTitle: "Exam Readiness Rule",
        pearl: "A student is ready for the main exam when weak topics have been reviewed and practice scores are consistent, not when the course is simply opened.",
        structures: [
            "100 mixed practice questions",
            "Timed exam conditions",
            "Weak-topic correction list",
            "Lecturer-set main exam readiness"
        ],
        image: MODULE_IMAGE_SEQUENCE[index % MODULE_IMAGE_SEQUENCE.length],
        quiz: {
            prompt: "What should you do after finishing the 100-question practice block?",
            options: [
                "Ignore missed questions",
                "Record weak topics and revise them before the main exam",
                "Delete your notes",
                "Skip straight to a certificate"
            ],
            correctOption: 1,
            success: "Correct. Weak-topic review turns practice into exam readiness.",
            failure: "The practice block is useful only when missed questions become revision targets."
        }
    };
}

function expandCourseModules(course) {
    const topics = COURSE_TOPIC_BLUEPRINTS[course.id] || [
        "Introduction to the course",
        "Core concepts",
        "Assessment priorities",
        "Clinical decision making",
        "Medication and safety links",
        "Patient teaching",
        "Case-based reasoning",
        "Documentation and reporting",
        "Revision and weak-topic repair"
    ];

    const generated = topics.map((topic, index) => createTextbookModule(course, topic, index));
    generated.push(createFinalPracticeModule(course, generated.length));
    return generated;
}

courseCatalog.forEach((course) => {
    course.modules = expandCourseModules(course);
    course.questions = Math.max(course.questions, 100);
});

document.addEventListener("DOMContentLoaded", () => {
    initializeCatalogPage();
    initializeCourseDetailPage();
});

function uid(prefix = "id") {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return `${prefix}_${window.crypto.randomUUID()}`;
    }
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function initializeCatalogPage() {
    if (document.body.dataset.page !== "catalog") {
        return;
    }

    const grid = document.getElementById("course-grid");
    const categoryContainer = document.getElementById("category-filters");
    const filterPanel = document.getElementById("catalog-filter-panel");
    const filterToggle = document.getElementById("filter-toggle");
    const filterCard = filterToggle?.closest(".filter-rail-card");
    const searchInput = document.getElementById("course-search");
    const sortSelect = document.getElementById("sort-select");
    const resultCount = document.getElementById("catalog-results");
    const difficultyInputs = Array.from(document.querySelectorAll(".difficulty-filter"));
    const enrollButton = document.getElementById("selected-enroll-btn");

    const categories = ["All Courses", ...new Set(courseCatalog.map((course) => course.category))];
    const state = getLearningState();
    const view = {
        category: "All Courses",
        search: "",
        difficulties: [],
        sort: "featured",
        selectedCourseId: state.selectedCourseId || courseCatalog[0].id
    };

    filterToggle?.addEventListener("click", () => {
        const isOpen = filterPanel?.classList.toggle("is-open") === true;
        filterCard?.classList.toggle("filters-open", isOpen);
        filterToggle.setAttribute("aria-expanded", String(isOpen));
        filterToggle.textContent = isOpen ? "Hide filters" : "Show filters";
    });

    categoryContainer.innerHTML = categories
        .map((category) => renderCategoryFilter(category, category === view.category))
        .join("");

    categoryContainer.addEventListener("click", (event) => {
        const target = event.target.closest(".filter-chip");
        if (!target) {
            return;
        }

        view.category = target.dataset.category;
        categoryContainer.querySelectorAll(".filter-chip").forEach((chip) => {
            chip.classList.toggle("active", chip === target);
        });
        renderCatalog();
    });

    searchInput.addEventListener("input", (event) => {
        view.search = event.target.value.trim().toLowerCase();
        renderCatalog();
    });

    difficultyInputs.forEach((input) => {
        input.addEventListener("change", () => {
            view.difficulties = difficultyInputs.filter((item) => item.checked).map((item) => item.value);
            renderCatalog();
        });
    });

    sortSelect.addEventListener("change", (event) => {
        view.sort = event.target.value;
        renderCatalog();
    });

    enrollButton.addEventListener("click", () => {
        const latest = getLearningState();
        const selectedCourse = getCourseById(view.selectedCourseId);
        if (!selectedCourse) {
            return;
        }

        const enrolledIndex = latest.enrolledCourseIds.indexOf(selectedCourse.id);
        if (enrolledIndex === -1) {
            latest.enrolledCourseIds.push(selectedCourse.id);
            ensureCourseProgress(latest, selectedCourse.id);
        } else {
            window.location.href = `course-workspace.html?course=${encodeURIComponent(selectedCourse.id)}`;
            return;
        }
        latest.selectedCourseId = selectedCourse.id;
        saveLearningState(latest);
        renderCatalog();
    });

    renderCatalog();

    function renderCatalog() {
        const latestState = getLearningState();
        const filteredCourses = courseCatalog
            .filter((course) => matchesCategory(course, view.category))
            .filter((course) => matchesDifficulty(course, view.difficulties))
            .filter((course) => matchesSearch(course, view.search))
            .sort((left, right) => sortCourses(left, right, view.sort));

        if (!filteredCourses.some((course) => course.id === view.selectedCourseId)) {
            view.selectedCourseId = filteredCourses[0]?.id || courseCatalog[0].id;
        }

        const selectedCourse = getCourseById(view.selectedCourseId) || courseCatalog[0];
        latestState.selectedCourseId = selectedCourse.id;
        saveLearningState(latestState);

        resultCount.textContent = `${filteredCourses.length} ${filteredCourses.length === 1 ? "program" : "programs"}`;
        renderSelectedProgram(selectedCourse, latestState);

        if (!filteredCourses.length) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No programs match those filters.</h3>
                    <p>Try a broader search, switch category, or clear a difficulty filter.</p>
                </div>
            `;
            revealElements(document.querySelectorAll(".reveal-on-scroll"));
            return;
        }

        grid.innerHTML = filteredCourses
            .map((course) => renderCourseCard(course, latestState))
            .join("");

        grid.querySelectorAll("[data-enroll-course]").forEach((button) => {
            button.addEventListener("click", () => {
                const latest = getLearningState();
                const courseId = button.dataset.enrollCourse;
                const course = getCourseById(courseId);
                if (!course) {
                    return;
                }

                const enrolledIndex = latest.enrolledCourseIds.indexOf(courseId);
                if (enrolledIndex === -1) {
                    latest.enrolledCourseIds.push(courseId);
                    ensureCourseProgress(latest, courseId);
                } else {
                    window.location.href = `course-workspace.html?course=${encodeURIComponent(courseId)}`;
                    return;
                }

                latest.selectedCourseId = courseId;
                saveLearningState(latest);
                view.selectedCourseId = courseId;
                renderCatalog();
            });
        });

        grid.querySelectorAll("[data-cancel-course]").forEach((button) => {
            button.addEventListener("click", () => {
                const latest = getLearningState();
                const courseId = button.dataset.cancelCourse;
                const course = getCourseById(courseId);
                if (!course) {
                    return;
                }

                const ok = window.confirm(`Cancel enrollment in "${course.title}"?`);
                if (!ok) {
                    return;
                }

                latest.enrolledCourseIds = latest.enrolledCourseIds.filter((id) => id !== courseId);
                if (latest.selectedCourseId === courseId) {
                    latest.selectedCourseId = courseCatalog[0]?.id || "";
                }
                saveLearningState(latest);
                renderCatalog();
            });
        });

        revealElements(document.querySelectorAll(".reveal-on-scroll"));
    }

    function renderCategoryFilter(category, isActive) {
        const source = category === "All Courses"
            ? courseCatalog
            : courseCatalog.filter((course) => course.category === category);
        const moduleCount = source.reduce((sum, course) => sum + Number(course.modules?.length || 0), 0);
        const questionCount = source.reduce((sum, course) => sum + Number(course.questions || 0), 0);
        const label = category === "All Courses" ? "Full catalog" : category;

        return `
            <button class="filter-chip academy-category-chip${isActive ? " active" : ""}" data-category="${category}">
                <span class="category-marker" aria-hidden="true"></span>
                <span class="category-copy">
                    <strong>${label}</strong>
                    <small>${moduleCount} modules, ${questionCount.toLocaleString()} questions</small>
                </span>
                <span class="category-count">${source.length}</span>
            </button>
        `;
    }
}

function initializeCourseDetailPage() {
    if (document.body.dataset.page !== "course-detail") {
        return;
    }

    const state = getLearningState();
    const params = new URLSearchParams(window.location.search);
    const requestedCourseId = params.get("course");
    const requestedModuleIndex = Number(params.get("module"));
    const currentCourse = getCourseById(requestedCourseId) || getCourseById(state.selectedCourseId) || courseCatalog[0];

    state.selectedCourseId = currentCourse.id;
    const currentProgress = ensureCourseProgress(state, currentCourse.id);
    if (!state.enrolledCourseIds.includes(currentCourse.id)) {
        saveLearningState(state);
        window.location.href = "courses.html";
        return;
    }
    currentProgress.currentModuleIndex = Number.isInteger(requestedModuleIndex)
        ? clampModuleIndex(requestedModuleIndex, currentCourse.modules.length)
        : clampModuleIndex(currentProgress.currentModuleIndex, currentCourse.modules.length);
    saveLearningState(state);

    const elements = {
        workspaceTitle: document.getElementById("workspace-course-title"),
        workspaceSummary: document.getElementById("workspace-course-summary"),
        workspaceMeta: document.getElementById("workspace-meta"),
        workspaceProgressLabel: document.getElementById("workspace-progress-label"),
        workspaceProgressBar: document.getElementById("workspace-progress-bar"),
        workspaceSaveState: document.getElementById("workspace-save-state"),
        completedCount: document.getElementById("workspace-completed-count"),
        nextStep: document.getElementById("workspace-next-step"),
        switcher: document.getElementById("workspace-course-switcher"),
        outlineList: document.getElementById("workspace-outline-list"),
        modulePositionLabel: document.getElementById("module-position-label"),
        moduleTitle: document.getElementById("module-title"),
        moduleLessonType: document.getElementById("module-lesson-type"),
        moduleStatusLabel: document.getElementById("module-status-label"),
        moduleCheckLabel: document.getElementById("module-check-label"),
        moduleObjective: document.getElementById("module-objective"),
        moduleBody: document.getElementById("module-body"),
        modulePearlTitle: document.getElementById("module-pearl-title"),
        modulePearlBody: document.getElementById("module-pearl-body"),
        structureList: document.getElementById("module-structures"),
        quizPanel: document.getElementById("module-quiz-panel"),
        quizToggle: document.getElementById("toggle-quiz-btn"),
        quizPrompt: document.getElementById("quiz-prompt"),
        quizOptions: document.querySelector(".quiz-options"),
        quizFeedback: document.querySelector(".quiz-feedback"),
        finalReadinessPanel: document.getElementById("final-readiness-panel"),
        certificateLink: document.getElementById("course-certificate-link"),
        prevButton: document.getElementById("prev-module-btn"),
        nextButton: document.getElementById("next-module-btn"),
        markCompleteButton: document.getElementById("mark-complete-btn")
    };

    let activeCourse = currentCourse;
    let activeModuleIndex = clampModuleIndex(state.progress[activeCourse.id].currentModuleIndex, activeCourse.modules.length);

    elements.prevButton.addEventListener("click", () => {
        if (activeModuleIndex > 0) {
            activeModuleIndex -= 1;
            persistModulePosition();
            renderWorkspace();
        }
    });

    elements.quizToggle?.addEventListener("click", () => {
        if (!elements.quizPanel) return;
        const latest = getLearningState();
        const progress = ensureCourseProgress(latest, activeCourse.id);
        if (!isCourseLearningComplete(progress)) {
            elements.quizFeedback.textContent = "Finish all learning modules before opening course questions.";
            elements.quizFeedback.className = "quiz-feedback";
            return;
        }
        const isHidden = elements.quizPanel.classList.toggle("hidden");
        elements.quizToggle.setAttribute("aria-expanded", String(!isHidden));
        elements.quizToggle.textContent = isHidden ? "Show final questions" : "Hide final questions";
    });

    elements.nextButton.addEventListener("click", () => {
        if (activeModuleIndex < activeCourse.modules.length - 1) {
            activeModuleIndex += 1;
            persistModulePosition();
            renderWorkspace();
        }
    });

    elements.markCompleteButton.addEventListener("click", () => {
        const latest = getLearningState();
        const progress = ensureCourseProgress(latest, activeCourse.id);
        if (progress.completedModules.includes(activeModuleIndex)) {
            return;
        }

        if (!progress.completedModules.includes(activeModuleIndex)) {
            progress.completedModules.push(activeModuleIndex);
        }
        progress.currentModuleIndex = activeModuleIndex;
        progress.lastVisited = new Date().toISOString();
        saveLearningState(latest);
        elements.workspaceSaveState.textContent = "Module completed";
        renderWorkspace();
    });

    elements.quizOptions.addEventListener("change", (event) => {
        const selectedOption = event.target.closest("input[type='radio']");
        if (!selectedOption) {
            return;
        }

        const latest = getLearningState();
        const progress = ensureCourseProgress(latest, activeCourse.id);
        progress.quizAnswers[activeModuleIndex] = Number(selectedOption.value);
        if (progress.quizPassed?.[activeModuleIndex]) {
            progress.quizPassed[activeModuleIndex] = false;
        }
        if (progress.quizChecked?.[activeModuleIndex]) {
            progress.quizChecked[activeModuleIndex] = false;
        }
        progress.lastVisited = new Date().toISOString();
        saveLearningState(latest);
        elements.workspaceSaveState.textContent = "Answer saved";
        renderWorkspace();
    });

    document.querySelector(".check-answer-btn").addEventListener("click", () => {
        const selectedOption = elements.quizOptions.querySelector("input[type='radio']:checked");
        if (!selectedOption) {
            elements.quizFeedback.textContent = "Select an answer before checking your understanding.";
            elements.quizFeedback.className = "quiz-feedback";
            return;
        }

        const module = activeCourse.modules[activeModuleIndex];
        const isCorrect = Number(selectedOption.value) === module.quiz.correctOption;

        const latest = getLearningState();
        const progress = ensureCourseProgress(latest, activeCourse.id);
        progress.quizChecked[activeModuleIndex] = true;
        progress.quizPassed[activeModuleIndex] = isCorrect;
        progress.lastVisited = new Date().toISOString();
        saveLearningState(latest);
        elements.workspaceSaveState.textContent = isCorrect ? "Knowledge check passed" : "Review and retry";
        renderWorkspace();
    });

    renderWorkspace();

    function renderWorkspace() {
        const latest = getLearningState();
        const progress = ensureCourseProgress(latest, activeCourse.id);

        elements.workspaceTitle.textContent = activeCourse.title;
        elements.workspaceSummary.textContent = activeCourse.summary;
        elements.workspaceMeta.innerHTML = [
            createMetaPill("Track", activeCourse.category),
            createMetaPill("Level", activeCourse.difficulty),
            createMetaPill("Format", activeCourse.format)
        ].join("");

        const percent = getProgressPercent(activeCourse.id, latest);
        elements.workspaceProgressLabel.textContent = `${percent}% complete`;
        elements.workspaceProgressBar.style.width = `${percent}%`;
        if (elements.completedCount) {
            elements.completedCount.textContent = `${progress.completedModules.length} of ${activeCourse.modules.length} modules`;
        }
        if (elements.nextStep) {
            elements.nextStep.textContent = getNextStepLabel(progress);
        }
        renderSwitcher(latest);
        renderOutline(progress);
        renderModule(progress);
        renderFinalReadiness(progress);
        revealElements(document.querySelectorAll(".reveal-on-scroll"));
    }

    function renderSwitcher(latest) {
        const enrolledCourses = latest.enrolledCourseIds.map(getCourseById).filter(Boolean);
        elements.switcher.innerHTML = enrolledCourses
            .map((course) => {
                const percent = getProgressPercent(course.id);
                return `
                    <a class="workspace-course-link${course.id === activeCourse.id ? " active" : ""}" href="course-workspace.html?course=${encodeURIComponent(course.id)}">
                        <strong>${course.title}</strong>
                        <span>${percent}% complete</span>
                    </a>
                `;
            })
            .join("");
    }

    function renderOutline(progress) {
        elements.outlineList.innerHTML = activeCourse.modules
            .map((module, index) => {
                const completed = progress.completedModules.includes(index);
                return `
                <li class="outline-item${index === activeModuleIndex ? " active" : ""}${completed ? " completed" : ""}" data-module-index="${index}">
                    <span>${module.title}</span>
                    <small>${completed ? "Complete" : "Learning"}</small>
                </li>
            `;
            })
            .join("");

        elements.outlineList.querySelectorAll("[data-module-index]").forEach((item) => {
            item.addEventListener("click", () => {
                activeModuleIndex = Number(item.dataset.moduleIndex);
                persistModulePosition();
                renderWorkspace();
            });
        });
    }

    function renderModule(progress) {
        const module = activeCourse.modules[activeModuleIndex];
        const savedAnswer = progress.quizAnswers[activeModuleIndex];
        const passed = progress.quizPassed?.[activeModuleIndex] === true;
        const checked = progress.quizChecked?.[activeModuleIndex] === true;
        const completed = progress.completedModules.includes(activeModuleIndex);
        const learningComplete = isCourseLearningComplete(progress);

        if (elements.modulePositionLabel) {
            elements.modulePositionLabel.textContent = `Module ${activeModuleIndex + 1} of ${activeCourse.modules.length}`;
        }
        elements.moduleTitle.textContent = module.title;
        if (elements.moduleLessonType) {
            elements.moduleLessonType.textContent = activeCourse.format || "Guided lesson";
        }
        if (elements.moduleStatusLabel) {
            elements.moduleStatusLabel.textContent = completed ? "Completed" : "In progress";
        }
        if (elements.moduleCheckLabel) {
            elements.moduleCheckLabel.textContent = learningComplete ? "Questions unlocked" : "Learning";
        }
        elements.moduleObjective.textContent = module.objective;
        elements.moduleBody.textContent = module.body;
        elements.modulePearlTitle.textContent = module.pearlTitle;
        elements.modulePearlBody.textContent = module.pearl;
        elements.structureList.innerHTML = module.structures
            .map((item, index) => `<li><span>${index + 1}</span><strong>${item}</strong></li>`)
            .join("");
        elements.quizPanel?.classList.add("hidden");
        if (elements.quizToggle) {
            elements.quizToggle.setAttribute("aria-expanded", "false");
            elements.quizToggle.textContent = learningComplete ? "Show final questions" : "Complete lessons first";
            elements.quizToggle.disabled = !learningComplete;
            elements.quizToggle.classList.toggle("is-disabled", !learningComplete);
        }
        elements.quizPrompt.textContent = module.quiz.prompt;
        elements.quizOptions.innerHTML = module.quiz.options
            .map((option, optionIndex) => `
                <label>
                    <input type="radio" name="module-quiz" value="${optionIndex}" ${savedAnswer === optionIndex ? "checked" : ""}>
                    <span>${option}</span>
                </label>
            `)
            .join("");
        if (checked) {
            elements.quizFeedback.textContent = passed ? module.quiz.success : module.quiz.failure;
            elements.quizFeedback.className = `quiz-feedback ${passed ? "correct" : "incorrect"}`;
        } else {
            elements.quizFeedback.textContent = "";
            elements.quizFeedback.className = "quiz-feedback";
        }
        elements.prevButton.disabled = activeModuleIndex === 0;
        elements.nextButton.disabled = activeModuleIndex === activeCourse.modules.length - 1;
        elements.nextButton.textContent = activeModuleIndex === activeCourse.modules.length - 1 ? "Stay on Final Module" : "Next Module";
        elements.markCompleteButton.disabled = completed;
        elements.markCompleteButton.textContent = completed ? "Completed" : "Mark Lesson Complete";
        elements.workspaceProgressBar.style.width = `${getProgressPercent(activeCourse.id)}%`;
        elements.workspaceProgressLabel.textContent = `${getProgressPercent(activeCourse.id)}% complete`;
    }

    function getNextStepLabel(progress) {
        const completed = progress.completedModules.includes(activeModuleIndex);
        if (isCourseLearningComplete(progress)) {
            return "Learning complete. Open final questions and certificate readiness.";
        }
        if (!completed) {
            return "Read this lesson and mark it complete when finished.";
        }
        return "Move to the next module.";
    }

    function isCourseLearningComplete(progress) {
        return progress.completedModules.length >= activeCourse.modules.length;
    }

    function renderFinalReadiness(progress) {
        if (!elements.finalReadinessPanel) {
            return;
        }

        const completedCount = progress.completedModules.length;
        const remaining = Math.max(0, activeCourse.modules.length - completedCount);
        const ready = isCourseLearningComplete(progress);
        renderCertificateLink(progress, ready);
        elements.finalReadinessPanel.innerHTML = `
            <div class="readiness-score ${ready ? "ready" : ""}">
                <strong>${ready ? "Certificate unlocked" : `${remaining} lessons left`}</strong>
                <span>${ready ? "You have completed the learning pathway. Final questions are now available." : "Complete every lesson before answering final questions or opening a certificate."}</span>
            </div>
            <div class="readiness-checks">
                <span class="${completedCount > 0 ? "done" : ""}">Started course</span>
                <span class="${completedCount >= Math.ceil(activeCourse.modules.length / 2) ? "done" : ""}">Halfway checkpoint</span>
                <span class="${ready ? "done" : ""}">Certificate ready</span>
            </div>
        `;
    }

    function renderCertificateLink(progress, ready) {
        if (!elements.certificateLink) return;
        if (!ready) {
            elements.certificateLink.href = "#";
            elements.certificateLink.textContent = "Certificate locked";
            elements.certificateLink.classList.add("is-disabled");
            elements.certificateLink.setAttribute("aria-disabled", "true");
            return;
        }

        if (!progress.certificate?.id) {
            progress.certificate = {
                id: uid("cert"),
                issuedAt: new Date().toISOString()
            };
            const latest = getLearningState();
            latest.progress[activeCourse.id] = progress;
            saveLearningState(latest);
        }

        const params = new URLSearchParams({
            source: "course",
            courseId: activeCourse.id,
            title: activeCourse.title,
            certId: progress.certificate.id
        });
        elements.certificateLink.href = `../certificate.html?${params.toString()}`;
        elements.certificateLink.textContent = "View Certificate";
        elements.certificateLink.classList.remove("is-disabled");
        elements.certificateLink.setAttribute("aria-disabled", "false");
    }

    function persistModulePosition() {
        const latest = getLearningState();
        const progress = ensureCourseProgress(latest, activeCourse.id);
        progress.currentModuleIndex = activeModuleIndex;
        progress.lastVisited = new Date().toISOString();
        latest.selectedCourseId = activeCourse.id;
        saveLearningState(latest);
        elements.workspaceSaveState.textContent = "Synced";
    }
}

function renderCourseCard(course, state) {
    const enrolled = state.enrolledCourseIds.includes(course.id);
    const percent = getProgressPercent(course.id, state);
    const workspaceHref = `course-workspace.html?course=${encodeURIComponent(course.id)}`;
    const courseImage = course.image || "../assets/nursing-hero.svg";
    return `
        <article class="course-card homepage-style-course-card reveal-on-scroll">
            <img class="course-card-image" src="${courseImage}" alt="${course.title} course image" loading="lazy">
            <div class="course-card-body">
                <div class="badge-row">
                    <span class="badge">${course.category}</span>
                    <span class="badge alt">${course.difficulty}</span>
                    <span class="badge alt">${course.modules.length} units</span>
                    <span class="badge alt">${Number(course.price || 0) > 0 ? `KES ${Number(course.price).toLocaleString()}` : "Free"}</span>
                    ${enrolled ? `<span class="course-chip enrolled-chip">Enrolled</span>` : ""}
                </div>
                <h4>${course.title}</h4>
                <p>${course.summary}</p>
                <div class="muted small">${Number(course.questions || 0).toLocaleString()}+ questions • ${Number(course.durationHours || 0)}h guided study • ${Number(course.exams || 0)} assessments</div>
                <div class="course-progress-inline">
                    <div class="progress-bar"><span style="width:${percent}%"></span></div>
                    <small>${percent}% complete</small>
                </div>
                <div class="muted small">${percent >= 100 ? "Certificate unlocked" : "Certificate locked until course completion"}</div>
                <div class="course-actions card-actions">
                    <button class="btn-primary" data-enroll-course="${course.id}">${enrolled ? "Continue learning" : "Enroll"}</button>
                    <a class="btn-outline${enrolled ? "" : " is-disabled"}" href="${enrolled ? workspaceHref : "#selected-program"}">${enrolled ? "Open course" : "Enroll to open"}</a>
                    ${enrolled ? `<button class="btn-outline" data-cancel-course="${course.id}">Cancel</button>` : ""}
                </div>
            </div>
        </article>
    `;
}

function renderSelectedProgram(course, state) {
    const progress = ensureCourseProgress(state, course.id);
    const percent = getProgressPercent(course.id, state);
    const enrolled = state.enrolledCourseIds.includes(course.id);

    document.getElementById("selected-title").textContent = course.title;
    document.getElementById("selected-summary").textContent = course.summary;
    document.getElementById("selected-image").src = course.image;
    document.getElementById("selected-image").alt = course.title;
    document.getElementById("selected-facts").innerHTML = [
        createMetaPill("Duration", `${course.durationHours} hours`),
        createMetaPill("Format", course.format),
        createMetaPill("Units", `${course.modules.length} units`),
        createMetaPill("Practice", "100 final questions")
    ].join("");
    const outline = document.getElementById("selected-outline");
    if (outline) {
        outline.innerHTML = `
            <div class="selected-outline-head">
                <strong>${course.title} structure</strong>
                <span>${course.modules.length} learning units before the final practice block.</span>
            </div>
            <ol>
                ${course.modules.map((module, index) => `
                    <li>
                        <span>${index + 1}</span>
                        <strong>${module.title}</strong>
                    </li>
                `).join("")}
            </ol>
        `;
    }
    const openBtn = document.getElementById("selected-open-btn");
    if (openBtn) {
        openBtn.href = enrolled ? `course-workspace.html?course=${encodeURIComponent(course.id)}` : "#selected-program";
        openBtn.removeAttribute("target");
        openBtn.removeAttribute("rel");
        openBtn.textContent = enrolled ? "Open Workspace" : "Enroll to open";
        openBtn.classList.toggle("is-disabled", !enrolled);
        openBtn.setAttribute("aria-disabled", String(!enrolled));
    }
    const enrollBtn = document.getElementById("selected-enroll-btn");
    if (enrollBtn) {
        enrollBtn.textContent = enrolled ? "Continue learning" : "Enroll";
        enrollBtn.classList.toggle("btn-outline", enrolled);
        enrollBtn.classList.toggle("btn-primary", !enrolled);
    }
    document.getElementById("selected-enrollment-status").textContent = enrolled ? "Enrolled" : "Not enrolled";
    document.getElementById("selected-progress-status").textContent = `${percent}%`;
    document.getElementById("selected-progress-bar").style.width = `${percent}%`;
    document.getElementById("selected-last-activity").textContent = progress.lastVisited
        ? `Last activity: ${formatDate(progress.lastVisited)}`
        : "No activity yet. Start this program to begin saving progress.";

}

function getLearningState() {
    const fallback = {
        selectedCourseId: courseCatalog[0].id,
        enrolledCourseIds: [],
        progress: {}
    };

    const core = window.GnpLearning;
    let parsed = null;
    if (core?.loadState) {
        parsed = core.loadState();
    } else {
        try {
            parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        } catch {
            parsed = null;
        }
    }

    const state = parsed && typeof parsed === "object" ? parsed : fallback;
    state.selectedCourseId ||= fallback.selectedCourseId;
    state.enrolledCourseIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : fallback.enrolledCourseIds.slice();
    state.progress = state.progress && typeof state.progress === "object" ? state.progress : {};

    state.enrolledCourseIds.forEach((courseId) => ensureCourseProgress(state, courseId));
    ensureCourseProgress(state, state.selectedCourseId);

    saveLearningState(state);
    return state;
}

function saveLearningState(state) {
    const core = window.GnpLearning;
    if (core?.saveState) {
        core.saveState(state);
        return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureCourseProgress(state, courseId) {
    if (!state.progress[courseId]) {
        state.progress[courseId] = {
            currentModuleIndex: 0,
            completedModules: [],
            notes: {},
            quizAnswers: {},
            quizChecked: {},
            quizPassed: {},
            certificate: null,
            courseTitle: "",
            courseCategory: "",
            courseDifficulty: "",
            totalModules: 0,
            lastVisited: ""
        };
    }

    const progress = state.progress[courseId];
    progress.currentModuleIndex = Number.isFinite(progress.currentModuleIndex) ? progress.currentModuleIndex : 0;
    progress.completedModules = Array.isArray(progress.completedModules) ? progress.completedModules : [];
    progress.notes = progress.notes && typeof progress.notes === "object" ? progress.notes : {};
    progress.quizAnswers = progress.quizAnswers && typeof progress.quizAnswers === "object" ? progress.quizAnswers : {};
    progress.quizChecked = progress.quizChecked && typeof progress.quizChecked === "object" ? progress.quizChecked : {};
    progress.quizPassed = progress.quizPassed && typeof progress.quizPassed === "object" ? progress.quizPassed : {};
    progress.certificate = progress.certificate && typeof progress.certificate === "object" ? progress.certificate : null;
    progress.courseTitle = typeof progress.courseTitle === "string" ? progress.courseTitle : "";
    progress.courseCategory = typeof progress.courseCategory === "string" ? progress.courseCategory : "";
    progress.courseDifficulty = typeof progress.courseDifficulty === "string" ? progress.courseDifficulty : "";
    progress.totalModules = Number.isFinite(progress.totalModules) ? progress.totalModules : 0;
    progress.lastVisited = typeof progress.lastVisited === "string" ? progress.lastVisited : "";

    const course = getCourseById(courseId);
    if (course) {
        progress.courseTitle = course.title;
        progress.courseCategory = course.category;
        progress.courseDifficulty = course.difficulty;
        progress.totalModules = course.modules.length;
    }

    return progress;
}

function getProgressPercent(courseId, providedState = null) {
    const state = providedState || getLearningState();
    const course = getCourseById(courseId);
    const progress = ensureCourseProgress(state, courseId);
    if (!course || !course.modules.length) {
        return 0;
    }
    return Math.round((progress.completedModules.length / course.modules.length) * 100);
}

function getCourseById(courseId) {
    return courseCatalog.find((course) => course.id === courseId) || null;
}

function createMetaPill(label, value) {
    return `<div class="meta-pill"><strong>${label}</strong><span>${value}</span></div>`;
}

function matchesCategory(course, selectedCategory) {
    return selectedCategory === "All Courses" || course.category === selectedCategory;
}

function matchesDifficulty(course, selectedDifficulties) {
    return selectedDifficulties.length === 0 || selectedDifficulties.includes(course.difficulty);
}

function matchesSearch(course, searchValue) {
    if (!searchValue) {
        return true;
    }

    const haystack = [course.title, course.category, course.summary, ...course.keywords, ...course.outcomes].join(" ").toLowerCase();
    return haystack.includes(searchValue);
}

function sortCourses(left, right, sortMode) {
    if (sortMode === "questions") {
        return right.questions - left.questions;
    }
    if (sortMode === "duration") {
        return right.durationHours - left.durationHours;
    }
    if (sortMode === "title") {
        return left.title.localeCompare(right.title);
    }
    return right.exams - left.exams;
}

function clampModuleIndex(index, length) {
    if (!length) {
        return 0;
    }
    return Math.max(0, Math.min(index, length - 1));
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }
    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function revealElements(elements) {
    const targets = Array.from(elements || []).filter(Boolean);
    if (!targets.length) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.transitionDelay = reduceMotion ? "0ms" : `${Math.min(index * 45, 240)}ms`;
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
    }, { threshold: 0.15, rootMargin: "0px 0px -30px 0px" });

    targets.forEach((element) => {
        if (!element.classList.contains("is-visible")) {
            observer.observe(element);
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const courseMediaPool = [
        "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80"
    ];

    const ensureCourseMedia = () => {
        document.querySelectorAll(".program-card, .course-card, .workspace-card, .learning-card").forEach((card, index) => {
            const existingImage = card.querySelector("img");
            const fallback = courseMediaPool[index % courseMediaPool.length];

            if (existingImage) {
                if (!existingImage.getAttribute("src")) {
                    existingImage.src = fallback;
                }

                existingImage.addEventListener("error", () => {
                    existingImage.src = fallback;
                }, { once: true });
                return;
            }

            const media = document.createElement("div");
            media.className = "card-media auto-media";
            media.innerHTML = `<img src="${fallback}" alt="Course preview image">`;
            card.prepend(media);
        });
    };

    ensureCourseMedia();
    window.setTimeout(ensureCourseMedia, 250);
});
