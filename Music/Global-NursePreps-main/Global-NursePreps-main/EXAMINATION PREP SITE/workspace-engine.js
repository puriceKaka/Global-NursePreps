/**
 * Workspace Engine - Cisco-Style Course Learning System
 * Handles lesson progression, scroll-to-complete gates, and checkpoint quizzes
 */

class WorkspaceEngine {
    constructor(options = {}) {
        this.courseId = options.courseId;
        this.userId = options.userId || 'guest';
        this.courseData = options.courseData;
        this.storageKey = `gnp-workspace-${this.courseId}-${this.userId}`;
        this.state = this.loadState();
        
        // Lesson progression
        this.currentTermIndex = 0;
        this.currentModuleIndex = 0;
        this.scrollThreshold = 85; // % of scroll needed to mark complete
        this.isScrollComplete = false;
        this.isQuizPassed = false;
        this.quizAttempts = 0;
        this.maxQuizAttempts = 3;
        
        this.init();
    }
    
    init() {
        this.bindScrollDetection();
        this.setupProgressTracking();
        this.loadModuleContent();
    }
    
    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load workspace state:', e);
            }
        }
        
        return {
            enrolledAt: new Date().toISOString(),
            currentTerm: 0,
            currentModule: 0,
            modules: {},
            progress: 0,
            isCompleted: false,
            lastAccessed: new Date().toISOString()
        };
    }
    
    saveState() {
        this.state.lastAccessed = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }
    
    /**
     * Detect when learner scrolls to 85% of lesson content
     */
    bindScrollDetection() {
        const lessonViewer = document.getElementById('lesson-viewer');
        if (!lessonViewer) return;
        
        window.addEventListener('scroll', () => {
            if (this.isScrollComplete) return;
            
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / totalHeight) * 100;
            
            // Update progress indicator
            const scrollGate = document.getElementById('lesson-completion-gate');
            if (scrollGate) {
                const hint = document.getElementById('lesson-completion-hint');
                hint.textContent = `Scroll progress: ${Math.round(scrolled)}%`;
            }
            
            // Mark as scroll-complete at threshold
            if (scrolled >= this.scrollThreshold && !this.isScrollComplete) {
                this.isScrollComplete = true;
                this.onScrollComplete();
            }
        });
    }
    
    /**
     * When scroll threshold is reached
     */
    onScrollComplete() {
        const scrollGate = document.getElementById('lesson-completion-gate');
        if (scrollGate) {
            scrollGate.innerHTML = `
                <strong>✓ Lesson scrolled!</strong>
                <span>Now answer the checkpoint question to complete this module.</span>
            `;
            scrollGate.classList.add('scroll-complete');
        }
        
        // Unlock quiz
        this.unlockQuiz();
    }
    
    /**
     * Unlock quiz panel after scroll complete
     */
    unlockQuiz() {
        const quizBtn = document.getElementById('toggle-quiz-btn');
        const quizPanel = document.getElementById('module-quiz-panel');
        
        if (quizBtn) {
            quizBtn.textContent = 'Take Checkpoint Quiz';
            quizBtn.classList.remove('is-disabled');
            quizBtn.setAttribute('aria-disabled', 'false');
            quizBtn.onclick = () => this.showQuiz();
        }
    }
    
    /**
     * Load and display current module
     */
    loadModuleContent() {
        if (!this.courseData || !this.courseData.modules) return;
        
        const module = this.courseData.modules[this.currentModuleIndex];
        if (!module) return;
        
        // Populate module content
        document.getElementById('module-position-label').textContent = 
            `Module ${this.currentModuleIndex + 1} of ${this.courseData.modules.length}`;
        document.getElementById('module-title').textContent = module.title;
        document.getElementById('module-objective').textContent = module.objective;
        document.getElementById('module-body').innerHTML = this.formatText(module.body);
        document.getElementById('module-pearl-title').textContent = module.pearlTitle || 'Clinical Pearl';
        document.getElementById('module-pearl-body').textContent = module.pearl;
        
        // Load structures
        const structuresList = document.getElementById('module-structures');
        if (structuresList) {
            structuresList.innerHTML = '';
            if (Array.isArray(module.structures)) {
                module.structures.forEach(structure => {
                    const li = document.createElement('li');
                    li.className = 'structure-item';
                    li.textContent = structure;
                    structuresList.appendChild(li);
                });
            }
        }
        
        // Setup quiz data
        this.currentQuiz = module.quiz;
        
        // Reset scroll tracking
        this.isScrollComplete = false;
        this.isQuizPassed = false;
        this.quizAttempts = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Initialize avatar tutor for this lesson
        if (window.AvatarVoiceTutor) {
            window.AvatarVoiceTutor.playLessonIntro(module.title);
        }
    }
    
    /**
     * Format text with line breaks
     */
    formatText(text) {
        return text.replace(/\n/g, '<br>');
    }
    
    /**
     * Show quiz panel
     */
    showQuiz() {
        const quizPanel = document.getElementById('module-quiz-panel');
        if (!quizPanel || !this.currentQuiz) return;
        
        quizPanel.classList.remove('hidden');
        
        // Load quiz content
        document.getElementById('quiz-prompt').textContent = this.currentQuiz.prompt;
        
        const quizOptions = document.querySelector('.quiz-options');
        quizOptions.innerHTML = '';
        
        this.currentQuiz.options.forEach((option, idx) => {
            const label = document.createElement('label');
            label.className = 'quiz-option';
            label.innerHTML = `
                <input type="radio" name="quiz-answer" value="${idx}">
                <span>${option}</span>
            `;
            quizOptions.appendChild(label);
        });
        
        // Scroll to quiz
        document.getElementById('course-final-test').scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Check quiz answer
     */
    checkQuizAnswer() {
        if (!this.currentQuiz) return;
        
        const selected = document.querySelector('input[name="quiz-answer"]:checked');
        if (!selected) {
            alert('Please select an answer');
            return;
        }
        
        const selectedIdx = parseInt(selected.value);
        const correct = selectedIdx === this.currentQuiz.correctOption;
        
        const feedback = document.querySelector('.quiz-feedback');
        const message = correct ? this.currentQuiz.success : this.currentQuiz.failure;
        
        feedback.innerHTML = `
            <div class="quiz-result ${correct ? 'correct' : 'incorrect'}">
                <strong>${correct ? '✓ Correct!' : '✗ Incorrect'}</strong>
                <p>${message}</p>
            </div>
        `;
        feedback.classList.remove('hidden');
        
        if (correct) {
            this.onQuizPassed();
        } else {
            this.quizAttempts++;
            if (this.quizAttempts < this.maxQuizAttempts) {
                setTimeout(() => {
                    feedback.innerHTML = `<p>Try again. Attempts: ${this.quizAttempts}/${this.maxQuizAttempts}</p>`;
                    document.querySelector('input[name="quiz-answer"]:checked').checked = false;
                }, 2000);
            } else {
                const feedback = document.querySelector('.quiz-feedback');
                feedback.innerHTML += `<p style="color: red; margin-top: 1rem;">Max attempts reached. Review the lesson and try again later.</p>`;
            }
        }
    }
    
    /**
     * When quiz is passed
     */
    onQuizPassed() {
        this.isQuizPassed = true;
        
        // Save module progress
        const moduleKey = `module-${this.currentModuleIndex}`;
        this.state.modules[moduleKey] = {
            completed: true,
            scrollComplete: this.isScrollComplete,
            quizPassed: true,
            completedAt: new Date().toISOString()
        };
        
        // Update progress
        this.updateProgressBar();
        this.saveState();
        
        // Show completion message
        const feedback = document.querySelector('.quiz-feedback');
        feedback.innerHTML += `
            <div style="margin-top: 1rem; padding: 1rem; background: #d4edda; border-radius: 4px;">
                <p><strong>✓ Module Complete!</strong></p>
                <p>Great work on completing this lesson. You've earned progress toward course completion.</p>
                <button class="btn-primary" onclick="workspaceEngine.nextModule()">Next Module →</button>
                <button class="btn-outline" onclick="workspaceEngine.backToDashboard()">Back to Dashboard</button>
            </div>
        `;
    }
    
    /**
     * Move to next module
     */
    nextModule() {
        if (this.currentModuleIndex < this.courseData.modules.length - 1) {
            this.currentModuleIndex++;
            this.state.currentModule = this.currentModuleIndex;
            this.saveState();
            this.loadModuleContent();
            
            // Clear quiz panel
            document.getElementById('module-quiz-panel').classList.add('hidden');
            document.querySelector('.quiz-feedback').innerHTML = '';
            
            // Reset button
            const quizBtn = document.getElementById('toggle-quiz-btn');
            if (quizBtn) {
                quizBtn.textContent = 'Complete lessons first';
                quizBtn.classList.add('is-disabled');
                quizBtn.setAttribute('aria-disabled', 'true');
            }
        } else {
            // All modules complete
            this.completeCourse();
        }
    }
    
    /**
     * Complete entire course
     */
    completeCourse() {
        this.state.isCompleted = true;
        this.state.progress = 100;
        this.saveState();
        
        // Show completion modal
        const message = `
            <div style="text-align: center; padding: 2rem;">
                <h2>🎉 Course Complete!</h2>
                <p>You have successfully completed all ${this.courseData.modules.length} modules.</p>
                <p>Certificate of completion has been generated.</p>
                <div style="margin-top: 2rem;">
                    <button class="btn-primary" onclick="window.location.href='courses.html'">View All Courses</button>
                    <button class="btn-outline" onclick="workspaceEngine.downloadCertificate()">Download Certificate</button>
                </div>
            </div>
        `;
        
        alert('Course Complete! Redirecting...');
        window.location.href = 'courses.html';
    }
    
    /**
     * Back to dashboard
     */
    backToDashboard() {
        window.location.href = '../homepage.html';
    }
    
    /**
     * Download certificate
     */
    downloadCertificate() {
        const cert = this.generateCertificate();
        const link = document.createElement('a');
        link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(cert);
        link.download = `${this.courseData.title}-Certificate.html`;
        link.click();
    }
    
    /**
     * Generate certificate HTML
     */
    generateCertificate() {
        const completionDate = new Date().toLocaleDateString();
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${this.courseData.title}</title>
                <style>
                    body { font-family: Georgia, serif; margin: 0; padding: 20px; }
                    .certificate { 
                        border: 4px solid #007bff; 
                        padding: 40px;
                        max-width: 800px;
                        margin: 40px auto;
                        text-align: center;
                        background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
                    }
                    h1 { color: #007bff; font-size: 48px; margin: 20px 0; }
                    .course-title { font-size: 24px; color: #333; margin: 20px 0; }
                    .completion-date { font-size: 14px; color: #666; margin: 20px 0; }
                    .signature { margin-top: 40px; }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <h1>Certificate of Completion</h1>
                    <p>This is to certify that</p>
                    <p><strong>${this.userId}</strong></p>
                    <p>has successfully completed the course</p>
                    <p class="course-title"><strong>${this.courseData.title}</strong></p>
                    <p>Completion Date: <strong>${completionDate}</strong></p>
                    <div class="signature">
                        <p>Global NursePrep Learning Platform</p>
                        <p style="font-size: 12px; color: #999;">This certificate represents successful completion of course requirements.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Update progress bar
     */
    updateProgressBar() {
        const completed = Object.values(this.state.modules).filter(m => m.completed).length;
        const total = this.courseData.modules.length;
        const percent = Math.round((completed / total) * 100);
        
        this.state.progress = percent;
        
        document.getElementById('workspace-progress-label').textContent = `${percent}% complete`;
        document.getElementById('workspace-progress-bar').style.width = `${percent}%`;
        document.getElementById('workspace-completed-count').textContent = `${completed} of ${total} modules`;
        
        this.saveState();
    }
    
    /**
     * Setup progress tracking on page load
     */
    setupProgressTracking() {
        this.updateProgressBar();
        
        // Hook up quiz button
        const checkAnswerBtn = document.querySelector('.check-answer-btn');
        if (checkAnswerBtn) {
            checkAnswerBtn.onclick = () => this.checkQuizAnswer();
        }
    }
}

// Global instance
let workspaceEngine;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Will be initialized by HTML with proper course data
});
