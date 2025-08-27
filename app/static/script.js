/**
 * AI Notes Generator - Enhanced JavaScript Application
 * Modern, accessible, and performant implementation with automatic theme detection
 */

const TIMEOUT_MS = 60000 * 10;

// Utility functions
const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    isValidYouTubeUrl(url) {
        if (!url || typeof url !== 'string') return false;

        const patterns = [
            /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\//,
            /^https?:\/\/(www\.)?youtube\.com\/v\//
        ];

        return patterns.some(pattern => pattern.test(url.trim()));
    },

    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    getTimestamp() {
        return new Date().toISOString().split('T')[0];
    },

    generateId() {
        return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};

// Enhanced State Management
class AppState {
    constructor() {
        this.state = {
            current: 'initial',
            content: '',
            isLoading: false,
            error: null,
            lastGeneratedUrl: null
        };
        this.subscribers = new Set();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };

        this.subscribers.forEach(callback => {
            try {
                callback(this.state, prevState);
            } catch (error) {
                console.error('State subscriber error:', error);
            }
        });
    }

    getState() {
        return { ...this.state };
    }

    reset() {
        this.setState({
            current: 'initial',
            content: '',
            isLoading: false,
            error: null,
            lastGeneratedUrl: null
        });
    }
}

// UI Management
class UIManager {
    constructor(appState) {
        this.appState = appState;
        this.elements = this.cacheElements();
        this.setupStateSubscription();
        this.setupEventDelegation();
    }

    cacheElements() {
        const elements = {
            initialState: document.getElementById('initialState'),
            loadingState: document.getElementById('loadingState'),
            contentState: document.getElementById('contentState'),
            form: document.getElementById('notesForm'),
            urlInput: document.getElementById('youtubeUrl'),
            generateBtn: document.getElementById('generateBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            copyBtn: document.getElementById('copyBtn'),
            resetBtn: document.getElementById('resetBtn'),
            errorMessage: document.getElementById('errorMessage'),
            statusMessage: document.getElementById('statusMessage'),
            markdownContent: document.getElementById('markdownContent')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`Element not found: ${key}`);
            }
        });

        return elements;
    }

    setupStateSubscription() {
        this.appState.subscribe((state, prevState) => {
            if (state.current !== prevState.current) {
                this.showState(state.current);
            }

            if (state.error !== prevState.error) {
                if (state.error) {
                    this.showError(state.error);
                } else {
                    this.hideError();
                }
            }

            if (state.isLoading !== prevState.isLoading) {
                this.updateLoadingState(state.isLoading);
            }

            if (state.content !== prevState.content && state.content) {
                this.renderContent(state.content);
            }
        });
    }

    setupEventDelegation() {
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('submit', this.handleSubmit.bind(this));
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        this.setupButtonEnhancements();
    }

    handleClick(event) {
        const { target } = event;

        const actionBtn = target.closest('.action-btn');
        if (actionBtn) {
            event.preventDefault();
            const action = actionBtn.id?.replace('Btn', '');

            switch (action) {
                case 'download':
                    this.downloadMarkdown();
                    break;
                case 'copy':
                    this.copyToClipboard();
                    break;
                case 'reset':
                    this.resetApp();
                    break;
            }

            this.createRippleEffect(event, actionBtn);
            return;
        }

        if (target.closest('.primary-btn')) {
            this.createRippleEffect(event, target.closest('.primary-btn'));
        }
    }

    handleSubmit(event) {
        if (event.target.id === 'notesForm') {
            event.preventDefault();
            this.generateNotes();
        }
    }

    handleInput = Utils.debounce((event) => {
        if (event.target.id === 'youtubeUrl') {
            this.validateUrl(event.target.value);
        }
    }, 300);

    handleKeydown(event) {
        const { key, ctrlKey, metaKey } = event;
        const state = this.appState.getState();

        if ((ctrlKey || metaKey) && key === 'g' && state.current === 'initial') {
            event.preventDefault();
            this.generateNotes();
        } else if (key === 'Escape' && state.current !== 'initial') {
            event.preventDefault();
            this.resetApp();
        }
    }

    validateUrl(url) {
        const isValid = Utils.isValidYouTubeUrl(url);
        const input = this.elements.urlInput;

        if (!input) return;

        input.classList.remove('valid', 'invalid');

        if (url.trim()) {
            input.classList.add(isValid ? 'valid' : 'invalid');

            if (this.elements.generateBtn) {
                this.elements.generateBtn.disabled = !isValid;
            }

            if (!isValid && url.length > 10) {
                this.showError('Please enter a valid YouTube URL');
            } else {
                this.hideError();
            }
        }

        return isValid;
    }

    async generateNotes() {
        const state = this.appState.getState();
        if (state.isLoading) return;

        const url = this.elements.urlInput?.value?.trim();
        if (!url) {
            this.showError('Please enter a YouTube URL');
            this.elements.urlInput?.focus();
            return;
        }

        if (!this.validateUrl(url)) {
            this.showError('Please enter a valid YouTube URL');
            this.elements.urlInput?.focus();
            return;
        }

        this.appState.setState({
            isLoading: true,
            error: null,
            current: 'loading',
            lastGeneratedUrl: url
        });

        try {
            const response = await this.fetchWithTimeout('/generate-notes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            }, TIMEOUT_MS);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            this.appState.setState({
                content: data.md_notes || '',
                current: 'content',
                isLoading: false
            });

            this.announceToScreenReader('Notes generated successfully');

        } catch (error) {
            console.error('Generation error:', error);

            let errorMessage = 'Failed to generate notes. ';

            if (error.name === 'TimeoutError') {
                errorMessage += 'The request timed out. Please try again.';
            } else if (error.message.includes('fetch')) {
                errorMessage += 'Network error. Please check your connection.';
            } else {
                errorMessage += error.message || 'Please try again.';
            }

            this.appState.setState({
                error: errorMessage,
                current: 'initial',
                isLoading: false
            });
        }
    }

    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timeout');
                timeoutError.name = 'TimeoutError';
                throw timeoutError;
            }
            throw error;
        }
    }

    showState(stateName) {
        const states = {
            initial: this.elements.initialState,
            loading: this.elements.loadingState,
            content: this.elements.contentState
        };

        Object.values(states).forEach(el => {
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('fade-in');
                el.setAttribute('aria-hidden', 'true');
            }
        });

        const targetState = states[stateName];
        if (targetState) {
            targetState.classList.remove('hidden');
            targetState.setAttribute('aria-hidden', 'false');

            requestAnimationFrame(() => {
                targetState.classList.add('fade-in');
            });

            this.manageFocus(stateName);
        }
    }

    manageFocus(stateName) {
        switch (stateName) {
            case 'initial':
                this.elements.urlInput?.focus();
                break;
            case 'content':
                const firstButton = this.elements.contentState?.querySelector('.action-btn');
                firstButton?.focus();
                break;
        }
    }

    showError(message) {
        this.appState.setState({ error: message });

        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.classList.add('show');
            this.elements.errorMessage.setAttribute('aria-live', 'assertive');
        }
    }

    hideError() {
        this.appState.setState({ error: null });

        if (this.elements.errorMessage) {
            this.elements.errorMessage.classList.remove('show');
            this.elements.errorMessage.removeAttribute('aria-live');
        }
    }

    showStatusMessage(message, type = 'success') {
        if (this.elements.statusMessage) {
            this.elements.statusMessage.textContent = message;
            this.elements.statusMessage.className = `status-message ${type} show`;
            this.elements.statusMessage.setAttribute('aria-live', 'polite');

            setTimeout(() => {
                this.elements.statusMessage.classList.remove('show');
                this.elements.statusMessage.removeAttribute('aria-live');
            }, 3000);
        }

        this.announceToScreenReader(message);
    }

    updateLoadingState(isLoading) {
        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = isLoading;
            this.elements.generateBtn.setAttribute('aria-busy', isLoading);
        }

        if (this.elements.urlInput) {
            this.elements.urlInput.disabled = isLoading;
        }
    }

    renderContent(content) {
        if (!this.elements.markdownContent || !content) return;

        try {
            let html;

            if (typeof marked !== 'undefined') {
                html = marked.parse(content);
            } else {
                html = this.fallbackMarkdownParser(content);
            }

            this.elements.markdownContent.innerHTML = this.sanitizeAndHighlight(html);

        } catch (error) {
            console.error('Render error:', error);
            this.elements.markdownContent.innerHTML = `<pre>${Utils.sanitizeHtml(content)}</pre>`;
        }
    }

    fallbackMarkdownParser(content) {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^# (.*)$/gm, '<h1>$1</h1>')
            .replace(/^## (.*)$/gm, '<h2>$1</h2>')
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    sanitizeAndHighlight(html) {
        const div = document.createElement('div');
        div.innerHTML = html;

        if (typeof hljs !== 'undefined') {
            div.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }

        return div.innerHTML;
    }

    async downloadMarkdown() {
        try {
            const state = this.appState.getState();
            if (!state.content) {
                this.showStatusMessage('❌ No content to download', 'error');
                return;
            }

            const timestamp = Utils.getTimestamp();
            const filename = `ai-notes-${timestamp}.md`;

            const blob = new Blob([state.content], {
                type: 'text/markdown;charset=utf-8'
            });

            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Markdown files',
                        accept: { 'text/markdown': ['.md'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            this.showStatusMessage('✅ Markdown file downloaded successfully!', 'success');

        } catch (error) {
            console.error('Download failed:', error);
            this.showStatusMessage('❌ Failed to download file', 'error');
        }
    }

    async copyToClipboard() {
        try {
            const state = this.appState.getState();
            if (!state.content) {
                this.showStatusMessage('❌ No content to copy', 'error');
                return;
            }

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(state.content);
                this.showStatusMessage('✅ Content copied to clipboard!', 'success');
            } else {
                this.fallbackCopy(state.content);
            }

        } catch (error) {
            console.error('Copy failed:', error);
            this.fallbackCopy(this.appState.getState().content);
        }
    }

    fallbackCopy(content) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = content;
            textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;opacity:0;';
            textArea.setAttribute('readonly', '');

            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999);

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                this.showStatusMessage('✅ Content copied to clipboard!', 'success');
            } else {
                throw new Error('Copy command failed');
            }

        } catch (error) {
            console.error('Fallback copy failed:', error);
            this.showStatusMessage('❌ Failed to copy to clipboard', 'error');
        }
    }

    resetApp() {
        this.appState.reset();

        if (this.elements.urlInput) {
            this.elements.urlInput.value = '';
            this.elements.urlInput.classList.remove('valid', 'invalid');
        }

        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = false;
        }

        this.announceToScreenReader('Application reset');
    }

    setupButtonEnhancements() {
        document.addEventListener('mouseenter', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn && !actionBtn.disabled) {
                actionBtn.style.transform = 'translateY(-1px)';
                actionBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                actionBtn.style.transform = '';
                actionBtn.style.boxShadow = '';
            }
        }, true);
    }

    createRippleEffect(event, button) {
        if (!button || button.disabled) return;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      transform: scale(0);
      animation: ripple-grow 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;

        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        button.style.overflow = 'hidden';

        const existing = button.querySelector('.ripple-effect');
        existing?.remove();

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }
}

// Main Application Class
class AINotesApp {
    constructor() {
        this.appState = new AppState();
        this.uiManager = new UIManager(this.appState);
        this.init();
    }

    init() {
        try {
            this.addRequiredCSS();
            this.configureMarked();
            this.appState.setState({ current: 'initial' });

            console.log('AI Notes App initialized successfully');
            console.log('Theme will automatically follow system preference');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.uiManager.showError('Application failed to initialize properly. Some features may not work.');
        }
    }

    addRequiredCSS() {
        if (!document.getElementById('app-animations')) {
            const style = document.createElement('style');
            style.id = 'app-animations';
            style.textContent = `
        @keyframes ripple-grow {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        .ripple-effect {
          animation: ripple-grow 0.6s ease-out;
        }
        
        .action-btn:focus-visible,
        .primary-btn:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        
        [aria-busy="true"] {
          cursor: wait;
          opacity: 0.7;
        }
      `;
            document.head.appendChild(style);
        }
    }

    configureMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                sanitize: false,
                highlight: (code, lang) => {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.warn('Highlight error:', err);
                            return code;
                        }
                    }
                    return code;
                }
            });
        }
    }

    getState() {
        return this.appState.getState();
    }

    generateNotes() {
        return this.uiManager.generateNotes();
    }

    resetApp() {
        this.uiManager.resetApp();
    }
}

// Initialize the application
let appInstance = null;

function initializeApp() {
    try {
        appInstance = new AINotesApp();

        if (typeof window !== 'undefined') {
            window.aiNotesApp = appInstance;
        }

    } catch (error) {
        console.error('Critical initialization error:', error);

        document.addEventListener('DOMContentLoaded', () => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message show';
            errorDiv.textContent = 'Application failed to load. Please refresh the page.';
            document.body.insertBefore(errorDiv, document.body.firstChild);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AINotesApp, Utils };
}
