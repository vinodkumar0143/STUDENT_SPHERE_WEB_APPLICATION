/**
 * theme.js — Global Dark Mode System
 * Works on ALL pages of Student Sphere.
 * Reads/writes theme preference to localStorage.
 */

// ─── Apply saved theme IMMEDIATELY on every page load ───────────────────────
// This runs before DOM is fully rendered to prevent "flash of wrong theme"
(function applyThemeEarly() {
    // Check if preference exists; if not, DEFAULT to 'dark'
    let saved = localStorage.getItem('theme');
    
    if (saved === null) {
        saved = 'dark';
        localStorage.setItem('theme', 'dark');
    }

    if (saved === 'dark') {
        document.documentElement.classList.add('dark-mode');
    }
})();

// ─── After DOM loads, inject toggle button & wire up logic ───────────────────
document.addEventListener('DOMContentLoaded', () => {
 
    // 1. Find the nav element to inject the button into
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return; // safety: if no nav found, bail out
 
    // 2. Create the theme toggle button
    const themeBtn = document.createElement('li');
    themeBtn.innerHTML = `
        <button id="themeToggleBtn" class="theme-toggle-btn" title="Toggle Dark/Light Mode" aria-label="Toggle theme">
            <span class="theme-icon">🌙</span>
            <span class="theme-label">Dark</span>
        </button>`;
    navLinks.appendChild(themeBtn);
 
    // 3. Set correct icon/label based on current theme
    updateToggleUI();
 
    // 4. Wire up click handler
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
});

/**
 * toggleTheme — switches between dark and light mode
 * Saves the new preference to localStorage
 */
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    // Save to localStorage so the preference persists on page refresh & navigation
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateToggleUI();
}

/**
 * updateToggleUI — syncs button icon and label to current theme
 */
function updateToggleUI() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark-mode');
    btn.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
    btn.querySelector('.theme-label').textContent = isDark ? 'Light' : 'Dark';
}
