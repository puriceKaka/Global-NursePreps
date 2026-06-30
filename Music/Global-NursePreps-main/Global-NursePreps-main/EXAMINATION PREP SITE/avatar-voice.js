/**
 * Avatar Voice Tutor System - Real nurse photo + Text-to-Speech
 * Provides professional learning experience with voice narration
 */

class AvatarVoiceTutor {
    constructor(options = {}) {
        this.container = options.container || document.getElementById('avatar-guide-card');
        this.avatarImage = options.avatarImage || 'https://images.unsplash.com/photo-1559839734335-3ec2b8521d45?auto=format&fit=crop&q=80&w=400';
        this.language = options.language || 'en';
        this.voiceSpeed = options.voiceSpeed || 1.0;
        
        // TTS State
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.synth = window.speechSynthesis;
        
        // Avatar messages
        this.messages = {
            intro: 'Hello! I\'m your nursing tutor. Let\'s explore this important clinical topic together.',
            startLesson: 'Click "Learn with Purpose" below to hear the lesson narration.',
            understanding: 'Understanding this concept is crucial for patient safety. Pay close attention to the key points.',
            checkpoint: 'Let\'s check your understanding with a quick question.',
            congratulations: 'Excellent work! You\'ve demonstrated understanding of this important concept.',
            next: 'Ready to move to the next lesson?'
        };
        
        this.init();
    }
    
    init() {
        this.setupAvatarUI();
        this.setupStartButton();
        this.loadVoices();
    }
    
    /**
     * Setup avatar display panel
     */
    setupAvatarUI() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="avatar-orb" title="Nursing tutor">
                <img src="${this.avatarImage}" alt="Nursing Tutor Avatar" class="avatar-image" loading="lazy">
                <button class="voice-control-btn" id="voice-play-btn" title="Play or pause lesson narration" aria-label="Play lesson narration">
                    <span class="play-icon">▶</span>
                </button>
            </div>
        `;
        
        this.container.classList.add('avatar-tutor-panel');
    }
    
    /**
     * Load available voices
     */
    loadVoices() {
        if (!this.synth) return;
        
        this.voices = this.synth.getVoices();
        
        // If voices aren't loaded, wait for them
        if (this.voices.length === 0) {
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth.getVoices();
            };
        }
    }
    
    /**
     * Get best voice for language
     */
    getVoice() {
        if (!this.voices || this.voices.length === 0) return null;
        
        const langMap = {
            en: 'en-US',
            sw: 'sw-KE',
            es: 'es-ES',
            fr: 'fr-FR',
            ar: 'ar-SA'
        };
        
        const targetLang = langMap[this.language] || 'en-US';
        
        // Find voice matching language, prefer female voices for nursing
        let voice = this.voices.find(v => v.lang.includes(targetLang) && v.name.includes('Female'));
        if (!voice) {
            voice = this.voices.find(v => v.lang.includes(targetLang));
        }
        if (!voice) {
            voice = this.voices[0]; // Fallback
        }
        
        return voice;
    }
    
    /**
     * Speak text with TTS
     */
    speak(text) {
        if (!this.synth) {
            console.warn('Text-to-speech not supported');
            return;
        }
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.getVoice();
        utterance.rate = this.voiceSpeed;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Set callbacks
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updatePlayButton(true);
            this.updateStatusText('Speaking...');
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.updatePlayButton(false);
            this.updateStatusText('Voice narration complete');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.updateStatusText('Voice unavailable');
        };
        
        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }
    
    /**
     * Update play button state
     */
    updatePlayButton(isPlaying) {
        const btn = document.getElementById('voice-play-btn');
        if (!btn) return;
        
        if (isPlaying) {
            btn.classList.add('playing');
            btn.innerHTML = '<span class="stop-icon">⏸</span>';
            btn.setAttribute('aria-label', 'Pause lesson narration');
        } else {
            btn.classList.remove('playing');
            btn.innerHTML = '<span class="play-icon">▶</span>';
            btn.setAttribute('aria-label', 'Play lesson narration');
        }
    }
    
    /**
     * Update status text
     */
    updateStatusText(text) {
        const status = document.getElementById('avatar-status-text');
        if (status) status.textContent = text;
    }
    
    /**
     * Start lesson narration
     */
startLessonNarration(customText = '') {
        const moduleTitle = document.getElementById('module-title')?.textContent
            || document.getElementById('lessonTitle')?.textContent
            || 'this lesson';
        const moduleObjective = document.getElementById('module-objective')?.textContent
            || document.getElementById('lessonObjective')?.textContent
            || '';

        const narration = customText.trim() ||
            `Let's dive into ${moduleTitle}. ${moduleObjective} Pay close attention to the key points as we progress through this lesson.`;
        
        this.speak(narration);
    }
    
    /**
     * Play completion message
     */
    playCompletionMessage() {
        this.speak(this.messages.congratulations);
        this.updateStatusText(this.messages.next);
    }
    
    /**
     * Stop speaking
     */
    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.isSpeaking = false;
            this.updatePlayButton(false);
        }
    }
    
    /**
     * Play intro for module
     */
    playLessonIntro(title) {
        const intro = `Starting module: ${title}. Use the play button to hear the lesson narration.`;
        this.updateStatusText(intro);
    }
    
    /**
     * Setup external play button
     */
    setupStartButton() {
        const playBtn = document.getElementById('voice-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isSpeaking) {
                    this.stop();
                    return;
                }
                this.startLessonNarration();
            });
        }
    }
}

// Global instance
AvatarVoiceTutor.instance = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    AvatarVoiceTutor.instance = new AvatarVoiceTutor({
        container: document.getElementById('avatar-guide-card'),
        avatarImage: 'https://images.unsplash.com/photo-1559839734335-3ec2b8521d45?auto=format&fit=crop&q=80&w=400'
    });
});
