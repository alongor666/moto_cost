import { THEME_STORAGE_KEY } from '../../config.js';

export function applyTheme(DOMElements, theme, afterApply) {
    DOMElements.html.classList.remove('theme-light', 'theme-dark');
    DOMElements.html.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (afterApply) afterApply();
}

export function toggleTheme(DOMElements, afterApply) {
    const currentTheme = DOMElements.html.classList.contains('theme-dark') ? 'dark' : 'light';
    applyTheme(DOMElements, currentTheme === 'dark' ? 'light' : 'dark', afterApply);
}

export function loadSavedTheme(DOMElements) {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    DOMElements.html.classList.remove('theme-light', 'theme-dark');
    DOMElements.html.classList.add(`theme-${savedTheme}`);
}

export function updateThemeLabel(DOMElements) {
    if (!DOMElements.activeThemeLabel) return;
    const isDark = DOMElements.html.classList.contains('theme-dark');
    DOMElements.activeThemeLabel.textContent = isDark ? '深色模式' : '浅色模式';
}
