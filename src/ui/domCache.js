export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export function cacheDOMElements(APP_CONFIG) {
    const DOMElements = {};
    DOMElements.html = document.documentElement;
    DOMElements.themeToggleBtn = $('#themeToggleBtn');
    DOMElements.parametersDrawer = $('#parametersDrawer');
    DOMElements.openParametersBtn = $('#openParametersBtn');
    DOMElements.closeParametersBtn = $('#closeParametersBtn');
    DOMElements.drawerBackdrop = $('#drawerBackdrop');
    DOMElements.helpModal = $('#indicatorHelpModal');
    DOMElements.showHelpBtn = $('#showHelpBtn');
    DOMElements.closeHelpModalBtn = $('#closeHelpModalBtn');
    DOMElements.schemeSelector = $('#schemeSelector');
    DOMElements.drawerSchemeSelector = $('#drawerSchemeSelector');
    DOMElements.exportDataBtn = $('#exportDataBtn');
    DOMElements.analysisTabsContainer = $('#analysisTabsContainer');
    DOMElements.activeSchemeLabel = $('#activeSchemeLabel');
    DOMElements.activeThemeLabel = $('#activeThemeLabel');
    DOMElements.insightSummary = $('#insightSummary');
    DOMElements.summaryHeadline = $('#summaryHeadline');
    DOMElements.summarySubline = $('#summarySubline');
    DOMElements.focusOnProfitBtn = $('#focusOnProfitBtn');
    DOMElements.openParametersBtnSecondary = $('#openParametersBtnSecondary');
    DOMElements.resetParametersBtn = $('#resetParametersBtn');
    DOMElements.applyParametersBtn = $('#applyParametersBtn');
    DOMElements.motoPremiumRatioDisplay = $('#motoPremiumRatioDisplay');
    DOMElements.toggleAllCardsBtn = $('#toggleAllCardsBtn');

    DOMElements.inputs = {};
    for (const key in APP_CONFIG.INPUT_SELECTORS) {
        DOMElements.inputs[key] = $(APP_CONFIG.INPUT_SELECTORS[key]);
    }

    DOMElements.statusChips = {};
    $$('.status-chip').forEach(chip => {
        if (chip.dataset.field) DOMElements.statusChips[chip.dataset.field] = chip;
    });

    DOMElements.kpis = {};
    for (const key in APP_CONFIG.KPI_SELECTORS) {
        DOMElements.kpis[key] = $(APP_CONFIG.KPI_SELECTORS[key]);
    }

    return DOMElements;
}
