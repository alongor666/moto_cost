import { PARAMETER_SCHEMA, PARAMETER_MAP, VALIDATION_RULES, CONVERSION_LABELS } from '../config/parameters.js';
import { $$, $ } from './domCache.js';

export const getInputValue = (DOMElements, id) => parseFloat(DOMElements.inputs[id].value) || 0;
export const getInputValueAsRate = (DOMElements, id) => (parseFloat(DOMElements.inputs[id].value) / 100) || 0;

export const clampValue = (value, min, max) => {
    let result = value;
    if (!isNaN(min)) result = Math.max(min, result);
    if (!isNaN(max)) result = Math.min(max, result);
    return result;
};

export const evaluateValidation = (fieldId, value) => {
    const rule = VALIDATION_RULES[fieldId];
    if (!rule) return { status: 'neutral', message: '' };
    if (isNaN(value)) return { status: 'error', message: '请输入数值' };

    if (!isNaN(rule.min) && value < rule.min) return { status: 'error', message: `低于下限 ${rule.min}` };
    if (!isNaN(rule.max) && value > rule.max) return { status: 'error', message: `高于上限 ${rule.max}` };

    if (!isNaN(rule.warningLow) && value < rule.warningLow) return { status: 'warning', message: `低于建议值 ${rule.warningLow}` };
    if (!isNaN(rule.warningHigh) && value > rule.warningHigh) return { status: 'warning', message: `高于建议值 ${rule.warningHigh}` };
    if (!isNaN(rule.dangerHigh) && value > rule.dangerHigh) return { status: 'error', message: `超出阈值 ${rule.dangerHigh}` };

    return { status: 'success', message: '在合理区间' };
};

export function updateStatus(DOMElements, fieldId, result) {
    const input = DOMElements.inputs[fieldId];
    if (!input) return;
    input.classList.remove('is-valid', 'is-warning', 'is-error');
    if (result.status === 'success') input.classList.add('is-valid');
    if (result.status === 'warning') input.classList.add('is-warning');
    if (result.status === 'error') input.classList.add('is-error');
    input.title = result.message || '';

    const chip = DOMElements.statusChips ? DOMElements.statusChips[fieldId] : null;
    if (chip) {
        chip.className = 'status-chip';
        chip.textContent = result.message;
        if (result.status === 'success') chip.classList.add('status-chip--success');
        if (result.status === 'warning') chip.classList.add('status-chip--warning');
        if (result.status === 'error') chip.classList.add('status-chip--error');
        chip.title = `${VALIDATION_RULES[fieldId]?.label || '参数'}：${result.message}`;
    }
}

export const validateField = (DOMElements, fieldId) => {
    const input = DOMElements.inputs[fieldId];
    if (!input) return;
    const value = parseFloat(input.value);
    const result = evaluateValidation(fieldId, value);
    updateStatus(DOMElements, fieldId, result);
};

export const validateAllInputs = (DOMElements) => {
    Object.keys(DOMElements.inputs).forEach(key => validateField(DOMElements, key));
};

export function applySchemaDefaults(DOMElements) {
    PARAMETER_SCHEMA.forEach(param => {
        const input = DOMElements.inputs[param.id];
        if (input) {
            if (!isNaN(param.min)) input.setAttribute('min', param.min);
            if (!isNaN(param.max)) input.setAttribute('max', param.max);
            input.dataset.default = param.defaultValue;
            if (!input.value) input.value = param.defaultValue;
            if (!input.placeholder) {
                const hasRange = !isNaN(param.min) && !isNaN(param.max);
                const rangeText = hasRange ? `${param.min}-${param.max}${param.unit || ''}` : `${param.unit || ''}`;
                input.placeholder = rangeText ? `输入 ${rangeText}` : input.placeholder;
            }
        }

        const defaultValueEl = input?.closest('.param-row')?.querySelector('.default-value');
        if (defaultValueEl) {
            defaultValueEl.dataset.default = param.defaultValue;
            defaultValueEl.textContent = param.defaultValue;
        }
    });
}

export function setupDefaultFillers(DOMElements) {
    $$('.fill-default-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const input = DOMElements.inputs[target];
            const defaultValue = PARAMETER_MAP[target]?.defaultValue
                ?? btn.closest('.default-cell')?.querySelector('.default-value')?.dataset.default;
            if (input && defaultValue !== undefined) {
                input.value = defaultValue;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });
}

export function setupSteppers(DOMElements) {
    $$('.stepper').forEach(stepper => {
        const targetId = stepper.dataset.target;
        const setActiveStep = (step) => { stepper.dataset.step = step; };
        const stepButtons = stepper.querySelectorAll('.stepper__step');
        stepButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                stepButtons.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                setActiveStep(btn.dataset.step);
            });
        });
        if (!stepper.dataset.step && stepButtons[0]) setActiveStep(stepButtons[0].dataset.step);

        stepper.querySelectorAll('.stepper__btn').forEach(actionBtn => {
            actionBtn.addEventListener('click', () => {
                const input = DOMElements.inputs[targetId];
                if (!input) return;
                const step = parseFloat(stepper.dataset.step) || 1;
                const direction = parseInt(actionBtn.dataset.direction, 10) || 0;
                const next = (parseFloat(input.value) || 0) + step * direction;
                const min = parseFloat(input.dataset.min);
                const max = parseFloat(input.dataset.max);
                input.value = clampValue(next, min, max);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    });
}

export function initParameterCardsCollapse(DOMElements) {
    const cards = $$('.param-card');
    const toggleAllBtn = DOMElements.toggleAllCardsBtn;

    const setCardState = (card, collapsed) => {
        const body = card.querySelector('.param-card__body');
        const toggle = card.querySelector('.param-card__toggle');
        card.classList.toggle('is-collapsed', collapsed);
        if (body) body.hidden = collapsed;
        if (toggle) toggle.setAttribute('aria-expanded', (!collapsed).toString());
    };

    const updateToggleAllLabel = () => {
        if (!toggleAllBtn) return;
        const hasCollapsed = Array.from(cards).some(card => card.classList.contains('is-collapsed'));
        toggleAllBtn.textContent = hasCollapsed ? '全部展开' : '全部收起';
        toggleAllBtn.setAttribute('aria-pressed', (!hasCollapsed).toString());
    };

    cards.forEach(card => {
        const toggle = card.querySelector('.param-card__toggle');
        const handleToggle = (event) => {
            if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
            if (event.type === 'keydown') event.preventDefault();
            const isCollapsed = card.classList.contains('is-collapsed');
            setCardState(card, !isCollapsed);
            updateToggleAllLabel();
        };

        setCardState(card, card.classList.contains('is-collapsed'));
        if (toggle) {
            toggle.addEventListener('click', handleToggle);
            toggle.addEventListener('keydown', handleToggle);
        }
    });

    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', () => {
            const shouldExpand = Array.from(cards).some(card => card.classList.contains('is-collapsed'));
            cards.forEach(card => setCardState(card, !shouldExpand));
            updateToggleAllLabel();
        });
        updateToggleAllLabel();
    }
}

export function setupInputAutoFocus() {
    const paramInputs = $$('.param-input');
    paramInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInputId = input.dataset.next;
                if (nextInputId) {
                    const nextInput = $(`#${nextInputId}`);
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.select();
                    }
                }
            }
        });
    });
}

export function updateMotoPremiumRatioDisplay(DOMElements) {
    if (!DOMElements.motoPremiumRatioDisplay) return;

    const carAveragePremium = getInputValue(DOMElements, 'carAveragePremium');
    const motoAveragePremium = getInputValue(DOMElements, 'motoAveragePremium');
    const motoQuantity = getInputValue(DOMElements, 'motoQuantity');

    if (carAveragePremium > 0) {
        const motoPremiumRatio = (motoAveragePremium * motoQuantity) / carAveragePremium;
        DOMElements.motoPremiumRatioDisplay.textContent = `${(motoPremiumRatio * 100).toFixed(2)}%`;
    } else {
        DOMElements.motoPremiumRatioDisplay.textContent = '--';
    }
}

export function updateConversionHints(DOMElements) {
    Object.keys(DOMElements.inputs).forEach(key => {
        const value = parseFloat(DOMElements.inputs[key].value);
        const hintEl = document.querySelector(`#${key}Conversion`);
        if (!hintEl) return;
        if (isNaN(value)) { hintEl.textContent = ''; return; }

        if (CONVERSION_LABELS[key]) {
            const param = PARAMETER_MAP[key];
            const factor = param?.type === 'percent' ? value / 100 : value;
            hintEl.textContent = `= ${factor.toFixed(2)}x ${CONVERSION_LABELS[key]}`;
        }
    });

    const carAvg = getInputValue(DOMElements, 'carAveragePremium');
    const motoAvg = getInputValue(DOMElements, 'motoAveragePremium');
    const qty = getInputValue(DOMElements, 'motoQuantity');
    const ratio = carAvg > 0 ? (motoAvg * qty) / carAvg : 0;
    const ratioText = carAvg > 0 ? `= ${ratio.toFixed(2)}x 保费配比` : '';
    ['carAveragePremiumConversion', 'motoAveragePremiumConversion', 'motoQuantityConversion'].forEach(id => {
        const el = document.querySelector(`#${id}`);
        if (el) el.textContent = ratioText;
    });
    const motoPremiumRatioEl = document.querySelector('#motoPremiumRatioConversion');
    if (motoPremiumRatioEl) motoPremiumRatioEl.textContent = ratioText;
}

export function storeCurrentInputValues(DOMElements) {
    const snapshot = {};
    for (const key in DOMElements.inputs) snapshot[key] = DOMElements.inputs[key].value;
    return snapshot;
}

export function highlightChangedParameters(DOMElements, previousValues) {
    for (const key in DOMElements.inputs) {
        const inputElement = DOMElements.inputs[key];
        inputElement.classList.remove('form-field__input--highlight');
        if (inputElement.value !== previousValues[key]) {
            inputElement.classList.add('form-field__input--highlight');
            inputElement.addEventListener('animationend', () => inputElement.classList.remove('form-field__input--highlight'), { once: true });
        }
    }
}

export function setupInputBehaviors(DOMElements) {
    initParameterCardsCollapse(DOMElements);
    setupInputAutoFocus();
    setupDefaultFillers(DOMElements);
    setupSteppers(DOMElements);
}
