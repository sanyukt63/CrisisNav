/* ===========================================================
   Crisis Navigation System – Application Logic
   =========================================================== */
// ── Auth Guard ───────────────────────────────────────────────
(function checkAuthGuard() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.includes('signin.html') || path.includes('signup.html');

    if (!isLoggedIn && !isAuthPage) {
        window.location.href = 'signin.html';
    }
})();

// -- GLOBAL TOUR TRIGGER --
function startTour() {
    let filename = location.pathname.split('/').pop() || 'index.html';
    if (filename === '' || filename === '/') filename = 'index.html';
    
    if (typeof pageTours !== 'undefined' && pageTours[filename]) {
        // Force tour to start even if already completed
        localStorage.removeItem('tour_completed_ ' + filename);
        new AppTour(filename, pageTours[filename], true);
    }
}

// ── State ──────────────────────────────────────────────────
let state = {
    crises: [],
    activeCrisis: null,
    currentStep: 0,
    actionLogs: [],
    protocolCompleted: false,
    protocolStarted: false
};

// ── DOM Elements ───────────────────────────────────────────
const dom = {
    categoryGrid: document.getElementById('category-grid'),
    stepsList: document.getElementById('steps-list'),
    nextStepBtn: document.getElementById('next-step-btn'),
    currentStepMini: document.getElementById('current-step-mini'),
    activeStepsSection: document.getElementById('active-steps-section'),
    stepCountBadge: document.querySelector('.step-count-badge'),
    nextStepHint: document.getElementById('next-step-hint'),
    voiceBtn: document.getElementById('voice-btn'),
    // Modal
    recModal: document.getElementById('recommendation-modal'),
    recTitle: document.getElementById('rec-title'),
    recDesc: document.getElementById('rec-desc'),
    recSuggestion: document.getElementById('rec-suggestion'),
    btnApproveRec: document.getElementById('btn-approve-rec'),
    btnCancelRec: document.getElementById('btn-cancel-rec'),
    btnCloseRec: document.getElementById('close-recommendation'),
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    profilePic: document.querySelector('.profile-pic'),
    menuToggle: document.getElementById('menu-toggle'),
    sideMenu: document.getElementById('side-menu'),
    menuOverlay: document.getElementById('menu-overlay'),
    themeToggle: document.getElementById('theme-toggle-btn'),
    crisisSearch: document.getElementById('crisis-search')
};

// ── Initialization ─────────────────────────────────────────
async function init() {
    // Check URL for voice activation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('voice') === 'true') {
        window.voiceActivated = true;
    }
    
    let defaultCrisis = urlParams.get('crisis') || 'fire';

    try {
        const response = await fetch('/api/crises');
        state.crises = await response.json();
        if (dom.categoryGrid) {
            renderCategories();
            startCrisis(defaultCrisis);
        }
    } catch (error) {
        console.error('Failed to fetch crisis data:', error);
        // Fallback for direct file opening
        state.crises = mockData;
        if (dom.categoryGrid) {
            renderCategories();
            startCrisis(defaultCrisis);
        }
    }
    
    // Clean up URL if we handled voice
    if (window.voiceActivated) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    initEvents();
    initNavigation();
    initMenu();
    initTheme();
    loadGlobalProfile();
    checkOnboardingGuide();
    initOfflineStatus();
}

// ── Menu Management ────────────────────────────────────────
function initMenu() {
    if (dom.menuToggle) {
        dom.menuToggle.addEventListener('click', toggleMenu);
    }
    if (dom.menuOverlay) {
        dom.menuOverlay.addEventListener('click', toggleMenu);
    }

    // Auto-close menu when clicking links on mobile
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', () => {
            if (document.body.classList.contains('menu-open')) {
                toggleMenu();
            }
        });
    });
}

function toggleMenu() {
    document.body.classList.toggle('menu-open');
}

// ── Theme Management ──────────────────────────────────────
function initTheme() {
    const savedTheme = localStorage.getItem('crisisnav_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (dom.themeToggle) {
        if (savedTheme === 'dark') dom.themeToggle.classList.add('on');
        dom.themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('crisisnav_theme', newTheme);
    
    if (dom.themeToggle) {
        dom.themeToggle.classList.toggle('on');
    }
}

// ── Offline Status Management ──────────────────────────────
function initOfflineStatus() {
    // Create the offline badge if it doesn't exist
    let offlineBadge = document.getElementById('offline-status-badge');
    if (!offlineBadge) {
        offlineBadge = document.createElement('div');
        offlineBadge.id = 'offline-status-badge';
        offlineBadge.className = 'offline-badge';
        offlineBadge.innerHTML = '<i class="ph-bold ph-wifi-slash"></i> <span data-i18n="offline_mode">Offline - Cached Mode</span>';
        document.body.appendChild(offlineBadge);
    }

    const updateStatus = () => {
        if (navigator.onLine) {
            if (offlineBadge.classList.contains('visible')) {
                offlineBadge.innerHTML = '<i class="ph-bold ph-wifi-high"></i> <span data-i18n="online_back">Back Online</span>';
                offlineBadge.classList.add('online-back');
                setTimeout(() => {
                    offlineBadge.classList.remove('visible');
                    setTimeout(() => {
                        offlineBadge.classList.remove('online-back');
                        offlineBadge.innerHTML = '<i class="ph-bold ph-wifi-slash"></i> <span data-i18n="offline_mode">Offline - Cached Mode</span>';
                    }, 500);
                }, 2000);
            }
        } else {
            offlineBadge.classList.add('visible');
        }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Initial check
    if (!navigator.onLine) {
        updateStatus();
    }
}

// ── Render Categories ──────────────────────────────────────
const MAIN_CATEGORY_IDS = ['fire', 'accident', 'chemical', 'medical'];

function renderCategories(showAll = false) {
    if (!dom.categoryGrid) return;
    
    // Determine which crises to show
    let toRender = state.crises;
    if (!showAll) {
        toRender = state.crises.filter(c => MAIN_CATEGORY_IDS.includes(c.id));
    }

    // Render the crisis buttons
    dom.categoryGrid.innerHTML = toRender.map(c => `
        <button class="category-btn ${c.id}" data-crisis="${c.id}">
            <div class="category-icon" style="background: ${c.accentColor || ''}"><i class="${c.icon}"></i></div>
            <span>${c.title.split(' ')[0]}</span>
        </button>
    `).join('');
    
    // Append the toggle button
    if (!showAll) {
        dom.categoryGrid.innerHTML += `
            <button class="category-btn toggle-btn" id="btn-show-more">
                <div class="category-icon" style="background: var(--text-muted); opacity: 0.6;"><i class="ph-bold ph-plus"></i></div>
                <span>More</span>
            </button>
        `;
    } else {
        dom.categoryGrid.innerHTML += `
            <button class="category-btn toggle-btn" id="btn-show-less">
                <div class="category-icon" style="background: var(--text-muted); opacity: 0.6;"><i class="ph-bold ph-minus"></i></div>
                <span>Less</span>
            </button>
        `;
    }
    
    attachCategoryEvents();
    
    // Toggle Event Listeners
    const btnMore = document.getElementById('btn-show-more');
    if (btnMore) btnMore.addEventListener('click', () => renderCategories(true));
    
    const btnLess = document.getElementById('btn-show-less');
    if (btnLess) btnLess.addEventListener('click', () => renderCategories(false));
}

function attachCategoryEvents() {
    document.querySelectorAll('.category-btn:not(.toggle-btn)').forEach(btn => {
        btn.onclick = () => startCrisis(btn.dataset.crisis);
    });
}

// ── Start Crisis Protocol ──────────────────────────────────
function startCrisis(id) {
    const crisis = state.crises.find(c => c.id === id);
    if (!crisis) return;

    // Check if the previous crisis was completed
    if (state.activeCrisis && !state.protocolCompleted) {
        logActivity(`${state.activeCrisis.title}: steps not completed`, 'ph-fill ph-warning-octagon', 'warning');
    }

    state.activeCrisis = crisis;
    state.currentStep = 0;
    state.actionLogs = [];
    state.protocolCompleted = false;
    state.protocolStarted = false;
    
    logActivity(`${crisis.title} started`, crisis.icon, crisis.id);
    
    // Add staggered class for automated entrance
    if (dom.stepsList) {
        dom.stepsList.classList.add('staggered');
        // Remove after animation completes to avoid re-triggering on every step update
        setTimeout(() => {
            dom.stepsList.classList.remove('staggered');
        }, crisis.steps.length * 150 + 500);
    }

    updateUI();
    // No automatic TTS on startup unless it's already a voice-triggered flow
    if (window.voiceActivated) {
        // Only auto-speak if it's a cross-page voice trigger
        // Otherwise wait for the 'Start' button
    }
}

// ── Update UI ──────────────────────────────────────────────
function updateUI() {
    if (!dom.stepCountBadge || !state.activeCrisis) return;
    const crisis = state.activeCrisis;
    const step = crisis.steps[state.currentStep];
    
    // Update labels
    if (dom.stepCountBadge) dom.stepCountBadge.textContent = crisis.steps.length;
    if (dom.currentStepMini) dom.currentStepMini.textContent = `Step ${state.currentStep + 1}: ${step.title}`;
    
    // Update Next Step Button
    if (dom.nextStepBtn) {
        if (!state.protocolStarted) {
            dom.nextStepBtn.innerHTML = '<span data-i18n="start_protocol">Start Protocol 1</span> <i class="ph-bold ph-play"></i>';
            dom.nextStepBtn.style.display = 'flex';
            if (dom.nextStepHint) dom.nextStepHint.textContent = ""; 
        } else if (state.currentStep < crisis.steps.length - 1) {
            dom.nextStepBtn.innerHTML = '<span data-i18n="next_step">Next Step</span> <i class="ph-bold ph-caret-right"></i>';
            dom.nextStepBtn.style.display = 'flex';
            if (dom.nextStepHint) dom.nextStepHint.textContent = crisis.steps[state.currentStep + 1].title;
        } else {
            dom.nextStepBtn.innerHTML = '<span data-i18n="complete_protocol">Protocol Complete</span> <i class="ph-bold ph-check"></i>';
        }
    }
    
    renderSteps();
}

// ── Render Steps (Single Card Display) ──────────────────────
function renderSteps() {
    if (!dom.stepsList || !state.activeCrisis) return;
    const crisis = state.activeCrisis;
    const currentStepIndex = state.currentStep;
    const step = crisis.steps[currentStepIndex];
    
    // Create progress dots
    const dotsHtml = crisis.steps.map((_, i) => `
        <div class="progress-dot ${i === currentStepIndex ? 'active' : ''}"></div>
    `).join('');

    let typeClass = '';
    let iconClass = crisis.icon;
    
    // Pattern match icons for variety like original version
    if (currentStepIndex === 1) { 
        iconClass = 'ph-fill ph-warning-octagon';
        typeClass = 'warning';
    } else if (currentStepIndex === 2) {
        iconClass = 'ph-fill ph-drop';
        typeClass = 'info';
    } else if (crisis.id === 'fire') {
        typeClass = 'fire';
    }

    if (!state.protocolStarted) {
        dom.stepsList.innerHTML = `
            <div class="step-card active intro-card" style="border-left: 4px solid ${crisis.accentColor || '#ef4444'}">
                <div class="step-card-icon" style="background: ${crisis.accentColor || '#ef4444'}20; color: ${crisis.accentColor || '#ef4444'}">
                    <i class="${crisis.icon}"></i>
                </div>
                <div class="step-card-body">
                    <h3 data-i18n="emergency_prep">Prepare to Execute</h3>
                    <p>${crisis.problem || "Procedures are ready for this scenario."}</p>
                    <div class="protocol-ready-badge">
                        <i class="ph-bold ph-check-circle"></i> <span data-i18n="protocol_ready">Protocol is ready for deployment.</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        dom.stepsList.innerHTML = `
            <div class="step-progress-dots">
                ${dotsHtml}
            </div>
            <div class="step-card active" style="border-left: 4px solid ${typeClass === 'fire' ? '#ef4444' : typeClass === 'warning' ? '#f59e0b' : '#3b81f6'}">
                <div class="step-card-icon ${typeClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="step-card-body">
                    <h3>${currentStepIndex + 1}. ${step.title}</h3>
                    <p>${step.desc}</p>
                </div>
            </div>
        `;
    }
}

// ── Text To Speech ──────────────────────────────────────
window.speakCurrentStep = function() {
    if (!state.activeCrisis || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const step = state.activeCrisis.steps[state.currentStep];
    const currentLang = localStorage.getItem('crisisnav_lang') || 'en';
    const localeMap = {
        en: 'en-US', hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', mr: 'mr-IN',
        ta: 'ta-IN', ur: 'ur-PK', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
        or: 'or-IN', pa: 'pa-IN'
    };
    const lang = localeMap[currentLang] || 'en-US';
    
    const msgTitle = new SpeechSynthesisUtterance("Step " + (state.currentStep + 1) + ". " + step.title);
    const msgDesc = new SpeechSynthesisUtterance(step.desc);
    msgTitle.lang = lang;
    msgDesc.lang = lang;
    
    window.speechSynthesis.speak(msgTitle);
    window.speechSynthesis.speak(msgDesc);
};

// ── Smart Recommendations ──────────────────────────────────
function showSmartRecommendation(crisisId) {
    const crisis = state.crises.find(c => c.id === crisisId);
    if (!crisis) return;

    dom.recTitle.textContent = `${crisis.title} Detected`;
    dom.recDesc.textContent = `Based on your voice input, I recommend starting the ${crisis.title} protocol immediately.`;
    dom.recSuggestion.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: center;">
            <div class="category-icon" style="background: ${crisis.accentColor || 'var(--primary-blue)'}; width: 32px; height: 32px; font-size: 14px;">
                <i class="${crisis.icon}"></i>
            </div>
            <div>
                <strong style="display: block; font-size: 0.9rem;">Suggested Flow: ${crisis.title}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted)">Priority: High</span>
            </div>
        </div>
    `;

    dom.recModal.classList.add('active');

    // Approve
    dom.btnApproveRec.onclick = () => {
        startCrisis(crisisId);
        dom.recModal.classList.remove('active');
    };
}

// ── Search Logic ───────────────────────────────────────────
function handleSearch() {
    if (!dom.crisisSearch) return;
    const query = dom.crisisSearch.value.toLowerCase().trim();
    
    if (query === "") {
        renderCategories(); // Reset to main 4
        return;
    }

    // Search across ALL crises
    const matches = state.crises.filter(c => 
        c.title.toLowerCase().includes(query) || 
        (c.subbranch && c.subbranch.toLowerCase().includes(query)) ||
        (c.category && c.category.toLowerCase().includes(query))
    );

    // Render matches (including hidden ones)
    dom.categoryGrid.innerHTML = matches.map(c => `
        <button class="category-btn ${c.id}" data-crisis="${c.id}" style="animation: fadeIn 0.3s ease;">
            <div class="category-icon" style="background: ${c.accentColor || 'var(--primary-blue)'}">
                <i class="${c.icon || 'ph-fill ph-shield-warning'}"></i>
            </div>
            <span>${c.title.split(' ')[0]}</span>
        </button>
    `).join('');

    if (matches.length === 0) {
        dom.categoryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No protocols found matching your search.</div>';
    }

    attachCategoryEvents();
}

// ── Event Handlers ─────────────────────────────────────────
function initEvents() {
    // Search functionality
    if (dom.crisisSearch) {
        dom.crisisSearch.addEventListener('input', handleSearch);
    }
    
    if (dom.nextStepBtn) {
        dom.nextStepBtn.addEventListener('click', () => {
            if (!state.protocolStarted) {
                // START PROTOCOL
                state.protocolStarted = true;
                state.currentStep = 0;
                logActivity(`Protocol confirmed: ${state.activeCrisis.title}`, 'ph-bold ph-lightning', 'info');
                
                updateUI();
                // Always speak the first step when the protocol officially begins
                if (window.voiceActivated) window.speakCurrentStep();
            } else if (state.currentStep < state.activeCrisis.steps.length - 1) {
                // NEXT STEP
                state.currentStep++;
                logActivity(`Step ${state.currentStep} completed`, 'ph-bold ph-check-circle', 'info');
                updateUI();
                // Speak subsequent steps on advancement
                if (window.voiceActivated) window.speakCurrentStep();
            } else {
                // COMPLETE
                state.protocolCompleted = true;
                logActivity('Emergency protocol completed', 'ph-bold ph-crown', 'info');
                logHistory(`${state.activeCrisis.title} completed`, 'ph-bold ph-check-circle', 'success');
                alert('Emergency Protocol Successfully Completed!');
            }
        });
    }

    // Removed duplicate Voice Button (handled below)

    // Report Other Crisis
    const reportOtherBtn = document.querySelector('.report-other-btn');
    if (reportOtherBtn) {
        reportOtherBtn.addEventListener('click', () => {
            window.location.href = 'other-crises.html';
        });
    }

    // AI Search Assistant (in reports.html)
    const aiSearchInput = document.getElementById('ai-crisis-search');
    const aiResponseArea = document.getElementById('ai-response-area');
    if (aiSearchInput && aiResponseArea) {
        aiSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length < 3) {
                aiResponseArea.style.display = 'none';
                return;
            }

            const result = handleAISearch(query);
            if (result && result.confidence > 0.5) {
                aiResponseArea.style.display = 'block';
                aiResponseArea.innerHTML = `
                    <div class="ai-result-card glass-card animate-fade-in" style="padding: 16px; border-left: 4px solid var(--primary-blue); margin-top: 12px; background: white;">
                        <p style="font-size: 0.9rem; margin-bottom: 8px; color: var(--text-main); font-weight: 500;">${result.answer}</p>
                        <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 8px 0;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${result.crisis.steps.slice(0, 3).map((s, i) => `
                                <div style="display: flex; gap: 8px; align-items: flex-start;">
                                    <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary-blue); min-width: 14px;">${i+1}</span>
                                    <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.2;">${s.title}</p>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-primary" style="margin-top: 12px; font-size: 0.75rem; padding: 6px 12px; width: auto;" onclick="window.location.href='other-crises.html'">View Full Protocol</button>
                    </div>
                `;
            }
        });
    }

    // Modal close
    [dom.btnApproveRec, dom.btnCancelRec, dom.btnCloseRec].forEach(btn => {
        if (btn && dom.recModal) {
            btn.addEventListener('click', () => dom.recModal.classList.remove('active'));
        }
    });

    // Voice Assistant Logic
    if (dom.voiceBtn) {
        dom.voiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Create/Get Voice Modal
            let voiceModal = document.getElementById('voice-listening-modal');
            if (!voiceModal) {
                const modalHTML = `
                    <div id="voice-listening-modal" class="modal-overlay" style="z-index: 10000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);">
                        <div style="text-align: center; color: white; width: 90%; max-width: 400px;">
                            <div class="voice-visualizer" id="voice-visualizer" style="display: flex; align-items: center; justify-content: center; gap: 4px; height: 60px; margin-bottom: 24px;">
                                <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
                            </div>
                            <div class="mic-icon-circle" style="width: 80px; height: 80px; background: var(--primary-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 24px; box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);">
                                <i class="ph-fill ph-microphone"></i>
                            </div>
                            <h2 id="voice-status" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; font-family: var(--font-heading);">Listening...</h2>
                            <p id="voice-transcript" style="font-size: 1rem; color: rgba(255,255,255,0.7); min-height: 1.5em; font-style: italic;"></p>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                voiceModal = document.getElementById('voice-listening-modal');
            }

            const status = voiceModal.querySelector('#voice-status');
            const transcriptDisplay = voiceModal.querySelector('#voice-transcript');
            const visualizer = voiceModal.querySelector('#voice-visualizer');
            
            // 2. Initialize Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Speech recognition not supported in this browser.");
                return;
            }

            const recognition = new SpeechRecognition();
            const currentLang = localStorage.getItem('crisisnav_lang') || 'en';
            const localeMap = { en: 'en-US', hi: 'hi-IN', bn: 'bn-IN', ml: 'ml-IN', ta: 'ta-IN' };
            
            recognition.lang = localeMap[currentLang] || 'en-US';
            recognition.interimResults = true;
            recognition.continuous = false;

            // Verbal Feedback Helper
            const speak = (text) => {
                const msg = new SpeechSynthesisUtterance(text);
                msg.lang = recognition.lang;
                window.speechSynthesis.speak(msg);
            };

            recognition.onstart = () => {
                voiceModal.classList.add('active');
                status.textContent = "Listening...";
                visualizer.classList.add('animating');
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                    else interimTranscript += event.results[i][0].transcript;
                }
                const transcript = (finalTranscript || interimTranscript).toLowerCase().trim();
                transcriptDisplay.textContent = transcript;

                if (!finalTranscript) return;

                // 3. Command Matcher
                handleCommand(transcript);
            };

            const handleCommand = (cmd) => {
                visualizer.classList.remove('animating');
                
                // Crisis Keywords
                const crisisMap = {
                    fire: ['fire', 'smoke', 'burning', 'आग'],
                    accident: ['accident', 'crash', 'collision', 'दुर्घटना'],
                    medical: ['medical', 'hospital', 'doctor', 'patient', 'चिकित्सा'],
                    chemical: ['chemical', 'leak', 'poison', 'gas']
                };

                // Navigation Keywords
                const navMap = {
                    'index.html': ['home', 'dashboard', 'मुख्य'],
                    'my-crises.html': ['my crisis', 'incidents', 'मेरी रिपोर्ट'],
                    'reports.html': ['reports', 'analytics', 'रिपोर्ट্স'],
                    'settings.html': ['settings', 'options', 'सेटिंग्स'],
                    'profile.html': ['profile', 'user', 'account', 'प्रोफ़ाइल']
                };

                // Protocol Control
                const controlKeywords = {
                    next: ['next', 'continue', 'forward', 'अगला'],
                    start: ['start', 'begin', 'deploy', 'शुरू'],
                    complete: ['complete', 'finish', 'done', 'पूर्ण']
                };

                // MATCHING LOGIC
                
                // A. Check Crisis
                for (const [id, keywords] of Object.entries(crisisMap)) {
                    if (keywords.some(k => cmd.includes(k))) {
                        status.textContent = `Starting ${id} protocol...`;
                        speak(`Starting ${id} protocol.`);
                        setTimeout(() => {
                            voiceModal.classList.remove('active');
                            if (window.location.pathname.includes('index.html')) startCrisis(id);
                            else window.location.href = `index.html?crisis=${id}&voice=true`;
                        }, 1000);
                        return;
                    }
                }

                // B. Check Navigation
                for (const [page, keywords] of Object.entries(navMap)) {
                    if (keywords.some(k => cmd.includes(k))) {
                        status.textContent = `Navigating to ${page.split('.')[0]}...`;
                        speak(`Navigating to ${page.split('.')[0]}.`);
                        setTimeout(() => {
                            window.location.href = page;
                        }, 1000);
                        return;
                    }
                }

                // C. Check Protocol Control
                if (state.activeCrisis) {
                    if (controlKeywords.next.some(k => cmd.includes(k))) {
                        status.textContent = "Moving to next step...";
                        speak("Next step.");
                        setTimeout(() => {
                            voiceModal.classList.remove('active');
                            dom.nextStepBtn.click();
                        }, 800);
                        return;
                    }
                    if (controlKeywords.complete.some(k => cmd.includes(k))) {
                        status.textContent = "Completing protocol...";
                        speak("Protocol complete.");
                        setTimeout(() => {
                            voiceModal.classList.remove('active');
                            dom.nextStepBtn.click();
                        }, 800);
                        return;
                    }
                }

                // No match
                status.textContent = "Not recognized";
                speak("I didn't catch that.");
                setTimeout(() => voiceModal.classList.remove('active'), 1500);
            };

            recognition.onerror = (err) => {
                console.error("Speech Recognition Error:", err.error);
                status.textContent = "Error occurred";
                setTimeout(() => voiceModal.classList.remove('active'), 1500);
            };

            recognition.onend = () => {
                if (voiceModal.classList.contains('active') && status.textContent === "Listening...") {
                    voiceModal.classList.remove('active');
                    visualizer.classList.remove('animating');
                }
            };
            
            recognition.start();
        });
    }


    // Sidebar Tour Trigger
    const btnTutorial = document.getElementById('btn-start-tutorial');
    if (btnTutorial) btnTutorial.onclick = (e) => {
        e.preventDefault();
        document.body.classList.remove('menu-open');
        startTour();
    };

    // Header Help Trigger
    const btnHelp = document.getElementById('help-trigger');
    if (btnHelp) btnHelp.onclick = (e) => {
        e.preventDefault();
        startTour();
    };

    // Global listener for side menu close button (injected via HTML later)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.close-menu-btn')) {
            document.body.classList.remove('menu-open');
        }
    });
}


// ── Navigation Logic ───────────────────────────────────────
function initNavigation() {
    dom.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('span').textContent.toLowerCase().trim();
            if (label === 'home') window.location.href = 'index.html';
            if (label === 'my crisis') window.location.href = 'my-crises.html';
            if (label === 'reports') window.location.href = 'reports.html';
            if (label === 'settings') window.location.href = 'settings.html';
        });
    });

    if (dom.profilePic) {
        dom.profilePic.style.cursor = 'pointer';
        dom.profilePic.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }
}

// ── Side Menu Logic ────────────────────────────────────────
function initMenu() {
    if (!dom.menuToggle) return;

    dom.menuToggle.addEventListener('click', () => {
        document.body.classList.toggle('menu-open');
    });

    if (dom.menuOverlay) {
        dom.menuOverlay.addEventListener('click', () => {
            document.body.classList.remove('menu-open');
        });
    }
}


// ── Mock Data Fallback ─────────────────────────────────────
const mockData = [
  {
    id: 'fire',
    title: 'Fire Incident',
    icon: 'ph-fill ph-fire',
    desc: 'If you see smoke or fire.',
    severity: 'critical',
    accentColor: '#f43f5e',
    steps: [
      { title: 'Pull the Alarm', desc: 'Find the red box on the wall and pull the handle down hard.' },
      { title: 'Call for Help', desc: 'Call 911. Tell them your name and where the fire is.' },
      { title: 'Get Out Fast', desc: 'Walk quickly to the nearest door. Don\'t stop to pick up your things.' },
      { title: 'Meet at the Tree', desc: 'Go to the safe spot outside where everyone meets and stay there.' }
    ]
  },
  {
    id: 'accident',
    title: 'Workplace Accident',
    icon: 'ph-fill ph-warning-octagon',
    desc: 'If someone gets hurt or something breaks.',
    severity: 'high',
    accentColor: '#f59e0b',
    steps: [
      { title: 'Stop Everything', desc: 'Push the big red "STOP" button on the machine right away.' },
      { title: 'Tell a Grown-up', desc: 'Run and find a teacher or boss and tell them someone is hurt.' },
      { title: 'Stay Back', desc: 'Keep away from the broken machine so you don\'t get hurt too.' },
      { title: 'Wait for the Doctor', desc: 'Stay calm and wait for the ambulance to arrive.' }
    ]
  },
  {
    id: 'chemical',
    title: 'Chemical Leak',
    icon: 'ph-fill ph-flask',
    desc: 'If something smelly or sticky spills.',
    severity: 'critical',
    accentColor: '#8b5cf6',
    steps: [
      { title: 'Don\'t Touch It', desc: 'Stay away from the spill. Don\'t smell it or touch it!' },
      { title: 'Cover Your Nose', desc: 'Use your shirt or a mask to cover your mouth and nose.' },
      { title: 'Leave the Room', desc: 'Go outside where the air is fresh. Close the door behind you.' },
      { title: 'Wash Your Hands', desc: 'If anything touched your skin, wash it with lots of water.' }
    ]
  },
  {
    id: 'medical',
    title: 'Medical Emergency',
    icon: 'ph-fill ph-heartbeat',
    desc: 'If someone falls down or feels very sick.',
    severity: 'high',
    accentColor: '#f97316',
    steps: [
      { title: 'Check if they Wake Up', desc: 'Gently shake their shoulder and ask "Are you okay?".' },
      { title: 'Call 911', desc: 'Tell the person on the phone that someone is sick and needs a doctor.' },
      { title: 'Stay with Them', desc: 'Don\'t leave the person alone. Hold their hand and talk to them.' },
      { title: 'Open the Door', desc: 'Make sure the door is unlocked so the doctors can get in easily.' }
    ]
  },
  // --- EXTENDED CRISIS DATA FROM KNOWLEDGE BASE ---
  {
    id: 'medical-physical',
    title: 'Medical & Physical Emergencies',
    category: 'Emergency',
    icon: 'ph-fill ph-first-aid',
    accentColor: '#ef4444',
    problem: 'This situation can create risk, confusion, or harm if not handled properly.',
    solution: 'Timely action, awareness, and proper response can reduce damage and ensure safety.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Take a deep breath and look around to understand what is happening.' },
      { title: 'Ensure personal safety first.', desc: 'Do not put yourself in danger while trying to help others.' },
      { title: 'Contact relevant authorities.', desc: 'Call emergency helplines immediately for professional help.' },
      { title: 'Follow basic safety procedures.', desc: 'Apply first aid or safety protocols you have learned.' },
      { title: 'Help others if possible.', desc: 'Assist those who are most vulnerable if it is safe to do so.' }
    ]
  },
  {
    id: 'accident-physical',
    title: 'Accident & Physical Incidents',
    category: 'Safety',
    icon: 'ph-fill ph-car-crash',
    accentColor: '#f97316',
    problem: 'This situation can create risk, confusion, or harm if not handled properly.',
    solution: 'Timely action, awareness, and proper response can reduce damage and ensure safety.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Evaluate the extent of the accident and identify hazards.' },
      { title: 'Ensure personal safety first.', desc: 'Move to a safe location away from traffic or debris.' },
      { title: 'Contact relevant authorities.', desc: 'Call traffic police or ambulance as required.' },
      { title: 'Follow basic safety procedures.', desc: 'Turn off engines or secure the area if possible.' },
      { title: 'Help others if possible.', desc: 'Provide comfort and basic aid to any injured parties.' }
    ]
  },
  {
    id: 'personal-safety-crime',
    title: 'Safety & Crime Situations',
    subbranch: 'Personal Safety & Crime',
    category: 'Security',
    icon: 'ph-fill ph-mask-sad',
    accentColor: '#1e293b',
    problem: 'This situation can create risk, confusion, or harm if not handled properly.',
    solution: 'Awareness and quick reporting can prevent further harm.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Avoid panic to keep your mind clear for decision making.' },
      { title: 'Ensure personal safety first.', desc: 'Find a well-lit, populated area or lock yourself in a safe room.' },
      { title: 'Contact relevant authorities.', desc: 'Call the police emergency number (112/100) immediately.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not confront the perpetrator; focus on escape.' },
      { title: 'Help others if possible.', desc: 'Alert people nearby without drawing attention to yourself.' }
    ]
  },
  {
    id: 'harassment-abuse',
    title: 'Harassment & Abuse',
    category: 'Legal/Personal',
    icon: 'ph-fill ph-warning-octagon',
    accentColor: '#be185d',
    problem: 'This situation can create risk, confusion, or harm if not handled properly.',
    solution: 'Documentation and reporting are key to legal protection.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Identify the source and nature of the harassment.' },
      { title: 'Ensure personal safety first.', desc: 'Distance yourself from the abuser immediately.' },
      { title: 'Contact relevant authorities.', desc: 'Report to HR, workplace safety, or local police.' },
      { title: 'Follow basic safety procedures.', desc: 'Document incidents with dates, times, and witnesses.' },
      { title: 'Help others if possible.', desc: 'Encourage other victims to come forward safely.' }
    ]
  },
  {
    id: 'police-rights',
    title: 'Police Interaction & Rights',
    category: 'Legal',
    icon: 'ph-fill ph-police-car',
    accentColor: '#1d4ed8',
    problem: 'Knowing your rights during police interaction is crucial for safety.',
    solution: 'Cooperation combined with knowledge of rights ensures a fair process.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Be polite and avoid any sudden movements.' },
      { title: 'Ensure personal safety first.', desc: 'Keep your hands visible at all times.' },
      { title: 'Contact relevant authorities.', desc: 'Request to speak to a lawyer or inform a family member.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not resist arrest physically; state your rights clearly.' },
      { title: 'Help others if possible.', desc: 'If witnessing an interaction, record from a safe distance.' }
    ]
  },
  {
    id: 'arrest-detention',
    title: 'Arrest / Detention Situations',
    category: 'Legal',
    icon: 'ph-fill ph-handcuffs',
    accentColor: '#334155',
    problem: 'Arrest can be a high-stress and confusing crisis.',
    solution: 'Legal aid and following protocol can reduce the duration of detention.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Understand the reason for the arrest if stated.' },
      { title: 'Ensure personal safety first.', desc: 'Do not argue or escalate the tension.' },
      { title: 'Contact relevant authorities.', desc: 'Use your right to one phone call for legal representation.' },
      { title: 'Follow basic safety procedures.', desc: 'Provide only necessary ID information; remain silent otherwise.' },
      { title: 'Help others if possible.', desc: 'Share contact info for legal aid with others in detention.' }
    ]
  },
  {
    id: 'cyber-crime-fraud',
    title: 'Digital & Cyber Emergencies',
    subbranch: 'Cyber Crime & Online Fraud',
    category: 'Cyber',
    icon: 'ph-fill ph-shield-check',
    accentColor: '#7c3aed',
    problem: 'Online fraud can lead to financial and identity loss.',
    solution: 'Immediate reporting and freezing accounts can mitigate losses.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Identify which accounts or data have been compromised.' },
      { title: 'Ensure personal safety first.', desc: 'Change passwords and enable 2FA on all other accounts.' },
      { title: 'Contact relevant authorities.', desc: 'Report to the National Cyber Crime Portal or your bank.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not click on further suspicious links.' },
      { title: 'Help others if possible.', desc: 'Warn your contacts if your account is sending spam.' }
    ]
  },
  {
    id: 'identity-document-issues',
    title: 'Identity & Document Issues',
    category: 'Administrative',
    icon: 'ph-fill ph-identification-card',
    accentColor: '#059669',
    problem: 'Loss of Aadhaar, PAN, or Passport can halt essential services.',
    solution: 'Filing an FIR and applying for duplicates is the standard procedure.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'List all documents that are missing or compromised.' },
      { title: 'Ensure personal safety first.', desc: 'Watch for unauthorized transactions in your name.' },
      { title: 'Contact relevant authorities.', desc: 'File a police complain (FIR/NCR) for the lost documents.' },
      { title: 'Follow basic safety procedures.', desc: 'Block the cards if they are linked to the documents.' },
      { title: 'Help others if possible.', desc: 'Help others file reports if they were lost during a disaster.' }
    ]
  },
  {
    id: 'legal-fir-complaint',
    title: 'Legal Crisis: Filing FIR',
    category: 'Legal',
    icon: 'ph-fill ph-gavel',
    accentColor: '#b45309',
    problem: 'Difficulty in filing FIRs can delay justice.',
    solution: 'Knowing the ' + 'Zero FIR' + ' rule helps in immediate registration.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Clearly state the facts of the incident to the officer.' },
      { title: 'Ensure personal safety first.', desc: 'Wait in a public area of the police station.' },
      { title: 'Contact relevant authorities.', desc: 'If refused, contact the SP or use online FIR portals.' },
      { title: 'Follow basic safety procedures.', desc: 'Read the FIR carefully before signing; get a free copy.' },
      { title: 'Help others if possible.', desc: 'Assist illiterate or elderly persons in drafting complaints.' }
    ]
  },
  {
    id: 'property-rental-dispute',
    title: 'Property & Rental Disputes',
    category: 'Civil',
    icon: 'ph-fill ph-house-line',
    accentColor: '#10b981',
    problem: 'Illegal eviction or deposit withholding.',
    solution: 'Mediation or legal notice is often the first step.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Review your rental agreement for relevant clauses.' },
      { title: 'Ensure personal safety first.', desc: 'Do not engage in physical altercations over property.' },
      { title: 'Contact relevant authorities.', desc: 'Consult a lawyer or a rental housing board.' },
      { title: 'Follow basic safety procedures.', desc: 'Keep all communication in writing (email/letter).' },
      { title: 'Help others if possible.', desc: 'Form a tenants association to prevent group harassment.' }
    ]
  },
  {
    id: 'consumer-rights-issue',
    title: 'Consumer Rights Issues',
    category: 'Commerce',
    icon: 'ph-fill ph-shopping-bag',
    accentColor: '#facc15',
    problem: 'Defective products or service deficiency.',
    solution: 'Filing a complaint via Jago Grahak Jago or Consumer Court.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Gather all receipts and warranty documents.' },
      { title: 'Ensure personal safety first.', desc: 'If a product is dangerous, stop using it immediately.' },
      { title: 'Contact relevant authorities.', desc: 'Call the National Consumer Helpline (1915).' },
      { title: 'Follow basic safety procedures.', desc: 'Send a formal notice to the company before court.' },
      { title: 'Help others if possible.', desc: 'Post a public review to warn other consumers.' }
    ]
  },
  {
    id: 'traffic-violations',
    title: 'Traffic Violations & Legal Issues',
    category: 'Legal/Road',
    icon: 'ph-fill ph-traffic-signal',
    accentColor: '#475569',
    problem: 'Wrongful fines or license issues.',
    solution: 'Paying online or contesting in court if necessary.',
    steps: [
      { title: 'Stay calm and assess the situation.', desc: 'Record the location and officer details if stopped.' },
      { title: 'Ensure personal safety first.', desc: 'Park in a safe spot away from traffic flow.' },
      { title: 'Contact relevant authorities.', desc: 'Ask for a physical challan or check online portals.' },
      { title: 'Follow basic safety procedures.', desc: 'Do not offer bribes; ask for the violations list.' },
      { title: 'Help others if possible.', desc: 'Witness and document if you see harassment on the road.' }
    ]
  }
];

// --- AI Search Implementation ---
function handleAISearch(query) {
    if (!query) return null;
    query = query.toLowerCase();
    
    // Simple mock LLM logic: find best match in mockData
    const match = mockData.find(c => 
        c.title.toLowerCase().includes(query) || 
        (c.subbranch && c.subbranch.toLowerCase().includes(query)) ||
        (c.category && c.category.toLowerCase().includes(query)) ||
        c.steps.some(s => s.title.toLowerCase().includes(query))
    );
    
    if (match) {
        return {
            answer: `Based on your request about "${query}", here is the ${match.title} protocol.`,
            crisis: match,
            confidence: 0.95
        };
    }
    
    return {
        answer: "I couldn't find a specific protocol for that. Please try searching for keywords like 'Fire', 'Cyber', 'Medical', or 'Legal'.",
        confidence: 0.3
    };
}

// ── Global Profile ─────────────────────────────────────────
function loadGlobalProfile() {
    // Check Auth State
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authButtons = document.getElementById('auth-buttons');
    const profilePicContainer = document.getElementById('profile-pic');
    
    if (profilePicContainer) {
        if (isLoggedIn) {
            profilePicContainer.style.display = 'block';
            if (authButtons) authButtons.style.display = 'none';
        } else {
            profilePicContainer.style.display = 'none';
            if (authButtons) authButtons.style.display = 'flex';
        }
    }

    if (localStorage.getItem('showLoginToast') === 'true') {
        showToast('Access Granted', 'You have been successfully logged in.', 'success');
        localStorage.removeItem('showLoginToast');
    }
    // Load Photo
    const savedPic = localStorage.getItem('crisisnav_profile_pic');
    if (savedPic) {
        document.querySelectorAll('.profile-pic img, .menu-user-avatar img').forEach(img => {
            img.src = savedPic;
        });
    }

    // Load Name
    const savedName = localStorage.getItem('crisisnav_profile_name');
    if (savedName) {
        document.querySelectorAll('.profile-display-name').forEach(el => {
            el.textContent = savedName;
        });
    }

    // Load Role
    const savedRole = localStorage.getItem('crisisnav_profile_role') || 'Crisis Responder';
    document.querySelectorAll('.profile-display-role').forEach(el => {
        el.textContent = savedRole;
    });

    // Make profile pics navigate to profile.html
    document.querySelectorAll('.profile-pic, .menu-user-info').forEach(pic => {
        pic.style.cursor = 'pointer';
        pic.onclick = () => {
            window.location.href = 'profile.html';
        };
    });
}

// ── Toast Notification System ──────────────────────────────
function showToast(title, message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    let iconClass = 'ph-fill ph-check-circle';
    let iconColor = '#10b981';
    
    if (type === 'error') {
        iconClass = 'ph-fill ph-warning-circle';
        iconColor = '#ef4444';
    } else if (type === 'info') {
        iconClass = 'ph-fill ph-info';
        iconColor = '#3b82f6';
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon" style="color: ${iconColor}"><i class="${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// ── Activity Logging ───────────────────────────────────────
function logActivity(text, iconClass, type) {
    const activityList = document.querySelector('.activity-list');
    const sidebarList = document.getElementById('sidebar-activity-list');
    
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Ensure icon mapping is correct
    let icon = iconClass || 'ph-fill ph-info';
    if (type === 'fire' && !icon.includes('ph-')) icon = 'ph-fill ph-fire';

    const activityData = { text, icon, type, timeStr };
    
    // Persist Action Logs
    let logs = JSON.parse(localStorage.getItem('crisisnav_activity_logs') || '[]');
    logs.unshift(activityData);
    if (logs.length > 5) logs.pop();
    localStorage.setItem('crisisnav_activity_logs', JSON.stringify(logs));

    // 1. Update Main Activity List (if present)
    if (activityList) {
        renderActivityList(activityList, logs);
    }

    // 2. Update Sidebar Activity List (global)
    if (sidebarList) {
        renderSidebarActivity(sidebarList, logs);
    }
}

function renderActivityList(container, logs) {
    container.innerHTML = logs.map(log => `
        <div class="activity-item">
            <div class="activity-icon ${log.type || ''}" style="${log.type === 'info' ? 'background: var(--primary-blue)' : ''}">
                <i class="${log.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${log.text}</p>
                <span>${getCategoryLabel(log.type)}</span>
            </div>
            <span class="activity-time">${log.timeStr}</span>
        </div>
    `).join('');
}

function renderSidebarActivity(container, logs) {
    if (logs.length === 0) {
        container.innerHTML = '<div class="sidebar-activity-placeholder">No activities recorded in this session</div>';
        return;
    }
    
    container.innerHTML = logs.slice(0, 5).map(log => `
        <div class="sidebar-activity-item ${log.type || ''}">
            <div class="sidebar-activity-icon ${log.type || ''}">
                <i class="${log.icon}"></i>
            </div>
            <div class="sidebar-activity-info">
                <p>${log.text}</p>
                <span>${log.timeStr} • ${getCategoryLabel(log.type)}</span>
            </div>
        </div>
    `).join('');
}

function logHistory(text, icon, type) {
    logActivity(text, icon, type);
}

function loadSessionActivity() {
    const logs = JSON.parse(localStorage.getItem('crisisnav_activity_logs') || '[]');
    const activityList = document.querySelector('.activity-list');
    const sidebarList = document.getElementById('sidebar-activity-list');
    
    if (activityList && logs.length > 0) renderActivityList(activityList, logs);
    if (sidebarList) renderSidebarActivity(sidebarList, logs);
}

function getCategoryLabel(type) {
    if (type === 'fire') return 'Fire Safety';
    if (type === 'medical') return 'Medical Response';
    if (type === 'accident') return 'Traffic Safety';
    if (type === 'chemical') return 'Hazmat Safety';
    if (type === 'info') return 'System Alert';
    return 'General';
}

// ── Onboarding Guide ───────────────────────────────────────
function checkOnboardingGuide() {
    if (localStorage.getItem('showSignupGuide') === 'true') {
        const onboardModal = document.getElementById('onboard-modal');
        if (onboardModal) {
            onboardModal.classList.add('active');
            localStorage.removeItem('showSignupGuide');
        }
    }
}

// ── Multi-Step Page Tour Engine ──────────────────────────
class AppTour {
    constructor(pageName, steps) {
        this.pageName = pageName;
        this.steps = steps;
        this.currentStep = 0;
        
        // Run only for new users who haven't completed this page's tour
        if (localStorage.getItem('isNewUser') !== 'true') return;
        if (localStorage.getItem('tour_completed_' + pageName) === 'true') return;
        
        this.init();
    }
    
    init() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tour-tooltip';
        this.tooltip.innerHTML = `
            <div class="tour-tooltip-content">
                <div class="tour-tooltip-icon"><i class="ph-fill ph-sparkles"></i></div>
                <div class="tour-tooltip-text">
                    <h4>Feature Guide</h4>
                    <p id="tour-message"></p>
                    <div class="tour-tooltip-footer">
                        <span class="tour-steps-indicator" id="tour-indicator"></span>
                        <div class="tour-tooltip-btns">
                            <button class="tour-close-btn" id="tour-close-btn">Exit</button>
                            <button class="tour-next-btn" id="tour-next-btn">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltip);
        
        document.getElementById('tour-next-btn').addEventListener('click', () => this.nextStep());
        document.getElementById('tour-close-btn').addEventListener('click', () => this.finish());
        
        // Wait briefly for page to settle
        setTimeout(() => this.showStep(), 1200);
    }
    
    showStep() {
        if (this.currentTarget) {
            this.currentTarget.classList.remove('tour-target');
        }
        
        if (this.currentStep >= this.steps.length) {
            this.finish();
            return;
        }
        
        const step = this.steps[this.currentStep];
        const elements = document.querySelectorAll(step.selector);
        this.currentTarget = elements[step.index || 0];
        
        if (!this.currentTarget) {
            // Skip if element not found
            this.currentStep++;
            this.showStep();
            return;
        }
        
        this.overlay.classList.add('active');
        this.currentTarget.classList.add('tour-target');
        
        // Calculate offset to ensure it's comfortably in view
        const elementRect = this.currentTarget.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
        window.scrollTo({ top: middle, behavior: 'smooth' });
        
        document.getElementById('tour-message').textContent = step.message;
        document.getElementById('tour-indicator').textContent = `${this.currentStep + 1} of ${this.steps.length}`;
        document.getElementById('tour-next-btn').textContent = this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next';
        
        this.tooltip.classList.remove('visible');
        
        setTimeout(() => {
            const rect = this.currentTarget.getBoundingClientRect();
            // Default position (bottom)
            let top = rect.bottom + window.scrollY + 15;
            let left = rect.left + window.scrollX;
            
            // Boundary checks
            if (left + 280 > window.innerWidth) {
                left = window.innerWidth - 300;
            }
            if (top + 150 > window.scrollY + window.innerHeight) {
                top = rect.top + window.scrollY - 160; // place above
            }
            
            this.tooltip.style.top = top + 'px';
            this.tooltip.style.left = Math.max(10, left) + 'px';
            this.tooltip.classList.add('visible');
        }, 400);
    }
    
    nextStep() {
        this.tooltip.classList.remove('visible');
        this.currentStep++;
        setTimeout(() => this.showStep(), 300);
    }
    
    finish() {
        this.overlay.classList.remove('active');
        this.tooltip.classList.remove('visible');
        if (this.currentTarget) {
            this.currentTarget.classList.remove('tour-target');
        }
        localStorage.setItem('tour_completed_' + this.pageName, 'true');
        
        setTimeout(() => {
            if (this.overlay.parentNode) this.overlay.remove();
            if (this.tooltip.parentNode) this.tooltip.remove();
        }, 400);
    }
}

const pageTours = {
    'index.html': [
        { selector: '#crisis-search', message: 'Search for any crisis protocol quickly right here.' },
        { selector: '.category-grid', message: 'Tap a main category to instantly start an emergency workflow.' },
        { selector: '.steps-section', message: 'View your actively tracked crisis steps and progress here.' },
        { selector: '#voice-btn', message: 'Use voice commands for hands-free incident reporting.' }
    ],
    'my-crises.html': [
        { selector: '.activity-section', index: 0, message: 'Track your ongoing active emergencies here.' },
        { selector: '.activity-section', index: 1, message: 'Review your resolved past incidents.' }
    ],
    'reports.html': [
        { selector: '.next-step-btn', message: 'Generate comprehensive PDF reports of your incidents.' },
        { selector: '.activity-list', message: 'Download previously generated reports.' },
        { selector: '.steps-section', message: 'Check your year-to-date response analytics.' }
    ],
    'settings.html': [
        { selector: '.setting-group', index: 1, message: 'Configure critical push and audio notifications.' },
        { selector: '.setting-group', index: 2, message: 'Manage your trusted emergency contacts and location sharing.' }
    ],
    'profile.html': [
        { selector: '.profile-img-container', message: 'Tap here to upload a new profile picture.' },
        { selector: '#profile-form', message: 'Ensure your personal details and blood group are up to date.' },
        { selector: '.save-btn', message: 'Save your personal and medical information securely.' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    let filename = location.pathname.split('/').pop() || 'index.html';
    // Handle root path mapping 
    if (filename === '' || filename === '/') filename = 'index.html';
    
    if (pageTours[filename]) {
        // init() is async, so the modal might not have the 'active' class yet during DOMContentLoaded.
        // We check the raw localStorage key to accurately determine if the welcome modal WILL show.
        const willShowWelcomeModal = (filename === 'index.html' && localStorage.getItem('showSignupGuide') === 'true');

        if (willShowWelcomeModal) {
            // The welcome modal will be shown. Wait for the user to close it.
            const modal = document.getElementById('onboard-modal');
            if (modal) {
                const modalBtns = modal.querySelectorAll('button');
                modalBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Small delay to let modal closing animation finish
                        setTimeout(() => new AppTour(filename, pageTours[filename]), 300);
                    });
                });
            }
        } else {
            // Start normally
            new AppTour(filename, pageTours[filename]);
        }
    }
});

// Start the app
init();
loadSessionActivity();

