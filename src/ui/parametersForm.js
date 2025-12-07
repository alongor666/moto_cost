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
            // Only set value if empty, otherwise keep current (though usually this is called on init)
            if (!input.value) input.value = param.defaultValue;
        }
    });
}

// Minimalist feature: Double click to reset to default
export function setupDoubleTapReset(DOMElements) {
    Object.values(DOMElements.inputs).forEach(input => {
        input.addEventListener('dblclick', () => {
            const defaultValue = input.dataset.default;
            if (defaultValue !== undefined) {
                input.value = defaultValue;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Visual feedback for reset - flash valid style
                input.classList.add('is-valid');
                setTimeout(() => input.classList.remove('is-valid'), 500);
            }
        });
    });
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

/**
 * 更新摩意险保费配比显示
 * 计算公式：(摩意险件均保费 × 摩意险份数) ÷ 摩托车单均保费
 */
export function updateMotoPremiumRatioDisplay(DOMElements) {
    if (!DOMElements.motoPremiumRatioDisplay) return;

    const carAveragePremium = getInputValue(DOMElements, 'carAveragePremium');
    const motoAveragePremium = getInputValue(DOMElements, 'motoAveragePremium');
    const motoQuantity = getInputValue(DOMElements, 'motoQuantity');

    if (carAveragePremium > 0) {
        const motoPremiumRatio = (motoAveragePremium * motoQuantity) / carAveragePremium;
        DOMElements.motoPremiumRatioDisplay.value = motoPremiumRatio.toFixed(2);
    } else {
        DOMElements.motoPremiumRatioDisplay.value = '0.00';
    }
}

/**
 * 更新摩意险手续费率显示
 * 计算公式：(随车业务费用率 + 卡单费用率) ÷ 2
 */
export function updateMotoHandlingFeeRateDisplay(DOMElements) {
    if (!DOMElements.motoHandlingFeeRateDisplay) return;

    const motoWithCarFeeRate = getInputValue(DOMElements, 'motoWithCarFeeRate');
    const motoCardFeeRate = getInputValue(DOMElements, 'motoCardFeeRate');

    const motoHandlingFeeRate = (motoWithCarFeeRate + motoCardFeeRate) / 2;
    DOMElements.motoHandlingFeeRateDisplay.value = motoHandlingFeeRate.toFixed(1);
}

export function setupMotoPremiumLink(DOMElements) {
    const { inputs } = DOMElements;
    const updateMotoPremium = () => {
        const carPremium = parseFloat(inputs.carPremium.value) || 0;
        const carAveragePremium = parseFloat(inputs.carAveragePremium.value) || 120;
        const motoAveragePremium = parseFloat(inputs.motoAveragePremium.value) || 100;
        const motoQuantity = parseFloat(inputs.motoQuantity.value) || 2;
        
        if (carAveragePremium > 0) {
            const ratio = (motoAveragePremium * motoQuantity) / carAveragePremium;
            const motoPremium = carPremium * ratio;
            if (inputs.motoPremium) {
                inputs.motoPremium.value = Math.round(motoPremium);
                inputs.motoPremium.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    };

    ['carPremium', 'carAveragePremium', 'motoAveragePremium', 'motoQuantity'].forEach(id => {
        if (inputs[id]) {
            inputs[id].addEventListener('input', updateMotoPremium);
        }
    });
}

export function updateConversionHints(DOMElements) {
    // Hints are removed
}

export function storeCurrentInputValues(DOMElements) {
    const snapshot = {};
    for (const key in DOMElements.inputs) snapshot[key] = DOMElements.inputs[key].value;
    return snapshot;
}

export function highlightChangedParameters(DOMElements, previousValues) {
    for (const key in DOMElements.inputs) {
        const inputElement = DOMElements.inputs[key];
        // Minimal implementation: just ensure we don't crash. 
        // Visual feedback is handled by validation state mostly.
        if (inputElement.value !== previousValues[key]) {
             // Optional: Add a subtle flash if needed, but keeping it clean for now.
        }
    }
}

export function setupInputBehaviors(DOMElements) {
    setupInputAutoFocus();
    setupDoubleTapReset(DOMElements);
    setupMotoPremiumLink(DOMElements);
}
