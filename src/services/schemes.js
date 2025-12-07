import { DEFAULT_SCHEME_KEY, APP_CONFIG } from '../../config.js';
import { toggleParametersDrawer } from '../ui/drawerAndModal.js';

export function setActiveSchemeLabel(DOMElements, schemeKey) {
    if (!DOMElements.activeSchemeLabel) return;
    const scheme = APP_CONFIG.SCHEMES[schemeKey];
    const label = scheme?.name || '自定义方案';
    DOMElements.activeSchemeLabel.textContent = label;
}

export function setActiveSchemeButtons(DOMElements, schemeKey) {
    [DOMElements.schemeSelector, DOMElements.drawerSchemeSelector].forEach(group => {
        if (!group) return;
        group.querySelectorAll('.btn').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.scheme === schemeKey);
        });
    });
}

export function applyScheme(DOMElements, schemeKey, updateUI, previousValuesRef) {
    const scheme = APP_CONFIG.SCHEMES[schemeKey];
    if (!scheme || !scheme.params) return;
    for (const key in scheme.params) {
        if (DOMElements.inputs[key]) DOMElements.inputs[key].value = scheme.params[key];
    }
    updateUI();
    toggleParametersDrawer(DOMElements, true);
    requestAnimationFrame(() => requestAnimationFrame(() => previousValuesRef.onHighlight()));
    setActiveSchemeLabel(DOMElements, schemeKey);
    setActiveSchemeButtons(DOMElements, schemeKey);
}

export function handleSchemeChange(event, DOMElements, updateUI, previousValuesRef) {
    const targetButton = event.target.closest('.btn');
    if (!targetButton || !targetButton.dataset.scheme) return;
    const schemeKey = targetButton.dataset.scheme;
    applyScheme(DOMElements, schemeKey, updateUI, previousValuesRef);
}

export function initSchemeDefaults(DOMElements) {
    const defaultSchemeBtn = document.querySelector(`#schemeSelector .btn[data-scheme="${DEFAULT_SCHEME_KEY}"]`);
    if (defaultSchemeBtn) defaultSchemeBtn.classList.add('is-active');
    setActiveSchemeLabel(DOMElements, DEFAULT_SCHEME_KEY);
    setActiveSchemeButtons(DOMElements, DEFAULT_SCHEME_KEY);
}
