/**
 * Secure Exam System - Enhanced Proctoring and Security
 * Features: Tab switching detection, multi-monitor detection, webcam monitoring,
 * MSQ partial credit scoring, strengths/weaknesses analysis
 */

class SecureExamSystem {
    constructor(options = {}) {
        this.config = {
            maxTabSwitches: options.maxTabSwitches || 3,
            enableWebcam: options.enableWebcam !== false,
            enableMultiMonitorCheck: options.enableMultiMonitorCheck !== false,
            screenshotDetection: options.screenshotDetection !== false,
            clipboardMonitoring: options.clipboardMonitoring !== false,
            autoSubmitOnViolation: options.autoSubmitOnViolation !== false,
            warningBeforeTermination: options.warningBeforeTermination !== false,
            ...options
        };
        
        this.state = {
            isActive: false,
            tabSwitchCount: 0,
            violations: [],
            warnings: [],
            startTime: null,
            lastActivity: null,
            webcamStream: null,
            isRecording: false,
            multiMonitorDetected: false,
            submitted: false,
            terminated: false
        };
        
        this.eventListeners = [];
    }
    
    /**
     * Initialize secure exam environment
     */
    async initExam(examConfig) {
        if (this.state.isActive) {
            console.warn('Exam already in progress');
            return false;
        }
        
        this.state.isActive = true;
        this.state.startTime = new Date();
        this.state.lastActivity = new Date();
        
        // Store exam config
        this.examConfig = examConfig;
        
        // Setup security measures
        await this.setupSecurityMeasures();
        
        // Initialize proctoring
        if (this.config.enableWebcam) {
            await this.startWebcamProctoring();
        }
        
        // Check for multi-monitor setup
        if (this.config.enableMultiMonitorCheck) {
            this.checkMultiMonitor();
        }
        
        // Log exam start
        this.logEvent('exam_started', {
            examId: examConfig.id,
            examTitle: examConfig.title,
            duration: examConfig.duration,
            questionCount: examConfig.questions?.length || 0
        });
        
        return true;
    }
    
    /**
     * Setup all security measures
     */
    async setupSecurityMeasures() {
        // Tab visibility monitoring
        this.bindVisibilityChange();
        
        // Window focus monitoring
        this.bindWindowBlur();
        
        // Screenshot detection
        if (this.config.screenshotDetection) {
            this.bindScreenshotDetection();
        }
        
        // Link click prevention
        this.bindLinkPrevention();
        
        // Keyboard monitoring
        this.bindKeyboardMonitoring();
        
        // Copy/paste prevention
        if (this.config.clipboardMonitoring) {
            this.bindClipboardMonitoring();
        }
        
        // Right-click prevention
        this.bindContextMenuPrevention();
        
        // Developer tools detection (basic)
        this.detectDevTools();
    }
    
    /**
     * Bind visibility change event for tab switching detection
     */
    bindVisibilityChange() {
        const handleVisibilityChange = () => {
            if (document.hidden && this.state.isActive && !this.state.submitted) {
                this.state.tabSwitchCount++;
                
                const violation = {
                    type: 'tab_switch',
                    timestamp: new Date().toISOString(),
                    count: this.state.tabSwitchCount,
                    maxAllowed: this.config.maxTabSwitches
                };
                
                this.state.violations.push(violation);
                
                if (this.config.warningBeforeTermination && 
                    this.state.tabSwitchCount >= this.config.maxTabSwitches) {
                    this.showWarning('Multiple tab switches detected. The exam will be terminated on next violation.');
                }
                
                if (this.state.tabSwitchCount > this.config.maxTabSwitches) {
                    if (this.config.autoSubmitOnViolation) {
                        this.terminateExam('Maximum tab switches exceeded. Exam terminated automatically.');
                    } else {
                        this.showWarning('Tab switch detected. This violation has been recorded.');
                    }
                }
                
                this.logEvent('tab_switch_detected', violation);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        this.eventListeners.push({ event: 'visibilitychange', handler: handleVisibilityChange });
    }
    
    /**
     * Bind window blur event
     */
    bindWindowBlur() {
        const handleBlur = () => {
            if (this.state.isActive && !this.state.submitted) {
                // Delayed check to avoid false positives
                setTimeout(() => {
                    if (document.hidden) {
                        this.handleWindowFocusLost();
                    }
                }, 200);
            }
        };
        
        window.addEventListener('blur', handleBlur);
        this.eventListeners.push({ event: 'blur', handler: handleBlur });
    }
    
    /**
     * Handle window focus lost
     */
    handleWindowFocusLost() {
        const violation = {
            type: 'focus_lost',
            timestamp: new Date().toISOString()
        };
        
        this.state.violations.push(violation);
        this.logEvent('focus_lost', violation);
        this.showWarning('Exam window focus was lost. This has been recorded.');
    }
    
    /**
     * Bind screenshot detection
     */
    bindScreenshotDetection() {
        const handleScreenshot = (event) => {
            // Detect PrintScreen key
            if (event.key === 'PrintScreen' || event.keyCode === 44) {
                event.preventDefault();
                
                const violation = {
                    type: 'screenshot_attempt',
                    timestamp: new Date().toISOString(),
                    method: 'keyboard'
                };
                
                this.state.violations.push(violation);
                this.logEvent('screenshot_attempt', violation);
                this.showWarning('Screenshot attempts are not allowed during the exam.');
                
                // Clear clipboard if possible
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('').catch(() => {});
                }
            }
        };
        
        document.addEventListener('keyup', handleScreenshot);
        this.eventListeners.push({ event: 'keyup', handler: handleScreenshot });
    }
    
    /**
     * Bind link click prevention
     */
    bindLinkPrevention() {
        const handleClick = (event) => {
            if (!this.state.isActive || this.state.submitted) return;
            
            const link = event.target.closest('a[href]');
            if (link && link.href && !link.href.startsWith('#')) {
                event.preventDefault();
                
                const violation = {
                    type: 'navigation_attempt',
                    timestamp: new Date().toISOString(),
                    url: link.href
                };
                
                this.state.violations.push(violation);
                this.logEvent('navigation_attempt', violation);
                this.showWarning('Navigation away from the exam is not allowed.');
            }
        };
        
        document.addEventListener('click', handleClick);
        this.eventListeners.push({ event: 'click', handler: handleClick });
    }
    
    /**
     * Bind keyboard monitoring
     */
    bindKeyboardMonitoring() {
        const handleKeyDown = (event) => {
            if (!this.state.isActive || this.state.submitted) return;
            
            // Detect suspicious key combinations
            const suspiciousCombos = [
                { key: 'F12', ctrl: false, shift: false, alt: false },
                { key: 'F12', ctrl: true, shift: false, alt: false },
                { key: 'I', ctrl: true, shift: true, alt: false },
                { key: 'J', ctrl: true, shift: true, alt: false },
                { key: 'C', ctrl: true, shift: true, alt: false },
                { key: 'U', ctrl: true, shift: false, alt: false },
                { key: 'S', ctrl: true, shift: false, alt: false },
            ];
            
            const match = suspiciousCombos.find(combo => 
                event.key.toUpperCase() === combo.key &&
                event.ctrlKey === combo.ctrl &&
                event.shiftKey === combo.shift &&
                event.altKey === combo.alt
            );
            
            if (match) {
                event.preventDefault();
                
                const violation = {
                    type: 'suspicious_keypress',
                    timestamp: new Date().toISOString(),
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    altKey: event.altKey
                };
                
                this.state.violations.push(violation);
                this.logEvent('suspicious_keypress', violation);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        this.eventListeners.push({ event: 'keydown', handler: handleKeyDown });
    }
    
    /**
     * Bind clipboard monitoring
     */
    bindClipboardMonitoring() {
        // Prevent paste
        document.addEventListener('paste', (event) => {
            if (this.state.isActive && !this.state.submitted) {
                event.preventDefault();
                
                const violation = {
                    type: 'paste_attempt',
                    timestamp: new Date().toISOString()
                };
                
                this.state.violations.push(violation);
                this.logEvent('paste_attempt', violation);
                this.showWarning('Pasting content is not allowed during the exam.');
            }
        });
        
        // Monitor copy
        document.addEventListener('copy', (event) => {
            if (this.state.isActive && !this.state.submitted) {
                const violation = {
                    type: 'copy_attempt',
                    timestamp: new Date().toISOString()
                };
                
                this.state.violations.push(violation);
                this.logEvent('copy_attempt', violation);
            }
        });
    }
    
    /**
     * Prevent context menu (right-click)
     */
    bindContextMenuPrevention() {
        document.addEventListener('contextmenu', (event) => {
            if (this.state.isActive && !this.state.submitted) {
                event.preventDefault();
                
                const violation = {
                    type: 'context_menu_attempt',
                    timestamp: new Date().toISOString()
                };
                
                this.state.violations.push(violation);
                this.logEvent('context_menu_attempt', violation);
            }
        });
    }
    
    /**
     * Basic developer tools detection
     */
    detectDevTools() {
        const checkDevTools = () => {
            if (!this.state.isActive) return;
            
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            
            if (widthThreshold || heightThreshold) {
                const violation = {
                    type: 'devtools_detected',
                    timestamp: new Date().toISOString(),
                    method: 'dimension_check'
                };
                
                this.state.violations.push(violation);
                this.logEvent('devtools_detected', violation);
                this.showWarning('Developer tools usage is not allowed during the exam.');
            }
        };
        
        // Check periodically
        const devToolsInterval = setInterval(checkDevTools, 3000);
        this.eventListeners.push({ 
            event: 'interval', 
            handler: () => clearInterval(devToolsInterval),
            cleanup: true
        });
    }
    
    /**
     * Start webcam proctoring
     */
    async startWebcamProctoring() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.logEvent('webcam_unavailable', { reason: 'API not supported' });
                return false;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            this.state.webcamStream = stream;
            this.state.isRecording = true;
            
            // Setup periodic photo capture for proctoring
            this.startPeriodicPhotoCapture(stream);
            
            // Monitor for face detection (basic)
            this.monitorFacePresence(stream);
            
            this.logEvent('webcam_started', { resolution: '640x480' });
            return true;
            
        } catch (error) {
            this.logEvent('webcam_failed', { error: error.message });
            this.showWarning('Webcam access is required for this exam. Please enable camera permissions.');
            return false;
        }
    }
    
    /**
     * Start periodic photo capture
     */
    startPeriodicPhotoCapture(stream) {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        const captureInterval = setInterval(() => {
            if (!this.state.isActive || this.state.submitted) {
                clearInterval(captureInterval);
                return;
            }
            
            // Capture frame
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 320, 240);
            
            // Store compressed image data (for evidence)
            const imageData = canvas.toDataURL('image/jpeg', 0.5);
            
            // Store in session
            if (!this.state.proctoringPhotos) {
                this.state.proctoringPhotos = [];
            }
            this.state.proctoringPhotos.push({
                timestamp: new Date().toISOString(),
                data: imageData
            });
            
            // Keep only last 10 photos to manage memory
            if (this.state.proctoringPhotos.length > 10) {
                this.state.proctoringPhotos.shift();
            }
            
        }, 30000); // Capture every 30 seconds
        
        this.eventListeners.push({
            event: 'interval',
            handler: () => clearInterval(captureInterval),
            cleanup: true
        });
    }
    
    /**
     * Monitor face presence (basic implementation)
     */
    monitorFacePresence(stream) {
        // This would ideally use a face detection library
        // For now, we'll just monitor if video is active
        
        const checkInterval = setInterval(() => {
            if (!this.state.isActive || this.state.submitted) {
                clearInterval(checkInterval);
                return;
            }
            
            if (stream.active === false) {
                const violation = {
                    type: 'webcam_disabled',
                    timestamp: new Date().toISOString()
                };
                
                this.state.violations.push(violation);
                this.logEvent('webcam_disabled', violation);
                this.showWarning('Webcam has been disabled. This is a violation of exam rules.');
            }
            
        }, 5000);
        
        this.eventListeners.push({
            event: 'interval',
            handler: () => clearInterval(checkInterval),
            cleanup: true
        });
    }
    
    /**
     * Check for multi-monitor setup
     */
    checkMultiMonitor() {
        // Basic multi-monitor detection using screen properties
        const isMultiMonitor = window.screen.availWidth > window.screen.width || 
                              window.screen.availHeight > window.screen.height;
        
        if (isMultiMonitor) {
            this.state.multiMonitorDetected = true;
            
            const violation = {
                type: 'multi_monitor_detected',
                timestamp: new Date().toISOString(),
                screenWidth: window.screen.width,
                availWidth: window.screen.availWidth
            };
            
            this.state.violations.push(violation);
            this.logEvent('multi_monitor_detected', violation);
            this.showWarning('Multiple monitor setup detected. Please use only one monitor during the exam.');
        }
    }
    
    /**
     * Show warning message
     */
    showWarning(message) {
        this.state.warnings.push({
            message,
            timestamp: new Date().toISOString()
        });
        
        // Dispatch custom event for UI to handle
        const event = new CustomEvent('exam-warning', { 
            detail: { message, timestamp: new Date() }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Log event
     */
    logEvent(type, data = {}) {
        const logEntry = {
            type,
            timestamp: new Date().toISOString(),
            data,
            examId: this.examConfig?.id
        };
        
        if (!this.state.eventLog) {
            this.state.eventLog = [];
        }
        this.state.eventLog.push(logEntry);
        
        // Also log to console for debugging
        console.log(`[SecureExam] ${type}:`, logEntry);
    }
    
    /**
     * Submit exam
     */
    submitExam(answers, questions) {
        if (this.state.submitted) {
            return null;
        }
        
        this.state.submitted = true;
        this.state.endTime = new Date();
        
        // Stop recording
        this.stopRecording();
        
        // Calculate results with partial credit for MSQ
        const results = this.calculateResults(answers, questions);
        
        // Add security information
        results.securityReport = {
            violations: this.state.violations,
            warnings: this.state.warnings,
            tabSwitchCount: this.state.tabSwitchCount,
            multiMonitorDetected: this.state.multiMonitorDetected,
            proctoringPhotos: this.state.proctoringPhotos?.length || 0,
            eventLog: this.state.eventLog
        };
        
        // Clean up
        this.cleanup();
        
        return results;
    }
    
    /**
     * Terminate exam due to violation
     */
    terminateExam(reason) {
        if (this.state.terminated || this.state.submitted) {
            return;
        }
        
        this.state.terminated = true;
        this.state.submitted = true;
        this.state.endTime = new Date();
        
        const terminationViolation = {
            type: 'exam_terminated',
            timestamp: new Date().toISOString(),
            reason
        };
        
        this.state.violations.push(terminationViolation);
        
        // Stop recording
        this.stopRecording();
        
        // Dispatch termination event
        const event = new CustomEvent('exam-terminated', { 
            detail: { reason, timestamp: new Date() }
        });
        document.dispatchEvent(event);
        
        // Clean up
        this.cleanup();
        
        // Redirect to login or results page
        setTimeout(() => {
            window.location.href = `../../login.html?examTerminated=true&reason=${encodeURIComponent(reason)}`;
        }, 2000);
    }
    
    /**
     * Stop recording
     */
    stopRecording() {
        if (this.state.webcamStream) {
            this.state.webcamStream.getTracks().forEach(track => track.stop());
            this.state.webcamStream = null;
        }
        this.state.isRecording = false;
    }
    
    /**
     * Calculate results with partial credit for MSQ
     */
    calculateResults(answers, questions) {
        let totalPoints = 0;
        let earnedPoints = 0;
        const categoryResults = {};
        const questionResults = [];
        
        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            let pointsEarned = 0;
            let maxPoints = 1;
            
            if (question.type === 'mcq') {
                // MCQ: All or nothing
                maxPoints = 1;
                pointsEarned = userAnswer === question.correctAnswer ? 1 : 0;
            } else if (question.type === 'msq') {
                // MSQ: Partial credit scoring
                const correctAnswers = question.correctAnswers || [];
                const userSelected = Array.isArray(userAnswer) ? userAnswer : [];
                
                // Calculate partial credit
                const correctSelections = userSelected.filter(a => correctAnswers.includes(a)).length;
                const incorrectSelections = userSelected.filter(a => !correctAnswers.includes(a)).length;
                
                // Partial credit formula:
                // (correct selections / total correct) - (incorrect selections / total options) * 0.5
                // Minimum 0, Maximum 1
                const creditRatio = correctAnswers.length > 0 ? 
                    correctSelections / correctAnswers.length : 0;
                const penalty = question.options.length > 0 ? 
                    (incorrectSelections / question.options.length) * 0.5 : 0;
                
                pointsEarned = Math.max(0, Math.min(1, creditRatio - penalty));
                maxPoints = 1;
            }
            
            totalPoints += maxPoints;
            earnedPoints += pointsEarned;
            
            // Track category performance
            const category = question.category || 'General';
            if (!categoryResults[category]) {
                categoryResults[category] = {
                    total: 0,
                    earned: 0,
                    questions: 0,
                    correct: 0
                };
            }
            categoryResults[category].total += maxPoints;
            categoryResults[category].earned += pointsEarned;
            categoryResults[category].questions += 1;
            if (pointsEarned === 1) categoryResults[category].correct += 1;
            
            // Store question result
            questionResults.push({
                questionId: question.id,
                questionText: question.text || question.prompt,
                category: question.category,
                type: question.type,
                userAnswer,
                correctAnswer: question.type === 'msq' ? question.correctAnswers : question.correctAnswer,
                pointsEarned,
                maxPoints,
                isCorrect: pointsEarned === 1,
                explanation: question.explanation
            });
        });
        
        // Calculate overall percentage
        const overallPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        
        // Identify strengths and weaknesses
        const strengths = [];
        const weaknesses = [];
        
        Object.entries(categoryResults).forEach(([category, data]) => {
            const categoryPercentage = data.total > 0 ? (data.earned / data.total) * 100 : 0;
            
            if (categoryPercentage >= 80) {
                strengths.push({
                    category,
                    percentage: Math.round(categoryPercentage),
                    correct: data.correct,
                    total: data.questions
                });
            } else if (categoryPercentage < 60) {
                weaknesses.push({
                    category,
                    percentage: Math.round(categoryPercentage),
                    correct: data.correct,
                    total: data.questions
                });
            }
        });
        
        // Sort by percentage
        strengths.sort((a, b) => b.percentage - a.percentage);
        weaknesses.sort((a, b) => a.percentage - b.percentage);
        
        return {
            examId: this.examConfig?.id,
            examTitle: this.examConfig?.title,
            overallPercentage: Math.round(overallPercentage),
            totalQuestions: questions.length,
            answeredQuestions: answers.filter(a => a !== null && a !== undefined && (Array.isArray(a) ? a.length > 0 : true)).length,
            earnedPoints: Math.round(earnedPoints),
            totalPoints,
            passed: overallPercentage >= (this.examConfig?.passingScore || 60),
            passingScore: this.examConfig?.passingScore || 60,
            strengths,
            weaknesses,
            categoryResults,
            questionResults,
            submittedAt: this.state.endTime?.toISOString() || new Date().toISOString(),
            duration: this.state.startTime ? 
                Math.round((this.state.endTime - this.state.startTime) / 1000) : 0,
            terminated: this.state.terminated
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach(({ event, handler, cleanup }) => {
            if (cleanup) {
                handler();
            } else if (event === 'interval') {
                // Already handled by cleanup flag
            } else {
                document.removeEventListener(event, handler);
                window.removeEventListener(event, handler);
            }
        });
        
        this.eventListeners = [];
        this.state.isActive = false;
    }
    
    /**
     * Get current exam state
     */
    getState() {
        return {
            isActive: this.state.isActive,
            submitted: this.state.submitted,
            terminated: this.state.terminated,
            tabSwitchCount: this.state.tabSwitchCount,
            violations: this.state.violations.length,
            warnings: this.state.warnings.length,
            startTime: this.state.startTime,
            duration: this.state.startTime ? 
                Math.round((new Date() - this.state.startTime) / 1000) : 0
        };
    }
}

// Initialize and export
const secureExamSystem = new SecureExamSystem();

// Make available globally
window.SecureExamSystem = SecureExamSystem;
window.secureExamSystem = secureExamSystem;

// Auto-initialize if exam config is found
document.addEventListener('DOMContentLoaded', () => {
    const examConfig = JSON.parse(localStorage.getItem('activeExam:guest') || 'null');
    if (examConfig) {
        secureExamSystem.initExam(examConfig);
    }
});