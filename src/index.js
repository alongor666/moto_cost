import { APP_CONFIG, DEFAULT_ANALYSIS_TAB, DEFAULT_SCHEME_KEY } from '../config.js';
import { cacheDOMElements, $ } from './ui/domCache.js';
import { toggleTheme, loadSavedTheme, updateThemeLabel } from './ui/theme.js';
import { toggleParametersDrawer, toggleHelpModal } from './ui/drawerAndModal.js';
import {
    applySchemaDefaults,
    setupInputBehaviors,
    validateAllInputs,
    validateField,
    updateConversionHints,
    updateMotoPremiumRatioDisplay,
    updateMotoHandlingFeeRateDisplay,
    storeCurrentInputValues,
    highlightChangedParameters
} from './ui/parametersForm.js';
import { debounce } from './utils/debounce.js';
import {
    getCalculationInputs,
    calculateBreakEvenAnalysis,
    performCalculations,
    deriveFixedCost,
    calculateProfitFromFactors,
    buildRateFactors,
    mapRateFactorValues
} from './services/calculator.js';
import { initCharts, disposeCharts, updateChartsForTab } from './charts/index.js';
import { applyScheme, handleSchemeChange, initSchemeDefaults } from './services/schemes.js';

const EChartsInstances = {};
let lastCalculatedData = null;
let exportCounter = 1;
let previousValues = {};

const getActiveTab = (DOMElements) => {
    const activeBtn = DOMElements.analysisTabsContainer.querySelector('.analysis-tab-btn.is-active');
    return activeBtn ? activeBtn.dataset.tab : DEFAULT_ANALYSIS_TAB;
};

function updateContextInsight(DOMElements, calculatedData, breakEvenData, inputs) {
    if (!calculatedData || !breakEvenData) return;
    const profitIndex = APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('PROFIT');
    const edgeIndex = APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('EDGE_CONTRIBUTION');
    const tcrIndex = APP_CONFIG.RATE_CHART_INDICATORS.indexOf('TCR');
    const profit = calculatedData.combined.absolute[profitIndex];
    const edgeContribution = calculatedData.combined.absolute[edgeIndex];
    const tcr = calculatedData.combined.rate[tcrIndex];

    const carLossRatio = inputs.carLossRatio * 100;
    const motoLossRatio = inputs.motoLossRatio * 100;

    const isHealthy = profit >= 0;
    const headline = '盈亏平衡分析';

    let insightText = `基于当前刚性成本配置（人力成本${(inputs.laborBaseRate * 100).toFixed(1)}%、固定运营成本${(inputs.fixedOperationRate * 100).toFixed(2)}%、车险手续费${(inputs.carHandlingFeeRate * 100).toFixed(1)}%、车险销推${(inputs.carSalesPromotionRate * 100).toFixed(1)}%、摩意险业务费用${((inputs.motoWithCarFeeRate * 100 + inputs.motoCardFeeRate * 100) / 2).toFixed(1)}%等），摩意险保费配比为${(breakEvenData.motoPremiumRatio * 100).toFixed(1)}%。`;

    insightText += ` 要实现盈亏平衡，在保持摩意险赔付率${motoLossRatio.toFixed(1)}%不变的情况下，车险赔付率需控制在${breakEvenData.carBreakEvenLossRatio}%以内；`;
    insightText += ` 若车险赔付率固定为${carLossRatio.toFixed(1)}%，摩意险赔付率需控制在${breakEvenData.motoBreakEvenLossRatio}%以内。`;
    insightText += ` 当前配置下，车险赔付率每上浮1个百分点将减少利润${Math.abs(breakEvenData.carSensitivity)}万元；摩意险赔付率每上浮1个百分点将减少利润${Math.abs(breakEvenData.motoSensitivity)}万元；若两者同时上浮1个百分点，总利润将减少${Math.abs(breakEvenData.bothSensitivity)}万元。`;

    const statusText = isHealthy
        ? `当前状态为盈利${profit.toFixed(1)}万元，综合成本率${(tcr * 100).toFixed(1)}%，表现良好。`
        : `当前状态为亏损${Math.abs(profit).toFixed(1)}万元，综合成本率${(tcr * 100).toFixed(1)}%，需优化赔付率控制。`;

    insightText += ` ${statusText}`;

    if (DOMElements.summaryHeadline) DOMElements.summaryHeadline.textContent = headline;
    if (DOMElements.summarySubline) DOMElements.summarySubline.textContent = insightText;
    if (DOMElements.insightSummary) DOMElements.insightSummary.textContent = `边际贡献${edgeContribution.toFixed(1)}万元 · 总利润${profit.toFixed(1)}万元`;
}

function updateThemeLabelSafe(DOMElements) {
    updateThemeLabel(DOMElements);
}

function focusOnProfitCard(DOMElements) {
    const profitCard = DOMElements.kpis.totalProfit ? DOMElements.kpis.totalProfit.closest('.kpi-card') : null;
    if (!profitCard) return;
    profitCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    profitCard.classList.add('kpi-card--pulse');
    profitCard.addEventListener('animationend', () => profitCard.classList.remove('kpi-card--pulse'), { once: true });
}

function updateKPIs(DOMElements, data) {
    const formatValue = (v, u, d = 1) => `${parseFloat(v.toFixed(d)).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}<span class="unit">${u}</span>`;
    const p = data.combined.absolute[APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('PROFIT')];
    const cr = data.combined.rate[APP_CONFIG.RATE_CHART_INDICATORS.indexOf('TCR')];
    const ec = data.combined.absolute[APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('EDGE_CONTRIBUTION')];
    DOMElements.kpis.totalProfit.innerHTML = formatValue(p, '万元');
    DOMElements.kpis.totalProfit.className = `kpi-card__value ${p >= 0 ? 'is-positive' : 'is-negative'}`;
    DOMElements.kpis.totalCostRate.innerHTML = formatValue(cr * 100, '%');
    DOMElements.kpis.totalCostRate.className = `kpi-card__value ${cr <= APP_CONFIG.INDICATOR_CONFIG.TCR.threshold ? 'is-positive' : 'is-negative'}`;
    DOMElements.kpis.totalPremium.innerHTML = formatValue(data.combined.absolute[APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('PREMIUM')], '万元');
    DOMElements.kpis.totalPremium.className = 'kpi-card__value';
    DOMElements.kpis.totalEdgeContribution.innerHTML = formatValue(ec, '万元');
    DOMElements.kpis.totalEdgeContribution.className = `kpi-card__value ${ec >= 0 ? 'is-positive' : 'is-negative'}`;
}

function setActiveAnalysisTab(DOMElements, tabKey) {
    const tabButton = $(`#analysisTabsContainer .analysis-tab-btn[data-tab="${tabKey}"]`);
    if (tabButton) tabButton.click();
}

function handleAnalysisTabClick(event, DOMElements) {
    const targetButton = event.target.closest('.analysis-tab-btn');
    if (!targetButton || !targetButton.dataset.tab) return;
    const tabKey = targetButton.dataset.tab;
    DOMElements.analysisTabsContainer.querySelectorAll('.analysis-tab-btn').forEach(btn => btn.classList.remove('is-active'));
    document.querySelectorAll('.analysis-content').forEach(content => content.classList.remove('is-active'));
    targetButton.classList.add('is-active');
    const activeContent = document.querySelector(`#analysisContent${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
    if (activeContent) activeContent.classList.add('is-active');
    if (lastCalculatedData) updateChartsForTab(DOMElements, EChartsInstances, tabKey, lastCalculatedData);
    ['Absolute', 'Rate'].forEach(type => {
        const chartKey = `${tabKey}${type}`;
        if (EChartsInstances[chartKey] && typeof EChartsInstances[chartKey].resize === 'function') {
            setTimeout(() => EChartsInstances[chartKey].resize(), 50);
        }
    });
}

function exportDataToCSV(DOMElements) {
    const inputs = getCalculationInputs(DOMElements);
    const data = performCalculations(inputs);
    const breakEvenData = calculateBreakEvenAnalysis(inputs);

    let csvContent = '\ufeff';
    csvContent += '车+摩意险成本测算结果汇总表\n\n';
    csvContent += '一、基本指标\n';
    csvContent += '指标分类,车险,摩意险,合计\n';
    const indicatorMap = [
        { name: '保费(万元)', absoluteIndex: 0 },
        { name: '赔款(万元)', absoluteIndex: 1 },
        { name: '手续费(万元)', absoluteIndex: 2 },
        { name: '销推费用(万元)', absoluteIndex: 3 },
        { name: '人力成本(万元)', absoluteIndex: 4 },
        { name: '边际贡献额(万元)', absoluteIndex: 5 },
        { name: '利润(万元)', absoluteIndex: 6 },
        { name: '综合成本率(%)', rateIndex: 0, isPercent: true },
        { name: '变动成本率(%)', rateIndex: 1, isPercent: true },
        { name: '赔付率(%)', rateIndex: 2, isPercent: true },
        { name: '边际贡献率(%)', rateIndex: 6, isPercent: true }
    ];

    function getValue(sectionData, indicator) {
        if (indicator.absoluteIndex !== undefined) return sectionData.absolute[indicator.absoluteIndex].toFixed(1);
        if (indicator.rateIndex !== undefined) {
            const rateArray = sectionData === data.combined.rate ? sectionData : sectionData.rate;
            return (rateArray[indicator.rateIndex] * 100).toFixed(1);
        }
        return '';
    }

    indicatorMap.forEach(indicator => {
        const row = [indicator.name, getValue(data.car, indicator), getValue(data.moto, indicator), getValue(indicator.isPercent ? data.combined.rate : data.combined, indicator)];
        csvContent += row.join(',') + '\n';
    });

    csvContent += '\n二、成本瀑布分析(绝对值-万元)\n';
    csvContent += '瀑布节点,车险,摩意险,合计\n';

    const carFixedCost = deriveFixedCost(data.car.absolute[0], data.car.rate);
    const motoFixedCost = deriveFixedCost(data.moto.absolute[0], data.moto.rate);
    const totalFixedCost = deriveFixedCost(data.combined.absolute[0], data.combined.rate);

    const carProfit = calculateProfitFromFactors({
        premium: data.car.absolute[0],
        loss: data.car.absolute[1],
        handlingFee: data.car.absolute[2],
        salesPromotion: data.car.absolute[3],
        laborCost: data.car.absolute[4],
        fixedCost: carFixedCost
    });

    const motoProfit = calculateProfitFromFactors({
        premium: data.moto.absolute[0],
        loss: data.moto.absolute[1],
        handlingFee: data.moto.absolute[2],
        salesPromotion: data.moto.absolute[3],
        laborCost: data.moto.absolute[4],
        fixedCost: motoFixedCost
    });

    const totalProfit = calculateProfitFromFactors({
        premium: data.combined.absolute[0],
        loss: data.combined.absolute[1],
        handlingFee: data.combined.absolute[2],
        salesPromotion: data.combined.absolute[3],
        laborCost: data.combined.absolute[4],
        fixedCost: totalFixedCost
    });

    const costItemsAbsolute = [
        { name: '赔款', car: data.car.absolute[1], moto: data.moto.absolute[1], total: data.combined.absolute[1] },
        { name: '手续费', car: data.car.absolute[2], moto: data.moto.absolute[2], total: data.combined.absolute[2] },
        { name: '销推费用', car: data.car.absolute[3], moto: data.moto.absolute[3], total: data.combined.absolute[3] },
        { name: '人力成本', car: data.car.absolute[4], moto: data.moto.absolute[4], total: data.combined.absolute[4] },
        { name: '固定成本', car: carFixedCost, moto: motoFixedCost, total: totalFixedCost }
    ].sort((a, b) => b.total - a.total);

    const waterfallAbsolute = [
        ['保费', data.car.absolute[0].toFixed(1), data.moto.absolute[0].toFixed(1), data.combined.absolute[0].toFixed(1)],
        ...costItemsAbsolute.map(item => [item.name, item.car.toFixed(1), item.moto.toFixed(1), item.total.toFixed(1)]),
        ['利润', carProfit.toFixed(1), motoProfit.toFixed(1), totalProfit.toFixed(1)]
    ];
    waterfallAbsolute.forEach(row => csvContent += row.join(',') + '\n');

    csvContent += '\n三、成本瀑布分析(比率-%)\n';
    csvContent += '瀑布节点,车险,摩意险,合计\n';

    const waterfallRate = [
        ['保费基准', '100.0', '100.0', '100.0']
    ];

    const sortedRateFactors = buildRateFactors(data.combined.rate);
    const carFactorValues = mapRateFactorValues(data.car.rate);
    const motoFactorValues = mapRateFactorValues(data.moto.rate);
    const combinedFactorValues = mapRateFactorValues(data.combined.rate);

    sortedRateFactors.forEach(factor => {
        waterfallRate.push([
            factor.name,
            carFactorValues[factor.key].toFixed(1),
            motoFactorValues[factor.key].toFixed(1),
            combinedFactorValues[factor.key].toFixed(1)
        ]);
    });
    waterfallRate.forEach(row => csvContent += row.join(',') + '\n');

    csvContent += '\n四、盈亏平衡与敏感性分析\n';
    csvContent += '分析项目,数值\n';
    csvContent += `摩意险保费配比,${(breakEvenData.motoPremiumRatio * 100).toFixed(2)}%\n`;
    csvContent += `车险赔付率平衡点(固定摩意险赔付率),${breakEvenData.carBreakEvenLossRatio}%\n`;
    csvContent += `摩意险赔付率平衡点(固定车险赔付率),${breakEvenData.motoBreakEvenLossRatio}%\n`;
    csvContent += `车险赔付率上浮1%利润影响,${breakEvenData.carSensitivity}万元\n`;
    csvContent += `摩意险赔付率上浮1%利润影响,${breakEvenData.motoSensitivity}万元\n`;
    csvContent += `两者同时上浮1%利润影响,${breakEvenData.bothSensitivity}万元\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    link.download = `摩托车成本分析_${dateStr}_${String(exportCounter).padStart(3, '0')}.csv`;
    exportCounter++;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateUI(DOMElements) {
    const inputs = getCalculationInputs(DOMElements);
    const calculatedData = performCalculations(inputs);
    const breakEvenData = calculateBreakEvenAnalysis(inputs);
    lastCalculatedData = calculatedData;
    validateAllInputs(DOMElements);
    updateKPIs(DOMElements, calculatedData);
    updateChartsForTab(DOMElements, EChartsInstances, getActiveTab(DOMElements), calculatedData);
    updateContextInsight(DOMElements, calculatedData, breakEvenData, inputs);
    updateThemeLabelSafe(DOMElements);
    updateMotoPremiumRatioDisplay(DOMElements);
    updateMotoHandlingFeeRateDisplay(DOMElements);
    updateConversionHints(DOMElements);
}

function bindEventListeners(DOMElements) {
    DOMElements.themeToggleBtn.addEventListener('click', () => toggleTheme(DOMElements, () => updateUI(DOMElements)));
    DOMElements.openParametersBtn.addEventListener('click', () => toggleParametersDrawer(DOMElements, true));
    if (DOMElements.openParametersBtnSecondary) DOMElements.openParametersBtnSecondary.addEventListener('click', () => toggleParametersDrawer(DOMElements, true));
    DOMElements.closeParametersBtn.addEventListener('click', () => toggleParametersDrawer(DOMElements, false));
    DOMElements.drawerBackdrop.addEventListener('click', () => toggleParametersDrawer(DOMElements, false));
    DOMElements.showHelpBtn.addEventListener('click', () => toggleHelpModal(DOMElements, true));
    DOMElements.closeHelpModalBtn.addEventListener('click', () => toggleHelpModal(DOMElements, false));
    DOMElements.helpModal.addEventListener('click', (e) => { if (e.target === DOMElements.helpModal) toggleHelpModal(DOMElements, false); });
    const applySchemeWithHighlight = (event) => {
        previousValues = storeCurrentInputValues(DOMElements);
        handleSchemeChange(event, DOMElements, () => updateUI(DOMElements), { value: previousValues, onHighlight: () => highlightChangedParameters(DOMElements, previousValues) });
    };
    DOMElements.schemeSelector.addEventListener('click', applySchemeWithHighlight);
    if (DOMElements.drawerSchemeSelector) DOMElements.drawerSchemeSelector.addEventListener('click', applySchemeWithHighlight);
    DOMElements.exportDataBtn.addEventListener('click', () => exportDataToCSV(DOMElements));
    DOMElements.analysisTabsContainer.addEventListener('click', (event) => handleAnalysisTabClick(event, DOMElements));
    if (DOMElements.focusOnProfitBtn) DOMElements.focusOnProfitBtn.addEventListener('click', () => focusOnProfitCard(DOMElements));
    if (DOMElements.resetParametersBtn) DOMElements.resetParametersBtn.addEventListener('click', () => {
        previousValues = storeCurrentInputValues(DOMElements);
        applyScheme(DOMElements, DEFAULT_SCHEME_KEY, () => updateUI(DOMElements), { value: previousValues, onHighlight: () => highlightChangedParameters(DOMElements, previousValues) });
    });
    if (DOMElements.applyParametersBtn) DOMElements.applyParametersBtn.addEventListener('click', () => { updateUI(DOMElements); toggleParametersDrawer(DOMElements, false); });
    const debouncedUpdate = debounce(() => updateUI(DOMElements), 300);
    for (const key in DOMElements.inputs) {
        DOMElements.inputs[key].addEventListener('focus', () => { previousValues = storeCurrentInputValues(DOMElements); });
        DOMElements.inputs[key].addEventListener('input', () => { validateField(DOMElements, key); updateConversionHints(DOMElements); debouncedUpdate(); });
        DOMElements.inputs[key].addEventListener('change', () => { highlightChangedParameters(DOMElements, previousValues); updateUI(DOMElements); });
    }
    window.addEventListener('resize', () => {
        for (const key in EChartsInstances) {
            if (EChartsInstances[key] && typeof EChartsInstances[key].resize === 'function') EChartsInstances[key].resize();
        }
    });
    window.addEventListener('beforeunload', () => disposeCharts(EChartsInstances));
}

function init() {
    const DOMElements = cacheDOMElements(APP_CONFIG);
    applySchemaDefaults(DOMElements);
    loadSavedTheme(DOMElements);
    initCharts(DOMElements, EChartsInstances);
    setupInputBehaviors(DOMElements);
    bindEventListeners(DOMElements);
    previousValues = storeCurrentInputValues(DOMElements);
    applyScheme(DOMElements, DEFAULT_SCHEME_KEY, () => updateUI(DOMElements), { value: previousValues, onHighlight: () => highlightChangedParameters(DOMElements, previousValues) });
    initSchemeDefaults(DOMElements);
    setActiveAnalysisTab(DOMElements, DEFAULT_ANALYSIS_TAB);
    updateThemeLabelSafe(DOMElements);
}

document.addEventListener('DOMContentLoaded', init);
