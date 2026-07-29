/**
 * Progress Engine - Cisco-style Course Progression System
 * Handles module unlocking, term progression, and assessment gating
 */

class ProgressEngine {
    constructor() {
        this.storageKey = 'gnp-progress-engine-v2';
        this.state = this.loadState();
        
        // Minimum passing score for module quizzes (80%)
        this.MIN_PASSING_SCORE = 80;
        
        // Minimum passing score for term assessments (70%)
        this.MIN_TERM_PASSING_SCORE = 70;
    }
    
    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse progress state:', e);
            }
        }
        
        return {
            userProgress: {},
            courseEnrollments: [],
            completedCourses: []
        };
    }
    
    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }
    
    /**
     * Get user progress for a specific course
     */
    getCourseProgress(courseId, userId) {
        const userKey = `${userId}:${courseId}`;
        return this.state.userProgress[userKey] || null;
    }
    
    /**
     * Initialize progress tracking for a course enrollment
     */
    initializeCourseProgress(courseId, userId, courseData) {
        const userKey = `${userId}:${courseId}`;
        
        if (!this.state.userProgress[userKey]) {
            this.state.userProgress[userKey] = {
                courseId,
                enrolledAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString(),
                currentYear: courseData.yearLabel ? parseInt(courseData.yearLabel.replace(/\D/g, '')) : 1,
                currentTerm: 1,
                currentModule: 0,
                years: {},
                terms: {},
                modules: {},
                assessments: {},
                overallProgress: 0,
                isCompleted: false
            };
        }
        
        // Initialize year structure if not exists
        const progress = this.state.userProgress[userKey];
        const year = courseData.yearLabel ? parseInt(courseData.yearLabel.replace(/\D/g, '')) : 1;
        
        if (!progress.years[year]) {
            progress.years[year] = {
                unlocked: true, // First year is always unlocked
                started: false,
                completed: false,
                terms: {}
            };
        }
        
        // Initialize term structure
        if (courseData.terms && Array.isArray(courseData.terms)) {
            courseData.terms.forEach((term, index) => {
                const termNum = index + 1;
                if (!progress.terms[`${year}-${termNum}`]) {
                    progress.terms[`${year}-${termNum}`] = {
                        name: term.name,
                        unlocked: termNum === 1 ? true : false, // Only first term unlocked initially
                        started: false,
                        completed: false,
                        modules: {},
                        assessmentScore: null,
                        assessmentPassed: false
                    };
                }
                
                // Initialize modules for this term
                if (Array.isArray(term.modules)) {
                    term.modules.forEach((moduleName, modIndex) => {
                        const moduleKey = `${year}-${termNum}-${modIndex}`;
                        if (!progress.modules[moduleKey]) {
                            progress.modules[moduleKey] = {
                                name: moduleName,
                                unlocked: termNum === 1 && modIndex === 0 ? true : false,
                                started: false,
                                completed: false,
                                quizScore: null,
                                quizPassed: false,
                                quizAttempts: 0,
                                lastAccessed: null,
                                timeSpent: 0
                            };
                        }
                    });
                }
            });
        }
        
        this.saveState();
        return this.state.userProgress[userKey];
    }
    
    /**
     * Check if a module is unlocked for the user
     */
    isModuleUnlocked(courseId, userId, moduleKey) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress) return false;
        
        const module = progress.modules[moduleKey];
        if (!module) return false;
        
        return module.unlocked;
    }
    
    /**
     * Unlock the next module after current module is completed
     */
    unlockNextModule(courseId, userId, currentModuleKey) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress) return false;
        
        // Parse current module key (format: year-term-index)
        const [year, term, index] = currentModuleKey.split('-').map(Number);
        const nextIndex = index + 1;
        const nextModuleKey = `${year}-${term}-${nextIndex}`;
        
        // Check if next module exists
        if (progress.modules[nextModuleKey]) {
            progress.modules[nextModuleKey].unlocked = true;
            this.saveState();
            return true;
        }
        
        return false;
    }
    
    /**
     * Mark a module as started
     */
    startModule(courseId, userId, moduleKey) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress || !this.isModuleUnlocked(courseId, userId, moduleKey)) {
            return false;
        }
        
        const module = progress.modules[moduleKey];
        module.started = true;
        module.lastAccessed = new Date().toISOString();
        
        // Update course last accessed
        progress.lastAccessed = new Date().toISOString();
        
        // Parse year and term
        const [year, term] = moduleKey.split('-').map(Number);
        const termKey = `${year}-${term}`;
        if (progress.terms[termKey]) {
            progress.terms[termKey].started = true;
        }
        
        if (progress.years[year]) {
            progress.years[year].started = true;
        }
        
        this.saveState();
        return true;
    }
    
    /**
     * Mark a module quiz as completed with score
     */
    completeModuleQuiz(courseId, userId, moduleKey, score) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress || !this.isModuleUnlocked(courseId, userId, moduleKey)) {
            return { success: false, message: 'Module not accessible' };
        }
        
        const module = progress.modules[moduleKey];
        module.quizScore = score;
        module.quizAttempts += 1;
        module.quizPassed = score >= this.MIN_PASSING_SCORE;
        
        // If passed, mark module as completed and unlock next
        if (module.quizPassed) {
            module.completed = true;
            this.unlockNextModule(courseId, userId, moduleKey);
            
            // Check if term is complete
            this.checkTermCompletion(courseId, userId, moduleKey);
        }
        
        this.saveState();
        
        return {
            success: true,
            passed: module.quizPassed,
            score,
            minScore: this.MIN_PASSING_SCORE,
            message: module.quizPassed 
                ? 'Congratulations! Module completed.' 
                : `Score below passing threshold (${this.MIN_PASSING_SCORE}%). Please review and retry.`
        };
    }
    
    /**
     * Check if all modules in a term are completed
     */
    checkTermCompletion(courseId, userId, moduleKey) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress) return false;
        
        const [year, term] = moduleKey.split('-').map(Number);
        const termKey = `${year}-${term}`;
        
        // Get all modules for this term
        const termModules = Object.keys(progress.modules).filter(key => 
            key.startsWith(`${year}-${term}-`)
        );
        
        // Check if all are completed
        const allCompleted = termModules.every(key => 
            progress.modules[key].completed
        );
        
        if (allCompleted && progress.terms[termKey]) {
            progress.terms[termKey].completed = true;
            
            // Unlock next term if exists
            const nextTermKey = `${year}-${term + 1}`;
            if (progress.terms[nextTermKey]) {
                progress.terms[nextTermKey].unlocked = true;
            } else {
                // Check if we should unlock next year
                const nextYearKey = `${year + 1}-1`;
                if (progress.terms[nextYearKey]) {
                    progress.terms[nextYearKey].unlocked = true;
                    progress.years[year + 1].unlocked = true;
                }
            }
        }
        
        return allCompleted;
    }
    
    /**
     * Complete a term assessment
     */
    completeTermAssessment(courseId, userId, year, term, score) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress) return { success: false, message: 'No progress found' };
        
        const termKey = `${year}-${term}`;
        const termData = progress.terms[termKey];
        
        if (!termData) {
            return { success: false, message: 'Term not found' };
        }
        
        if (!termData.completed) {
            return { 
                success: false, 
                message: 'All modules must be completed before taking term assessment' 
            };
        }
        
        termData.assessmentScore = score;
        termData.assessmentPassed = score >= this.MIN_TERM_PASSING_SCORE;
        
        if (termData.assessmentPassed) {
            // Unlock next term or next year
            const nextTermKey = `${year}-${term + 1}`;
            if (progress.terms[nextTermKey]) {
                progress.terms[nextTermKey].unlocked = true;
            } else {
                const nextYearKey = `${year + 1}-1`;
                if (progress.terms[nextYearKey]) {
                    progress.terms[nextYearKey].unlocked = true;
                    progress.years[year + 1].unlocked = true;
                } else {
                    // Course completed!
                    progress.isCompleted = true;
                    progress.completedAt = new Date().toISOString();
                }
            }
        }
        
        this.saveState();
        
        return {
            success: true,
            passed: termData.assessmentPassed,
            score,
            minScore: this.MIN_TERM_PASSING_SCORE,
            message: termData.assessmentPassed 
                ? 'Term assessment passed! Next term unlocked.' 
                : `Score below passing threshold (${this.MIN_TERM_PASSING_SCORE}%). Please retry.`
        };
    }
    
    /**
     * Get detailed progress report for a course
     */
    getProgressReport(courseId, userId) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress) return null;
        
        const report = {
            courseId,
            overallProgress: this.calculateOverallProgress(progress),
            currentYear: progress.currentYear,
            currentTerm: progress.currentTerm,
            isCompleted: progress.isCompleted,
            years: {},
            strengths: [],
            weaknesses: []
        };
        
        // Build year-by-year progress
        Object.keys(progress.years).forEach(year => {
            const yearData = progress.years[year];
            report.years[year] = {
                unlocked: yearData.unlocked,
                started: yearData.started,
                completed: yearData.completed,
                terms: {}
            };
            
            // Build term progress
            Object.keys(progress.terms).forEach(termKey => {
                const [termYear, termNum] = termKey.split('-').map(Number);
                if (termYear === parseInt(year)) {
                    const termData = progress.terms[termKey];
                    const moduleKeys = Object.keys(progress.modules).filter(k => 
                        k.startsWith(`${year}-${termNum}-`)
                    );
                    
                    const moduleProgress = moduleKeys.map(key => ({
                        key,
                        name: progress.modules[key].name,
                        completed: progress.modules[key].completed,
                        score: progress.modules[key].quizScore,
                        passed: progress.modules[key].quizPassed
                    }));
                    
                    report.years[year].terms[termNum] = {
                        name: termData.name,
                        unlocked: termData.unlocked,
                        started: termData.started,
                        completed: termData.completed,
                        assessmentPassed: termData.assessmentPassed,
                        assessmentScore: termData.assessmentScore,
                        modules: moduleProgress,
                        moduleProgress: Math.round(
                            (moduleProgress.filter(m => m.completed).length / moduleProgress.length) * 100
                        )
                    };
                }
            });
        });
        
        // Calculate strengths and weaknesses
        const allScores = Object.values(progress.modules)
            .filter(m => m.quizScore !== null)
            .map(m => ({ name: m.name, score: m.quizScore }));
        
        report.strengths = allScores
            .filter(s => s.score >= 90)
            .map(s => s.name);
        
        report.weaknesses = allScores
            .filter(s => s.score < this.MIN_PASSING_SCORE)
            .map(s => s.name);
        
        return report;
    }
    
    /**
     * Calculate overall course progress percentage
     */
    calculateOverallProgress(progress) {
        const totalModules = Object.keys(progress.modules).length;
        if (totalModules === 0) return 0;
        
        const completedModules = Object.values(progress.modules)
            .filter(m => m.completed).length;
        
        return Math.round((completedModules / totalModules) * 100);
    }
    
    /**
     * Get available courses for a user based on their progress
     */
    getAvailableCourses(userId, allCourses) {
        return allCourses.map(course => {
            const progress = this.getCourseProgress(course.id, userId);
            const isEnrolled = progress !== null;
            
            return {
                ...course,
                isEnrolled,
                progress: progress ? this.calculateOverallProgress(progress) : 0,
                canContinue: progress && !progress.isCompleted
            };
        });
    }
    
    /**
     * Check if user can access a specific module
     */
    canAccessModule(courseId, userId, moduleKey) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress) return { canAccess: false, reason: 'Not enrolled in course' };
        
        const module = progress.modules[moduleKey];
        if (!module) return { canAccess: false, reason: 'Module not found' };
        
        if (!module.unlocked) {
            return { canAccess: false, reason: 'Module not yet unlocked' };
        }
        
        return { canAccess: true, reason: 'Access granted' };
    }
    
    /**
     * Reset progress for a module (for retakes)
     */
    resetModule(courseId, userId, moduleKey) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress || !progress.modules[moduleKey]) {
            return false;
        }
        
        const module = progress.modules[moduleKey];
        module.started = false;
        module.completed = false;
        module.quizScore = null;
        module.quizPassed = false;
        module.lastAccessed = null;
        
        // Lock subsequent modules in same term
        const [year, term, index] = moduleKey.split('-').map(Number);
        for (let i = index + 1; i < 20; i++) {
            const nextKey = `${year}-${term}-${i}`;
            if (progress.modules[nextKey]) {
                progress.modules[nextKey].unlocked = false;
            } else {
                break;
            }
        }
        
        this.saveState();
        return true;
    }
    
    /**
     * Track time spent on a module
     */
    trackTimeSpent(courseId, userId, moduleKey, seconds) {
        const progress = this.getCourseProgress(courseId, userId);
        if (!progress || !progress.modules[moduleKey]) return;
        
        const module = progress.modules[moduleKey];
        module.timeSpent = (module.timeSpent || 0) + seconds;
        module.lastAccessed = new Date().toISOString();
        
        this.saveState();
    }
}

// Initialize and export
const progressEngine = new ProgressEngine();

// Make available globally
window.ProgressEngine = ProgressEngine;
window.progressEngine = progressEngine;