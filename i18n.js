import translations from './translations.js';

export const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'mai', name: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
    { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', flag: '🇮🇳' },
    { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
    { code: 'sd', name: 'Sindhi', native: 'سنڌي', flag: '🇮🇳' },
    { code: 'brx', name: 'Bodo', native: 'बर’', flag: '🇮🇳' },
    { code: 'doi', name: 'Dogri', native: 'डोगरी', flag: '🇮🇳' },
    { code: 'ks', name: 'Kashmiri', native: 'کأشُر', flag: '🇮🇳' },
    { code: 'kok', name: 'Konkani', native: 'कोंकणी', flag: '🇮🇳' },
    { code: 'mni', name: 'Manipuri', native: 'ꯃꯤꯇꯩꯂꯣꯟ', flag: '🇮🇳' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇮🇳' }
];

export function getCurrentLanguage() {
    return localStorage.getItem('crisisnav_lang') || 'en';
}

export function setLanguage(langCode) {
    if (!translations[langCode]) langCode = 'en'; // fallback
    localStorage.setItem('crisisnav_lang', langCode);
    document.documentElement.lang = langCode;
    applyTranslations();
}

export function getNativeLanguageName(langCode) {
    const lang = LANGUAGES.find(l => l.code === langCode);
    return lang ? lang.native : 'English';
}

export function applyTranslations() {
    const langCode = getCurrentLanguage();
    const t = translations[langCode] || translations['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            // Specific handling for inputs/placeholders
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });

    // Dispatch event so other components (like specific cards) can know it changed
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { langCode } }));
}

// Generate the modal HTML, append it, and setup events
export function initLanguagePicker() {
    // Check if modal already exists
    if (document.getElementById('language-modal')) return;

    const modalHTML = `
        <div id="language-modal" class="modal-overlay">
            <div class="modal-content glass-card" style="max-height: 80vh; display: flex; flex-direction: column;">
                <div class="modal-header">
                    <div class="ai-badge" style="background: rgba(59, 130, 246, 0.15); color: var(--primary-blue);">
                        <i class="ph-fill ph-translate"></i> Select Language
                    </div>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding-top: 10px;">
                    <div class="language-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;">
                        <!-- Buttons injected via JS -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="close-lang-btn" class="btn-primary" style="width: 100%; display: none;">Continue</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const grid = document.querySelector('#language-modal .language-grid');
    const currentLang = getCurrentLanguage();

    LANGUAGES.forEach(lang => {
        const btn = document.createElement('button');
        btn.className = `lang-grid-btn ${lang.code === currentLang ? 'active' : ''}`;
        btn.innerHTML = `
            <span style="font-size: 24px; margin-bottom: 8px;">${lang.flag}</span>
            <span style="font-weight: 700; color: var(--text-dark); margin-bottom: 2px;">${lang.native}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${lang.name}</span>
        `;

        btn.addEventListener('click', () => {
            // Remove active from all
            document.querySelectorAll('.lang-grid-btn').forEach(b => {
                b.style.borderColor = 'rgba(0,0,0,0.05)';
                b.style.background = 'var(--white)';
            });
            
            // Set active to clicked
            btn.style.borderColor = 'var(--primary-blue)';
            btn.style.background = 'rgba(59,130,246,0.05)';
            
            setLanguage(lang.code);
            closeLangModal();
        });

        grid.appendChild(btn);
    });

    document.getElementById('close-lang-btn').addEventListener('click', closeLangModal);
}

export function showLanguagePicker() {
    initLanguagePicker();
    document.getElementById('language-modal').classList.add('active');
    document.getElementById('close-lang-btn').style.display = 'block'; // Show close button when manually opened
}

function closeLangModal() {
    const modal = document.getElementById('language-modal');
    if (modal) modal.classList.remove('active');
}

// Auto-show on first load if no preference exists
export function checkFirstLoadLanguage() {
    if (!localStorage.getItem('crisisnav_lang')) {
        initLanguagePicker();
        document.getElementById('language-modal').classList.add('active');
    } else {
        applyTranslations();
    }
}

// Check on load
document.addEventListener('DOMContentLoaded', () => {
    checkFirstLoadLanguage();
});
