(() => {
    const CONTENT_ENDPOINT = "/api/exam-prep/content";
    const STORAGE_KEY = "gnp-learning-state-v2";
    const fallbackCourseMeta = [
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
            summary: "Complete syllabus coverage, guided revision, and mock readiness for learners preparing for the NCK pathway.",
            image: "https://images.unsplash.com/photo-1580281657527-47c57d5a0b8b?auto=format&fit=crop&q=80&w=1200"
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
            summary: "Case-based practice, CAT-style endurance, and next-generation reasoning for serious NCLEX preparation.",
            image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200"
        },
        {
            id: "lecture-series",
            title: "Global Nursing Lecture Series",
            category: "Professional Courses",
            difficulty: "Beginner",
            badge: "Core Track",
            durationHours: 36,
            questions: 600,
            exams: 6,
            format: "Recorded",
            summary: "Foundational anatomy, physiology, and clinical refreshers for guided self-paced revision.",
            image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200"
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
            summary: "Drug classes, dosage calculations, and medication safety drills for high-stakes pharmacology questions.",
            image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=1200"
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
            summary: "Growth and development, emergencies, medication safety, and family-centered care for pediatric revision.",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200"
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
            image: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200"
        }
    ];
    const defaultContent = buildSeedContent();

    let cachedContentPromise = null;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") {
            return fallback;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function buildSeedContent() {
        const detailsByCourse = {
            "nck-masterclass": {
                outcomes: ["Syllabus roadmap", "Timed revision checkpoints", "Mock readiness"],
                facts: ["Mentor-led", "Revision plans", "Course tests"],
                keywords: ["nck", "licensing", "priority questions"],
                practiceExam: {
                    title: "NCK Full Mock Practice",
                    durationMinutes: 90,
                    questionCount: 75,
                    passMark: 70,
                    instructions: "Use this after completing the modules and review your weakest topic first."
                },
                modules: [
                    createModule({
                        id: "nck-cardiovascular",
                        title: "Cardiovascular Assessment and Monitoring",
                        objective: "Recognize unstable cardiovascular findings and act on priority perfusion cues.",
                        body: "This module trains you to read chest pain, dyspnea, hypotension, urine output, and mental-status changes as a connected picture. The focus is on what makes the patient unstable and what the nurse should do first.",
                        videoSummary: "Review how to connect symptoms, trends, and perfusion findings before choosing the safest first action.",
                        image: fallbackCourseMeta[0].image,
                        structures: ["Perfusion trend reading", "Focused chest-pain assessment", "Escalation timing"],
                        flashcards: [
                            { front: "Low cardiac output clue", back: "Hypotension with cool extremities suggests poor perfusion." },
                            { front: "Priority pattern", back: "Compare symptoms, timing, vitals, and mentation together." }
                        ],
                        recommendedFocus: ["Differentiate stable vs unstable findings", "Link cues to the safest first nursing action"],
                        quiz: {
                            prompt: "Which finding most strongly suggests reduced cardiac output?",
                            timeLimitSeconds: 90,
                            options: ["Warm dry skin", "Bounding pulses", "Hypotension with cool extremities", "Mild thirst"],
                            correctOption: 2,
                            success: "Correct. Cool extremities with hypotension point toward poor perfusion.",
                            failure: "Look for the option that most clearly signals poor circulation.",
                            rationale: "Low output commonly appears with hypotension, cool skin, weak pulses, and low urine output."
                        }
                    }),
                    createModule({
                        id: "nck-medication",
                        title: "Medication Safety in Adult Care",
                        objective: "Use verification, assessment, monitoring, and teaching in medication questions.",
                        body: "Medication items are safety items. Practice checking the order, identifying allergies, reviewing key vitals or labs, and deciding what to monitor after administration.",
                        videoSummary: "Study the sequence that keeps medication answers safe from the first check to the final monitoring step.",
                        image: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=1200",
                        structures: ["High-alert medication checks", "Do-not-give cues", "Monitoring after administration"],
                        flashcards: [
                            { front: "Medication question sequence", back: "Verify, assess, give, monitor, and teach." },
                            { front: "Digoxin safety check", back: "Check the apical pulse before administration." }
                        ],
                        recommendedFocus: ["Recognize abnormal vitals/labs that change the answer", "Revise pre-administration safety checks"],
                        quiz: {
                            prompt: "Before giving digoxin, which action is prioritized?",
                            timeLimitSeconds: 90,
                            options: ["Check apical pulse", "Offer food", "Encourage walking", "Give with milk"],
                            correctOption: 0,
                            success: "Correct. Digoxin should be checked against the apical pulse before administration.",
                            failure: "Choose the answer that protects the patient before the medication is given.",
                            rationale: "Digoxin can worsen bradycardia, so the pulse must be checked first."
                        }
                    }),
                    createModule({
                        id: "nck-mock-strategy",
                        title: "Mock Strategy and Rationales",
                        objective: "Turn mock scores into targeted review using rationales and repeat planning.",
                        body: "Mock exams are valuable when every wrong answer becomes a study target. This module focuses on elimination frameworks, error logs, and turning missed questions into flashcard-style revision points.",
                        videoSummary: "Learn how to review rationales and identify the concept behind repeated mistakes.",
                        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Timed answer strategy", "Elimination under pressure", "Rationale-based review"],
                        flashcards: [
                            { front: "Best use of a missed question", back: "Review the rationale and identify the weak concept." },
                            { front: "Priority frameworks", back: "ABCs, safety, infection control, and instability help with elimination." }
                        ],
                        recommendedFocus: ["Review why elimination failed", "Create flashcards from rationales"],
                        quiz: {
                            prompt: "What is the strongest use of an incorrect mock answer?",
                            timeLimitSeconds: 75,
                            options: ["Ignore it and move on", "Memorize only the right option", "Review the rationale and identify the weak concept", "Retake immediately without review"],
                            correctOption: 2,
                            success: "Correct. Rationales turn mistakes into targeted revision.",
                            failure: "Use wrong answers as a map to weak concepts.",
                            rationale: "The real score gain comes from identifying the concept or decision rule that failed."
                        }
                    })
                ]
            },
            "nclex-comprehensive": {
                outcomes: ["NGN reasoning", "Delegation mastery", "CAT readiness"],
                facts: ["Advanced track", "Case simulations", "Coach feedback"],
                keywords: ["nclex", "ngn", "cat", "delegation"],
                practiceExam: {
                    title: "NCLEX Readiness Exam",
                    durationMinutes: 110,
                    questionCount: 85,
                    passMark: 72,
                    instructions: "Complete this after the modules and revisit the lowest-scoring domain first."
                },
                modules: [
                    createModule({
                        id: "nclex-ngn",
                        title: "NGN Case Framing",
                        objective: "Break down case cues into the main patient problem and safest next action.",
                        body: "Next Generation case studies test how you interpret patient cues. Practice noticing what changed from baseline, naming the main problem, and choosing actions that fit the nursing judgment step.",
                        videoSummary: "Focus on cue recognition before jumping to interventions.",
                        image: "https://images.unsplash.com/photo-1576765608866-5b51046452be?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Cue recognition", "Hypothesis formation", "Priority response selection"],
                        flashcards: [
                            { front: "First NGN step", back: "Identify the main patient problem before selecting actions." },
                            { front: "NGN trap", back: "Rushing to interventions before interpreting the available cues." }
                        ],
                        recommendedFocus: ["Identify what changed from baseline", "Choose the action that fits the problem"],
                        quiz: {
                            prompt: "What should be identified first in an NGN case?",
                            timeLimitSeconds: 90,
                            options: ["The nurse's shift schedule", "The main patient problem", "The discharge date", "The room number"],
                            correctOption: 1,
                            success: "Correct. The main problem anchors every later decision.",
                            failure: "Start with the patient problem before choosing interventions.",
                            rationale: "NGN reasoning begins by recognizing and analyzing the most important patient cue cluster."
                        }
                    }),
                    createModule({
                        id: "nclex-delegation",
                        title: "Prioritization and Delegation",
                        objective: "Separate RN-only work from predictable delegated tasks and sort unstable patients first.",
                        body: "These items reward safety and scope awareness. Keep unstable assessments, teaching, and triage with the RN, while delegating routine predictable tasks appropriately.",
                        videoSummary: "Use unstable-versus-stable sorting and RN-scope rules to improve prioritization.",
                        image: "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Stable vs unstable sorting", "Delegation boundaries", "Urgent reassessment"],
                        flashcards: [
                            { front: "RN keeps", back: "Initial assessment, teaching, triage, unstable patients, and evaluation." },
                            { front: "Safe delegation rule", back: "Delegate predictable routine tasks with clear instructions." }
                        ],
                        recommendedFocus: ["Practice RN scope decisions", "Spot acute change faster"],
                        quiz: {
                            prompt: "Which task should stay with the RN?",
                            timeLimitSeconds: 90,
                            options: ["Routine bed making", "Stable vital signs on a recovering patient", "Initial assessment of chest pain", "Transport to imaging"],
                            correctOption: 2,
                            success: "Correct. Initial assessment of chest pain belongs to the RN.",
                            failure: "Think about instability and tasks that require nursing judgment.",
                            rationale: "Unstable complaints and initial assessments require RN-level clinical judgment."
                        }
                    }),
                    createModule({
                        id: "nclex-cat",
                        title: "CAT Exam Endurance",
                        objective: "Protect answer quality under adaptive testing pressure.",
                        body: "CAT exams feel unpredictable, so pacing and emotional control matter. Build checkpoints, reset after difficult items, and stay focused on one quality answer at a time.",
                        videoSummary: "Use pacing routines instead of emotional reacting when the exam becomes difficult.",
                        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Pacing checkpoints", "Reset routine", "Adaptive-test mindset"],
                        flashcards: [
                            { front: "Best CAT mindset", back: "Focus on one high-quality answer at a time." },
                            { front: "Reset routine", back: "Pause, breathe, reread, and apply a stable framework." }
                        ],
                        recommendedFocus: ["Protect pacing under pressure", "Avoid emotional score-guessing"],
                        quiz: {
                            prompt: "What is the best mindset in CAT testing?",
                            timeLimitSeconds: 75,
                            options: ["Guess faster to save time", "Focus on one high-quality answer at a time", "Track every difficult item emotionally", "Change strategy every five questions"],
                            correctOption: 1,
                            success: "Correct. CAT rewards consistent answer quality.",
                            failure: "Adaptive exams need calm consistency, not panic pacing.",
                            rationale: "A stable decision process protects performance better than reacting emotionally."
                        }
                    })
                ]
            },
            "lecture-series": {
                outcomes: ["Theory refresh", "Concept linking", "Self-paced revision"],
                facts: ["Recorded lessons", "Core sciences", "Lecture notes"],
                keywords: ["anatomy", "respiratory", "cardiovascular"],
                practiceExam: {
                    title: "Foundations Consolidation Check",
                    durationMinutes: 60,
                    questionCount: 45,
                    passMark: 68,
                    instructions: "Use this to connect science foundations to bedside nursing reasoning."
                },
                modules: [
                    createModule({
                        id: "lecture-cardiovascular",
                        title: "Cardiovascular System",
                        objective: "Connect circulation, cardiac output, and bedside perfusion assessment.",
                        body: "This lecture refreshes the relationships between blood flow, blood pressure, and tissue perfusion so exam stems make more clinical sense.",
                        videoSummary: "Review the cardiovascular system as flow, pressure, and perfusion rather than isolated facts.",
                        image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Systemic circulation", "Pulmonary circulation", "Perfusion signs"],
                        flashcards: [
                            { front: "Cardiac output formula", back: "Heart rate multiplied by stroke volume." },
                            { front: "Left ventricle role", back: "Pumps oxygenated blood into the aorta." }
                        ],
                        recommendedFocus: ["Link physiology to assessment", "Review perfusion signs"],
                        quiz: {
                            prompt: "Which chamber pumps oxygenated blood into the aorta?",
                            timeLimitSeconds: 60,
                            options: ["Right atrium", "Right ventricle", "Left ventricle", "Left atrium"],
                            correctOption: 2,
                            success: "Correct. The left ventricle drives systemic circulation.",
                            failure: "Review blood flow from the lungs through the left side of the heart.",
                            rationale: "Oxygenated blood enters the left side of the heart and is pumped systemically by the left ventricle."
                        }
                    }),
                    createModule({
                        id: "lecture-respiratory",
                        title: "Respiratory Mechanics",
                        objective: "Explain ventilation, diffusion, and perfusion in clinical oxygenation questions.",
                        body: "Respiratory questions often test early recognition of deterioration. This module connects work of breathing, gas exchange, and perfusion mismatch to the nurse's first response.",
                        videoSummary: "Use respiratory rate and work of breathing as early warning clues before saturation falls.",
                        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Ventilation", "Diffusion", "Perfusion"],
                        flashcards: [
                            { front: "Primary gas exchange site", back: "Gas exchange occurs across the alveolar-capillary membrane." },
                            { front: "Early warning sign", back: "A rising respiratory rate often appears before oxygen saturation drops." }
                        ],
                        recommendedFocus: ["Spot early deterioration", "Review safe first actions for hypoxia"],
                        quiz: {
                            prompt: "Which structure is the primary site of gas exchange?",
                            timeLimitSeconds: 60,
                            options: ["Bronchi", "Trachea", "Alveoli", "Pleura"],
                            correctOption: 2,
                            success: "Correct. Gas exchange happens in the alveoli.",
                            failure: "Review where oxygen and carbon dioxide actually cross into the blood.",
                            rationale: "The alveoli provide the membrane where gas exchange takes place."
                        }
                    }),
                    createModule({
                        id: "lecture-skeletal",
                        title: "Skeletal System",
                        objective: "Connect bone structure and marrow function to clinical nursing questions.",
                        body: "Understand bones as living tissue involved in movement, protection, mineral storage, and blood-cell production.",
                        videoSummary: "Review the axial and appendicular skeleton and link them to assessment after injury.",
                        image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Axial skeleton", "Appendicular skeleton", "Red bone marrow"],
                        flashcards: [
                            { front: "Axial skeleton", back: "Protects the brain, spinal cord, and thoracic organs." },
                            { front: "Adult hematopoiesis site", back: "Red bone marrow." }
                        ],
                        recommendedFocus: ["Review marrow and bone functions", "Strengthen anatomy-to-assessment links"],
                        quiz: {
                            prompt: "Where does hematopoiesis primarily occur in adults?",
                            timeLimitSeconds: 60,
                            options: ["Ligaments", "Bone marrow", "Cartilage", "Synovial fluid"],
                            correctOption: 1,
                            success: "Correct. Adult blood-cell production mainly occurs in red bone marrow.",
                            failure: "Think about the skeletal structure responsible for producing blood cells.",
                            rationale: "Red bone marrow is the main adult site of hematopoiesis."
                        }
                    })
                ]
            },
            "pharmacology-intensive": {
                outcomes: ["Dosage confidence", "Medication-class recall", "Safer answer choices"],
                facts: ["Quiz bank", "Safety emphasis", "Drug tables"],
                keywords: ["drugs", "dosage", "medication safety"],
                practiceExam: {
                    title: "Pharmacology Speed Check",
                    durationMinutes: 55,
                    questionCount: 40,
                    passMark: 75,
                    instructions: "Use this after both modules and repeat the medication classes you still confuse."
                },
                modules: [
                    createModule({
                        id: "pharm-drug-classes",
                        title: "Drug Class Recognition",
                        objective: "Identify medication classes from name patterns, actions, and common adverse effects.",
                        body: "This module helps you stop memorizing drugs one by one by using class patterns, expected side effects, and the nursing checks that commonly appear in questions.",
                        videoSummary: "Review suffix patterns and high-yield adverse effects that appear repeatedly in pharmacology items.",
                        image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Class naming patterns", "Adverse effects", "Pre-administration checks"],
                        flashcards: [
                            { front: "Quick class clue", back: "Drug suffix patterns often identify the medication class." },
                            { front: "Study table format", back: "Name pattern, action, adverse effects, and required checks." }
                        ],
                        recommendedFocus: ["Learn suffix patterns", "Separate look-alike classes using comparison tables"],
                        quiz: {
                            prompt: "What is the quickest clue to identify a medication class in many exam questions?",
                            timeLimitSeconds: 75,
                            options: ["Patient age", "Drug suffix pattern", "Room location", "Nurse shift"],
                            correctOption: 1,
                            success: "Correct. Suffix patterns are often the fastest clue to class recognition.",
                            failure: "Look for the clue built into the medication name itself.",
                            rationale: "Many medication classes share naming patterns that point to action and side effects."
                        }
                    }),
                    createModule({
                        id: "pharm-calculations",
                        title: "Dosage Calculations and Safe Administration",
                        objective: "Combine medication math with a strong safety check before choosing the answer.",
                        body: "Calculation questions test more than arithmetic. You must still judge whether the final dose makes sense for the patient, concentration, and route.",
                        videoSummary: "Use dimensional analysis and then stop for a final safety pause before accepting the answer.",
                        image: "https://images.unsplash.com/photo-1576671414121-aa0c81c86931?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Dimensional analysis", "Dose and concentration check", "Clinical-sense review"],
                        flashcards: [
                            { front: "Safe math habit", back: "Write units at each step so they cancel correctly." },
                            { front: "Final safety question", back: "Does this dose make clinical sense for the patient and route?" }
                        ],
                        recommendedFocus: ["Strengthen unit conversions", "Always recheck concentration and route"],
                        quiz: {
                            prompt: "What should the nurse do after calculating a medication dose?",
                            timeLimitSeconds: 75,
                            options: ["Administer immediately without review", "Check whether the dose makes clinical sense", "Ignore the route", "Ask the patient to verify the math"],
                            correctOption: 1,
                            success: "Correct. Safety requires checking whether the dose is clinically reasonable.",
                            failure: "Medication math ends with a safety review, not only a number.",
                            rationale: "A correct equation can still produce an unsafe answer if the wrong concentration or unreasonable dose is used."
                        }
                    })
                ]
            },
            "pediatrics-clinical": {
                outcomes: ["Age-based prioritization", "Safer escalation", "Family-centered communication"],
                facts: ["Scenario-based", "Growth milestones", "Emergency review"],
                keywords: ["pediatrics", "children", "growth", "family care"],
                practiceExam: {
                    title: "Pediatrics Scenario Check",
                    durationMinutes: 50,
                    questionCount: 35,
                    passMark: 72,
                    instructions: "Use the exam after both modules to connect milestones with emergency priorities."
                },
                modules: [
                    createModule({
                        id: "peds-growth",
                        title: "Growth, Development, and Communication",
                        objective: "Apply age-appropriate expectations when assessing pediatric clients and teaching families.",
                        body: "Pediatric questions reward developmental awareness. Think about age-appropriate behavior, communication style, and how family-centered care changes teaching.",
                        videoSummary: "Review developmental milestones and how they change nursing communication and support.",
                        image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Age-appropriate communication", "Milestones and safety", "Family teaching"],
                        flashcards: [
                            { front: "Preschool teaching style", back: "Use short explanations, concrete language, and play." },
                            { front: "Family-centered care", back: "Include caregivers as partners in teaching and planning." }
                        ],
                        recommendedFocus: ["Match communication to developmental stage", "Review family-centered teaching"],
                        quiz: {
                            prompt: "What is most important when teaching a preschool child?",
                            timeLimitSeconds: 60,
                            options: ["Use abstract explanations only", "Use short concrete language and play", "Teach only the caregiver", "Avoid visual aids"],
                            correctOption: 1,
                            success: "Correct. Preschool learners respond best to simple concrete language and play-based support.",
                            failure: "Think about how developmental stage affects understanding.",
                            rationale: "Preschool children learn best through concrete language, play, and short explanations."
                        }
                    }),
                    createModule({
                        id: "peds-emergency",
                        title: "Pediatric Emergencies and Family-Centered Care",
                        objective: "Recognize early deterioration in children while supporting the caregiver.",
                        body: "Children can compensate well and then deteriorate quickly. Focus on respiratory changes, hydration status, and caregiver observations.",
                        videoSummary: "Study early respiratory distress and dehydration cues before collapse occurs.",
                        image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Respiratory distress clues", "Hydration and perfusion", "Caregiver reassurance"],
                        flashcards: [
                            { front: "Early respiratory distress", back: "Nasal flaring and retractions can appear before saturation drops." },
                            { front: "Dehydration clue", back: "Low urine output, dry mucosa, and lethargy suggest worsening fluid deficit." }
                        ],
                        recommendedFocus: ["Catch pediatric deterioration early", "Use caregiver observations seriously"],
                        quiz: {
                            prompt: "Which finding is an early sign of respiratory distress in a child?",
                            timeLimitSeconds: 60,
                            options: ["Nasal flaring and retractions", "Pink lips with easy breathing", "Normal play behavior", "Warm dry skin only"],
                            correctOption: 0,
                            success: "Correct. Nasal flaring and retractions are early distress cues.",
                            failure: "Look for the answer that reflects increased work of breathing.",
                            rationale: "Children often show work-of-breathing changes before oxygen saturation declines."
                        }
                    })
                ]
            },
            "med-surg-bootcamp": {
                outcomes: ["Stronger prioritization", "Faster deterioration recognition", "Mock readiness"],
                facts: ["Clinical priorities", "Escalation cues", "Mock checkpoints"],
                keywords: ["med surg", "adult health", "deterioration"],
                practiceExam: {
                    title: "Med-Surg Readiness Test",
                    durationMinutes: 70,
                    questionCount: 50,
                    passMark: 70,
                    instructions: "Take this after both modules and revisit respiratory or sepsis topics first if needed."
                },
                modules: [
                    createModule({
                        id: "medsurg-respiratory",
                        title: "Respiratory Deterioration and Oxygenation",
                        objective: "Recognize worsening oxygenation and respond with safe first actions.",
                        body: "Med-surg questions often test increasing work of breathing, changing respiratory rate, and which first-line nursing response protects the patient fastest.",
                        videoSummary: "Use respiratory rate and work of breathing as early warning signs before saturation crashes.",
                        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Early warning signs", "Positioning and oxygen support", "Escalation after reassessment"],
                        flashcards: [
                            { front: "Early sign", back: "A rising respiratory rate often appears early in deterioration." },
                            { front: "First response", back: "Position the patient, support oxygenation, and reassess quickly." }
                        ],
                        recommendedFocus: ["Recognize early respiratory decline", "Review first-line oxygenation support"],
                        quiz: {
                            prompt: "Which sign often appears early in respiratory deterioration?",
                            timeLimitSeconds: 60,
                            options: ["Rising respiratory rate", "Silence in the room", "Improved appetite", "Lower anxiety after exertion"],
                            correctOption: 0,
                            success: "Correct. Increased respiratory rate is an early deterioration clue.",
                            failure: "Look for the earliest bedside sign of worsening breathing effort.",
                            rationale: "Respiratory rate and work of breathing often change before saturation falls dramatically."
                        }
                    }),
                    createModule({
                        id: "medsurg-sepsis",
                        title: "Fluid Balance, Sepsis, and Early Escalation",
                        objective: "Use perfusion clues to recognize worsening fluid imbalance and possible sepsis.",
                        body: "These stems reward trend reading. Think about temperature, blood pressure, heart rate, urine output, mental status, and skin findings together rather than as isolated facts.",
                        videoSummary: "Review sepsis clues and why urine output and mentation matter during reassessment.",
                        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1200",
                        structures: ["Perfusion trends", "Sepsis red flags", "Escalation timing"],
                        flashcards: [
                            { front: "Sepsis clue cluster", back: "Tachycardia, hypotension, confusion, and low urine output are high-risk together." },
                            { front: "Perfusion trend", back: "Cool skin, confusion, and falling urine output suggest worsening organ perfusion." }
                        ],
                        recommendedFocus: ["Review sepsis recognition patterns", "Use urine output as a perfusion marker"],
                        quiz: {
                            prompt: "Which finding best suggests worsening perfusion in possible sepsis?",
                            timeLimitSeconds: 75,
                            options: ["Warm hands with stable vitals", "Falling urine output and confusion", "Normal appetite", "Improved mobility"],
                            correctOption: 1,
                            success: "Correct. Falling urine output with confusion signals worsening perfusion.",
                            failure: "Choose the answer that most clearly reflects systemic instability.",
                            rationale: "Reduced urine output and altered mental status are key indicators of worsening perfusion."
                        }
                    })
                ]
            }
        };

        return {
            settings: {
                hero: {
                    eyebrow: "Global Nurse Training and Exam Prep",
                    title: "Professional nursing exam learning platform.",
                    lead: "Guided lessons, timed quizzes, flashcards, and progress tracking for nursing learners.",
                    image: "https://images.unsplash.com/photo-1576765607924-b0e5c0f7eb82?auto=format&fit=crop&q=80&w=1400",
                    primaryCtaLabel: "Explore Courses",
                    secondaryCtaLabel: "Open Exam Center"
                },
                announcement: {
                    label: "Platform Update",
                    message: "Timed quizzes, flashcards, and saved learning progress are active in the course workspace.",
                    actionLabel: "Open Course Workspace",
                    actionHref: "courses.html#selected-program"
                },
                stats: [
                    { value: "6", label: "Learning tracks" },
                    { value: "5,480+", label: "Practice questions" },
                    { value: "15", label: "Guided modules" },
                    { value: "Auto", label: "Progress sync" }
                ],
                featuredCourseIds: ["nck-masterclass", "nclex-comprehensive", "pharmacology-intensive"],
                workspaceGuidance: [
                    "Start with the lesson summary before attempting the quiz.",
                    "Use flashcards to lock in cues, rationales, and nursing priorities.",
                    "Pass the module quiz before moving forward.",
                    "Finish every module to unlock your certificate."
                ],
                studentHighlights: [
                    { title: "Structured pathways", description: "Clear learning tracks for NCK, NCLEX, pharmacology, pediatrics, and med-surg revision." },
                    { title: "Course workspace engine", description: "Sidebar navigation, locked progression, saved notes, and live progress indicators." },
                    { title: "Weak-area coaching", description: "Missed quiz attempts surface the next topic to revisit automatically." }
                ],
                adminTips: []
            },
            courses: fallbackCourseMeta.map((course) => ({
                ...course,
                ...(detailsByCourse[course.id] || {
                    outcomes: ["Guided revision"],
                    facts: ["Structured study"],
                    keywords: ["nursing"],
                    practiceExam: {
                        title: "Course Practice Exam",
                        durationMinutes: 45,
                        questionCount: 30,
                        passMark: 70,
                        instructions: "Use this after completing the course modules."
                    },
                    modules: []
                })
            }))
        };
    }

    function createModule(module) {
        return {
            id: module.id,
            title: module.title,
            objective: module.objective,
            body: module.body,
            videoSummary: module.videoSummary || "",
            videoEmbedUrl: "",
            videoResourceUrl: "",
            image: module.image || "",
            structures: Array.isArray(module.structures) ? module.structures : [],
            flashcards: Array.isArray(module.flashcards) ? module.flashcards : [],
            recommendedFocus: Array.isArray(module.recommendedFocus) ? module.recommendedFocus : [],
            quiz: module.quiz
        };
    }

    async function fetchContent(force = false) {
        if (!force && cachedContentPromise) {
            return cachedContentPromise;
        }

        cachedContentPromise = fetch(CONTENT_ENDPOINT, {
            headers: {
                Accept: "application/json"
            }
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Unable to load exam prep content (${response.status})`);
                }

                const payload = await response.json();
                if (!payload?.ok || !payload.content) {
                    throw new Error("Exam prep content payload was empty.");
                }
                return payload.content;
            })
            .catch(async (error) => {
                console.warn(error);
                try {
                    const fallbackResponse = await fetch("../data/exam-prep-content.json", {
                        headers: {
                            Accept: "application/json"
                        }
                    });
                    if (fallbackResponse.ok) {
                        const fallbackPayload = await fallbackResponse.json();
                        if (fallbackPayload && typeof fallbackPayload === "object") {
                            return fallbackPayload;
                        }
                    }
                } catch (innerError) {
                    console.warn("Exam prep local data fallback failed.", innerError);
                }
                return clone(defaultContent);
            });

        return cachedContentPromise;
    }

    function getLearningState(courses = []) {
        const fallback = {
            selectedCourseId: courses[0]?.id || "",
            enrolledCourseIds: [],
            progress: {}
        };

        const core = window.GnpLearning;
        let parsed = null;
        if (core?.loadState) {
            parsed = core.loadState();
        } else {
            parsed = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
        }

        const state = parsed && typeof parsed === "object" ? parsed : fallback;
        state.selectedCourseId = typeof state.selectedCourseId === "string" ? state.selectedCourseId : fallback.selectedCourseId;
        state.enrolledCourseIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];
        state.progress = state.progress && typeof state.progress === "object" ? state.progress : {};

        courses.forEach((course) => ensureCourseProgress(state, course));
        if (!state.selectedCourseId && courses[0]) {
            state.selectedCourseId = courses[0].id;
        }

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

    function ensureCourseProgress(state, course) {
        if (!course?.id) {
            return null;
        }

        if (!state.progress[course.id]) {
            state.progress[course.id] = {
                courseId: course.id,
                courseTitle: course.title,
                courseCategory: course.category,
                courseDifficulty: course.difficulty,
                totalModules: course.modules.length,
                currentModuleIndex: 0,
                completedModules: [],
                notes: {},
                videoWatched: {},
                quizAnswers: {},
                quizChecked: {},
                quizPassed: {},
                quizAttempts: {},
                quizScores: {},
                studyDates: [],
                certificate: null,
                lastVisited: ""
            };
        }

        const progress = state.progress[course.id];
        progress.courseId = course.id;
        progress.courseTitle = typeof progress.courseTitle === "string" ? progress.courseTitle : course.title;
        progress.courseCategory = typeof progress.courseCategory === "string" ? progress.courseCategory : course.category;
        progress.courseDifficulty = typeof progress.courseDifficulty === "string" ? progress.courseDifficulty : course.difficulty;
        progress.totalModules = Number.isFinite(progress.totalModules) ? progress.totalModules : course.modules.length;
        progress.currentModuleIndex = Number.isFinite(progress.currentModuleIndex) ? progress.currentModuleIndex : 0;
        progress.completedModules = Array.isArray(progress.completedModules)
            ? progress.completedModules
                .map((value) => Number(value))
                .filter((value, index, list) => Number.isInteger(value) && value >= 0 && value < course.modules.length && list.indexOf(value) === index)
                .sort((left, right) => left - right)
            : [];
        progress.notes = progress.notes && typeof progress.notes === "object" ? progress.notes : {};
        progress.videoWatched = progress.videoWatched && typeof progress.videoWatched === "object" ? progress.videoWatched : {};
        progress.quizAnswers = progress.quizAnswers && typeof progress.quizAnswers === "object" ? progress.quizAnswers : {};
        progress.quizChecked = progress.quizChecked && typeof progress.quizChecked === "object" ? progress.quizChecked : {};
        progress.quizPassed = progress.quizPassed && typeof progress.quizPassed === "object" ? progress.quizPassed : {};
        progress.quizAttempts = progress.quizAttempts && typeof progress.quizAttempts === "object" ? progress.quizAttempts : {};
        progress.quizScores = progress.quizScores && typeof progress.quizScores === "object" ? progress.quizScores : {};
        progress.studyDates = Array.isArray(progress.studyDates) ? progress.studyDates : [];
        progress.certificate = progress.certificate && typeof progress.certificate === "object" ? progress.certificate : null;
        progress.lastVisited = typeof progress.lastVisited === "string" ? progress.lastVisited : "";
        progress.totalModules = course.modules.length;
        progress.currentModuleIndex = clampModuleIndex(progress.currentModuleIndex, course.modules.length);

        return progress;
    }

    function getCourseById(courses, courseId) {
        return Array.isArray(courses) ? courses.find((course) => course.id === courseId) || null : null;
    }

    function getProgressPercent(course, state) {
        const progress = ensureCourseProgress(state, course);
        if (!progress || !course.modules.length) {
            return 0;
        }
        return Math.round((progress.completedModules.length / course.modules.length) * 100);
    }

    function clampModuleIndex(index, total) {
        if (!total) {
            return 0;
        }

        return Math.max(0, Math.min(index, total - 1));
    }

    function markStudyActivity(progress) {
        const now = new Date();
        progress.lastVisited = now.toISOString();
        const stamp = progress.lastVisited.slice(0, 10);
        if (!progress.studyDates.includes(stamp)) {
            progress.studyDates.push(stamp);
            progress.studyDates = progress.studyDates.slice(-14);
        }
    }

    function isModuleUnlocked(progress, moduleIndex) {
        if (moduleIndex <= 0) {
            return true;
        }
        return progress.completedModules.includes(moduleIndex - 1);
    }

    function getHighestUnlockedModule(progress, totalModules) {
        for (let index = totalModules - 1; index >= 0; index -= 1) {
            if (isModuleUnlocked(progress, index)) {
                return index;
            }
        }
        return 0;
    }

    function createUid(prefix = "id") {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return `${prefix}_${window.crypto.randomUUID()}`;
        }
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

    function normalizeVideoUrl(rawUrl) {
        const value = String(rawUrl || "").trim();
        if (!value) {
            return "";
        }

        try {
            const url = new URL(value, window.location.origin);

            if (url.hostname.includes("youtube.com")) {
                if (url.pathname === "/watch") {
                    const videoId = url.searchParams.get("v");
                    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
                }

                if (url.pathname.startsWith("/embed/")) {
                    return url.toString();
                }
            }

            if (url.hostname === "youtu.be") {
                const videoId = url.pathname.replace(/\//g, "");
                return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
            }

            if (url.hostname.includes("vimeo.com") && !url.hostname.includes("player.vimeo.com")) {
                const videoId = url.pathname.split("/").filter(Boolean).pop();
                return videoId ? `https://player.vimeo.com/video/${videoId}` : "";
            }

            return url.toString();
        } catch {
            return "";
        }
    }

    function buildWeakAreaRecommendations(course, progress) {
        const suggestions = [];

        course.modules.forEach((module, index) => {
            const attempts = Number(progress.quizAttempts?.[index] || 0);
            const passed = progress.quizPassed?.[index] === true;
            const completed = progress.completedModules.includes(index);

            if (attempts > 0 && !passed) {
                suggestions.push({
                    moduleTitle: module.title,
                    reason: "Recent quiz attempt did not pass.",
                    focus: module.recommendedFocus?.[0] || "Review the module summary and retry the timed quiz."
                });
            } else if (passed && !completed) {
                suggestions.push({
                    moduleTitle: module.title,
                    reason: "Quiz passed but module is not marked complete yet.",
                    focus: "Watch the lesson, save a revision note, then mark the module complete."
                });
            } else if (!progress.videoWatched?.[index] && isModuleUnlocked(progress, index)) {
                suggestions.push({
                    moduleTitle: module.title,
                    reason: "Lesson content has not been reviewed yet.",
                    focus: module.videoSummary || "Watch the lesson summary before attempting the quiz."
                });
            }
        });

        if (!suggestions.length) {
            const nextIndex = course.modules.findIndex((_, index) => isModuleUnlocked(progress, index) && !progress.completedModules.includes(index));
            if (nextIndex >= 0) {
                const nextModule = course.modules[nextIndex];
                suggestions.push({
                    moduleTitle: nextModule.title,
                    reason: "Next recommended module.",
                    focus: nextModule.recommendedFocus?.[0] || "Continue the next module to keep your momentum."
                });
            }
        }

        return suggestions.slice(0, 4);
    }

    function getGamificationSnapshot(course, progress) {
        const completedModules = progress.completedModules.length;
        const passedQuizCount = Object.values(progress.quizPassed || {}).filter(Boolean).length;
        const watchedVideos = Object.values(progress.videoWatched || {}).filter(Boolean).length;
        const streakDays = progress.studyDates.length;
        const points = (completedModules * 140) + (passedQuizCount * 40) + (watchedVideos * 20);
        const percent = course.modules.length ? Math.round((completedModules / course.modules.length) * 100) : 0;
        let badge = "Starter";

        if (percent >= 100) {
            badge = "Course Finisher";
        } else if (percent >= 66) {
            badge = "Clinical Climber";
        } else if (percent >= 33) {
            badge = "Momentum Builder";
        }

        return {
            points,
            badge,
            streakDays
        };
    }

    function createMetaPill(label, value) {
        return `<div class="meta-pill"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
    }

    window.ExamPrep = {
        clone,
        escapeHtml,
        fetchContent,
        getLearningState,
        saveLearningState,
        ensureCourseProgress,
        getCourseById,
        getProgressPercent,
        clampModuleIndex,
        markStudyActivity,
        isModuleUnlocked,
        getHighestUnlockedModule,
        createUid,
        formatDate,
        revealElements,
        normalizeVideoUrl,
        buildWeakAreaRecommendations,
        getGamificationSnapshot,
        createMetaPill
    };
})();
