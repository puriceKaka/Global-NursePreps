/**
 * Avatar Tutor System - 3D Avatar with Multi-language Voice Support
 * Provides guided learning experience with animated avatar and text-to-speech
 */

class AvatarTutor {
    constructor(options = {}) {
        this.container = options.container || document.getElementById('avatar-guide-card');
        this.language = options.language || 'en';
        this.voiceSpeed = options.voiceSpeed || 1.0;
        this.avatarVisible = true;
        this.speaking = false;
        this.currentUtterance = null;
        
        // Avatar states
        this.states = {
            idle: 'avatar-idle',
            speaking: 'avatar-speaking',
            thinking: 'avatar-thinking',
            happy: 'avatar-happy',
            encouraging: 'avatar-encouraging'
        };
        
        this.currentState = this.states.idle;
        
        // Supported languages
        this.languages = {
            en: { name: 'English', voiceLang: 'en-US' },
            sw: { name: 'Swahili', voiceLang: 'sw-KE' },
            es: { name: 'Spanish', voiceLang: 'es-ES' },
            fr: { name: 'French', voiceLang: 'fr-FR' },
            ar: { name: 'Arabic', voiceLang: 'ar-SA' }
        };
        
        // Avatar expressions per module type
        this.expressions = {
            introduction: {
                en: "Hello! I'm your AI nursing tutor. Let me guide you through this module.",
                sw: "Habari! Mimi ni mwalimu wako wa uuguzi wa AI. Nikuongoze kupitia moduli hii."
            },
            clinical: {
                en: "This clinical concept is crucial for your practice. Pay attention to these details.",
                sw: "Dhana hii ya kliniki ni muhimu kwa mazoezi yako. Angalia maelezo haya."
            },
            assessment: {
                en: "Let's check your understanding with some questions. You've got this!",
                sw: "Tuangalie uelewa wako kwa maswali machache. Unaweza!"
            },
            completion: {
                en: "Excellent work! You've completed this module. Ready for the next one?",
                sw: "Kazi nzuri! Umekamilisha moduli hii. Uko tayari kwa inayofuata?"
            }
        };
        
        this.init();
    }
    
    init() {
        this.injectAvatarStyles();
        this.createAvatarUI();
        this.loadVoices();
        this.bindEvents();
    }

    injectAvatarStyles() {
        if (document.getElementById('avatarTutorStyles')) return;
        const template = document.createElement('template');
        template.innerHTML = this.getAvatarStyles().trim();
        const style = template.content.firstElementChild;
        if (style) {
            style.id = 'avatarTutorStyles';
            document.head.appendChild(style);
        }
    }
    
    createAvatarUI() {
        // Create 3D avatar container
        const avatarHTML = `
            <div class="avatar-3d-container">
                <div class="avatar-3d-wrapper">
                    <div class="avatar-3d-character ${this.currentState}">
                        <div class="avatar-head">
                            <div class="avatar-face">
                                <div class="avatar-eyes">
                                    <div class="eye left"></div>
                                    <div class="eye right"></div>
                                </div>
                                <div class="avatar-mouth"></div>
                            </div>
                            <div class="avatar-hair"></div>
                        </div>
                        <div class="avatar-body">
                            <div class="avatar-torso">
                                <div class="avatar-badge">🩺</div>
                            </div>
                            <div class="avatar-arms">
                                <div class="arm left"></div>
                                <div class="arm right"></div>
                            </div>
                        </div>
                    </div>
                    <div class="avatar-glow"></div>
                </div>
                <div class="avatar-speech-bubble" id="avatarSpeechBubble">
                    <p id="avatarSpeechText"></p>
                </div>
                <div class="avatar-controls">
                    <button class="avatar-control-btn" id="avatarMuteBtn" title="Mute/Unmute">
                        <span class="icon-volume">🔊</span>
                    </button>
                    <button class="avatar-control-btn" id="avatarLangBtn" title="Change Language">
                        <span class="icon-lang">🌐</span>
                    </button>
                    <button class="avatar-control-btn" id="avatarSpeedBtn" title="Adjust Speed">
                        <span class="icon-speed">⚡</span>
                    </button>
                </div>
            </div>
        `;
        
        const cleanAvatarHTML = avatarHTML
            .replace(/<div class="avatar-badge">[\s\S]*?<\/div>/, '<div class="avatar-badge">RN</div>')
            .replace(/<span class="icon-volume">[\s\S]*?<\/span>/, '<span class="icon-volume">Voice</span>')
            .replace(/<span class="icon-lang">[\s\S]*?<\/span>/, '<span class="icon-lang">EN</span>')
            .replace(/<span class="icon-speed">[\s\S]*?<\/span>/, '<span class="icon-speed">1x</span>');

        if (this.container) {
            this.container.innerHTML = cleanAvatarHTML;
            this.container.classList.add('avatar-tutor-active');
        }
        
        // Cache DOM elements
        this.speechBubble = document.getElementById('avatarSpeechBubble');
        this.speechText = document.getElementById('avatarSpeechText');
        this.avatarCharacter = this.container?.querySelector('.avatar-3d-character');
    }
    
    loadVoices() {
        // Load available voices
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.availableVoices = window.speechSynthesis.getVoices();
                this.selectVoice();
            };
        }
    }
    
    selectVoice() {
        const langConfig = this.languages[this.language];
        if (!this.availableVoices) return;
        
        // Try to find voice for current language
        const voice = this.availableVoices.find(v => 
            v.lang.startsWith(langConfig.voiceLang.split('-')[0])
        );
        
        this.selectedVoice = voice || this.availableVoices[0];
    }
    
    bindEvents() {
        const muteBtn = document.getElementById('avatarMuteBtn');
        const langBtn = document.getElementById('avatarLangBtn');
        const speedBtn = document.getElementById('avatarSpeedBtn');
        
        muteBtn?.addEventListener('click', () => this.toggleMute());
        langBtn?.addEventListener('click', () => this.cycleLanguage());
        speedBtn?.addEventListener('click', () => this.adjustSpeed());
    }
    
    speak(text, expression = 'neutral') {
        if (this.isMuted) {
            this.showSpeechBubble(text);
            return;
        }

        if (!('speechSynthesis' in window)) {
            this.showSpeechBubble(text);
            return;
        }
        
        // Cancel any ongoing speech
        this.stopSpeaking();
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.voice = this.selectedVoice;
        this.currentUtterance.rate = this.voiceSpeed;
        this.currentUtterance.lang = this.languages[this.language].voiceLang;
        
        this.currentUtterance.onstart = () => {
            this.speaking = true;
            this.setState(this.states.speaking);
            this.showSpeechBubble(text);
        };
        
        this.currentUtterance.onend = () => {
            this.speaking = false;
            this.setState(this.states.idle);
        };
        
        this.currentUtterance.onerror = () => {
            this.speaking = false;
            this.setState(this.states.idle);
        };
        
        window.speechSynthesis.speak(this.currentUtterance);
    }
    
    stopSpeaking() {
        if (this.currentUtterance) {
            window.speechSynthesis.cancel();
            this.speaking = false;
            this.setState(this.states.idle);
        }
    }
    
    showSpeechBubble(text) {
        if (this.speechBubble && this.speechText) {
            this.speechText.textContent = text;
            this.speechBubble.classList.add('visible');
            
            // Auto-hide after text is read (estimate reading time)
            const readingTime = text.length / 15 + 2; // ~15 chars per second + buffer
            setTimeout(() => {
                this.speechBubble?.classList.remove('visible');
            }, readingTime * 1000);
        }
    }
    
    setState(state) {
        if (this.avatarCharacter && Object.values(this.states).includes(state)) {
            this.avatarCharacter.classList.remove(...Object.values(this.states));
            this.avatarCharacter.classList.add(state);
            this.currentState = state;
        }
    }
    
    introduceModule(moduleTitle, moduleType = 'general') {
        const expression = this.expressions[moduleType] || this.expressions.introduction;
        const text = `${expression[this.language] || expression.en} Today we'll explore: ${moduleTitle}.`;
        
        this.speak(text, moduleType);
    }
    
    explainConcept(conceptText) {
        this.setState(this.states.thinking);
        setTimeout(() => {
            this.speak(conceptText, 'clinical');
        }, 500);
    }
    
    encourageLearner() {
        const encouragements = {
            en: [
                "Great progress! Keep going!",
                "You're doing excellent work!",
                "Almost there, stay focused!",
                "Your clinical reasoning is improving!"
            ],
            sw: [
                "Maendeleo mazuri! Endelea!",
                "Unafanya kazi nzuri sana!",
                "Karibu kumaliza, endelea!",
                "Ufahamu wako wa kliniki unaboresha!"
            ]
        };
        
        const langEncouragements = encouragements[this.language] || encouragements.en;
        const randomEncouragement = langEncouragements[Math.floor(Math.random() * langEncouragements.length)];
        
        this.setState(this.states.encouraging);
        this.speak(randomEncouragement, 'encouraging');
    }
    
    celebrateCompletion() {
        this.setState(this.states.happy);
        const completionText = this.expressions.completion[this.language] || this.expressions.completion.en;
        this.speak(completionText, 'happy');
        
        // Add celebration animation
        this.avatarCharacter?.classList.add('avatar-celebrating');
        setTimeout(() => {
            this.avatarCharacter?.classList.remove('avatar-celebrating');
        }, 3000);
    }
    
    toggleMute() {
        if (this.speaking) {
            this.stopSpeaking();
        } else {
            this.isMuted = !this.isMuted;
            const muteBtn = document.getElementById('avatarMuteBtn');
            if (muteBtn) {
                muteBtn.querySelector('.icon-volume').textContent = this.isMuted ? '🔇' : '🔊';
            }
        }
    }
    
    cycleLanguage() {
        const langKeys = Object.keys(this.languages);
        const currentIndex = langKeys.indexOf(this.language);
        const nextIndex = (currentIndex + 1) % langKeys.length;
        this.language = langKeys[nextIndex];
        this.selectVoice();
        
        const langBtn = document.getElementById('avatarLangBtn');
        if (langBtn) {
            langBtn.querySelector('.icon-lang').textContent = 
                this.languages[this.language].name.charAt(0).toUpperCase();
        }
        
        // Announce language change
        this.speak(`Language changed to ${this.languages[this.language].name}`);
    }
    
    adjustSpeed() {
        const speeds = [0.75, 1.0, 1.25, 1.5];
        const currentIndex = speeds.indexOf(this.voiceSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        this.voiceSpeed = speeds[nextIndex];
        
        const speedBtn = document.getElementById('avatarSpeedBtn');
        if (speedBtn) {
            speedBtn.querySelector('.icon-speed').textContent = `${this.voiceSpeed}x`;
        }
        
        this.speak(`Speed set to ${this.voiceSpeed}x`);
    }
    
    getAvatarStyles() {
        return `
            <style>
            .avatar-3d-container {
                position: relative;
                width: 100%;
                max-width: 300px;
                margin: 0 auto;
                perspective: 1000px;
            }
            
            .avatar-3d-wrapper {
                position: relative;
                width: 200px;
                height: 280px;
                margin: 0 auto;
                transform-style: preserve-3d;
                animation: avatarFloat 3s ease-in-out infinite;
            }
            
            @keyframes avatarFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .avatar-3d-character {
                width: 100%;
                height: 100%;
                position: relative;
                transform-style: preserve-3d;
                transition: all 0.3s ease;
            }
            
            .avatar-head {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                height: 90px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 40px 40px 50% 50%;
                z-index: 2;
            }
            
            .avatar-face {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 60px;
                height: 50px;
                background: #fff;
                border-radius: 30px;
            }
            
            .avatar-eyes {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
            }
            
            .eye {
                width: 12px;
                height: 12px;
                background: #333;
                border-radius: 50%;
                animation: blink 4s infinite;
            }
            
            @keyframes blink {
                0%, 95%, 100% { transform: scaleY(1); }
                97% { transform: scaleY(0.1); }
            }
            
            .avatar-mouth {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                width: 20px;
                height: 6px;
                background: #333;
                border-radius: 0 0 10px 10px;
                transition: all 0.3s ease;
            }
            
            .avatar-speaking .avatar-mouth {
                height: 12px;
                animation: speak 0.3s infinite alternate;
            }
            
            @keyframes speak {
                0% { height: 8px; }
                100% { height: 14px; }
            }
            
            .avatar-thinking .avatar-eyes {
                animation: think 1s infinite;
            }
            
            @keyframes think {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(-5px); }
            }
            
            .avatar-body {
                position: absolute;
                top: 85px;
                left: 50%;
                transform: translateX(-50%);
                width: 100px;
                height: 120px;
            }
            
            .avatar-torso {
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px 20px 30px 30px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .avatar-badge {
                font-size: 32px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }
            
            .avatar-arms {
                position: absolute;
                top: 10px;
                width: 100%;
                display: flex;
                justify-content: space-between;
                padding: 0 5px;
                box-sizing: border-box;
            }
            
            .arm {
                width: 20px;
                height: 70px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                transform-origin: top center;
                transition: transform 0.3s ease;
            }
            
            .avatar-speaking .arm.left {
                transform: rotate(-20deg);
            }
            
            .avatar-speaking .arm.right {
                transform: rotate(20deg);
            }
            
            .avatar-glow {
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                width: 120px;
                height: 20px;
                background: radial-gradient(ellipse, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
                filter: blur(10px);
            }
            
            .avatar-speech-bubble {
                position: absolute;
                top: -60px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                max-width: 250px;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 10;
            }
            
            .avatar-speech-bubble.visible {
                opacity: 1;
            }
            
            .avatar-speech-bubble::after {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 8px solid white;
            }
            
            .avatar-controls {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 15px;
            }
            
            .avatar-control-btn {
                min-width: 44px;
                height: 36px;
                padding: 0 8px;
                border-radius: 999px;
                border: 2px solid #667eea;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 800;
            }
            
            .avatar-control-btn:hover {
                background: #667eea;
                color: white;
                transform: scale(1.1);
            }
            
            .avatar-happy .avatar-mouth {
                border-radius: 0 0 20px 20px;
                height: 10px;
            }
            
            .avatar-celebrating {
                animation: celebrate 0.5s infinite alternate;
            }
            
            @keyframes celebrate {
                0% { transform: rotate(-5deg) translateY(0); }
                100% { transform: rotate(5deg) translateY(-5px); }
            }
            
            .avatar-tutor-active {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
                padding: 20px;
                border-radius: 16px;
                margin: 20px 0;
            }
            </style>
        `;
    }
}

AvatarTutor.prototype.toggleMute = function toggleMute() {
    if (this.speaking) {
        this.stopSpeaking();
        return;
    }

    this.isMuted = !this.isMuted;
    const muteBtn = document.getElementById('avatarMuteBtn');
    if (muteBtn) {
        muteBtn.querySelector('.icon-volume').textContent = this.isMuted ? 'Muted' : 'Voice';
    }
};

// Initialize avatar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const avatarTutor = new AvatarTutor({
        container: document.getElementById('avatar-guide-card')
    });
    
    // Make globally accessible
    window.avatarTutor = avatarTutor;
});
