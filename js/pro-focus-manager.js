/**
 * 医疗病例 OCR 识别系统 Pro - 焦点管理模块
 * Medical OCR Pro - Focus Management Module
 * Handles keyboard navigation and modal focus trapping
 */

// ============================================================================
// FOCUS MANAGEMENT UTILITIES
// ============================================================================

// Store last focused element before opening modal
let lastFocusedElement = null;

// Focusable elements selector
const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Trap focus within a modal (for accessibility)
 */
function trapFocus(modalElement) {
    const focusableElements = getFocusableElements(modalElement);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    modalElement.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                // Shift+Tab: moving backwards
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: moving forwards
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

/**
 * Open modal with focus management
 */
function openModalWithFocus(modalId) {
    // Store the currently focused element
    lastFocusedElement = document.activeElement;

    // Open the modal
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('active');

    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element in the modal
    setTimeout(() => {
        const focusableElements = getFocusableElements(modal);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }, 100);

    // Set up focus trapping
    trapFocus(modal);
}

/**
 * Close modal and restore focus
 */
function closeModalWithFocus(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus to the element that opened the modal
    if (lastFocusedElement) {
        setTimeout(() => {
            lastFocusedElement.focus();
        }, 100);
    }
}

// ============================================================================
// ESC KEY HANDLER FOR MODALS
// ============================================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Find all active modals
        const activeModals = document.querySelectorAll('.modal-overlay.active');

        // Close the most recently opened modal
        for (let i = activeModals.length - 1; i >= 0; i--) {
            const modal = activeModals[i];
            const modalId = modal.id;

            // Check if this modal has a close handler
            const closeBtn = modal.querySelector('[id*="close"], [id*="cancel"]');
            if (closeBtn && closeBtn.onclick) {
                closeBtn.click();
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
    }
});

// ============================================================================
// GLOBAL FOCUS VISIBLE ENHANCEMENT
// ============================================================================
// Add focus-visible polyfill behavior
document.addEventListener('DOMContentLoaded', () => {
    let usingMouse = false;

    // Detect mouse usage
    document.addEventListener('mousedown', () => {
        usingMouse = true;
        document.body.classList.add('using-mouse');
    });

    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Shift' || (e.altKey && (e.key === 'F' || e.key === 'F4'))) {
            usingMouse = false;
            document.body.classList.remove('using-mouse');
        }
    });

    // Add CSS class for keyboard navigation focus
    const style = document.createElement('style');
    style.textContent = `
        /* Only show focus ring when using keyboard */
        body.using-mouse *:focus {
            outline: none !important;
        }
        body:not(.using-mouse) *:focus-visible {
            outline: 2px solid #0891B2 !important;
            outline-offset: 2px !important;
        }
    `;
    document.head.appendChild(style);
});

// ============================================================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ============================================================================
window.openModalWithFocus = openModalWithFocus;
window.closeModalWithFocus = closeModalWithFocus;
window.getFocusableElements = getFocusableElements;
