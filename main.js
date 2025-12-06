    // --- CostInsightPro Application Module ---
    const CostInsightPro = (() => {
        const DOMElements = {}; 
        const EChartsInstances = {};
        let currentInputValues = {};
        let exportCounter = 1;
        let lastCalculatedData = null;

        // --- Utilities ---
        const $ = (s) => document.querySelector(s);
        const $$ = (s) => document.querySelectorAll(s);
        const getInputValue = (id) => parseFloat(DOMElements.inputs[id].value) || 0;
        const getInputValueAsRate = (id) => (parseFloat(DOMElements.inputs[id].value) / 100) || 0;
        const getCssVariable = (varName) => getComputedStyle(DOMElements.html).getPropertyValue(varName).trim();
        const debounce = (fn, delay = 300) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        };
        const getActiveTab = () => {
            const activeBtn = DOMElements.analysisTabsContainer.querySelector('.analysis-tab-btn.is-active');
            return activeBtn ? activeBtn.dataset.tab : DEFAULT_ANALYSIS_TAB;
        };

        // --- DOM Cache, Theme, Drawer, Modal, Scheme, Tabs (mostly same logic as before) ---
        function cacheDOMElements() { /* ... same as before ... */
            DOMElements.html = $('html'); DOMElements.themeToggleBtn = $('#themeToggleBtn'); DOMElements.parametersDrawer = $('#parametersDrawer'); DOMElements.openParametersBtn = $('#openParametersBtn'); DOMElements.closeParametersBtn = $('#closeParametersBtn'); DOMElements.drawerBackdrop = $('#drawerBackdrop'); DOMElements.helpModal = $('#indicatorHelpModal'); DOMElements.showHelpBtn = $('#showHelpBtn'); DOMElements.closeHelpModalBtn = $('#closeHelpModalBtn'); DOMElements.schemeSelector = $('#schemeSelector'); DOMElements.exportDataBtn = $('#exportDataBtn'); DOMElements.analysisTabsContainer = $('#analysisTabsContainer');
            DOMElements.activeSchemeLabel = $('#activeSchemeLabel'); DOMElements.activeThemeLabel = $('#activeThemeLabel'); DOMElements.insightSummary = $('#insightSummary');
            DOMElements.summaryHeadline = $('#summaryHeadline'); DOMElements.summarySubline = $('#summarySubline'); DOMElements.focusOnProfitBtn = $('#focusOnProfitBtn'); DOMElements.openParametersBtnSecondary = $('#openParametersBtnSecondary');
            DOMElements.motoPremiumRatioDisplay = $('#motoPremiumRatioDisplay');
            DOMElements.inputs = {}; for (const key in APP_CONFIG.INPUT_SELECTORS) DOMElements.inputs[key] = $(APP_CONFIG.INPUT_SELECTORS[key]);
            DOMElements.kpis = {}; for (const key in APP_CONFIG.KPI_SELECTORS) DOMElements.kpis[key] = $(APP_CONFIG.KPI_SELECTORS[key]);
        }

        // --- 参数表格折叠展开功能 ---
        function initParameterTableCollapse() {
            const categoryRows = $$('.category-row.collapsible');
            categoryRows.forEach(row => {
                row.addEventListener('click', (e) => {
                    const category = row.dataset.category;
                    const isCollapsed = row.classList.contains('collapsed');

                    if (isCollapsed) {
                        // 展开
                        row.classList.remove('collapsed');
                        const relatedRows = $$(`.param-row[data-category="${category}"]`);
                        relatedRows.forEach(r => r.classList.remove('hidden'));
                    } else {
                        // 折叠
                        row.classList.add('collapsed');
                        const relatedRows = $$(`.param-row[data-category="${category}"]`);
                        relatedRows.forEach(r => r.classList.add('hidden'));
                    }
                });
            });
        }

        // --- 输入自动跳转功能 ---
        function setupInputAutoFocus() {
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

        // --- 更新摩意险保费配比显示 ---
        function updateMotoPremiumRatioDisplay() {
            if (!DOMElements.motoPremiumRatioDisplay) return;

            const carAveragePremium = getInputValue('carAveragePremium');
            const motoAveragePremium = getInputValue('motoAveragePremium');
            const motoQuantity = getInputValue('motoQuantity');

            if (carAveragePremium > 0) {
                const motoPremiumRatio = (motoAveragePremium * motoQuantity) / carAveragePremium;
                DOMElements.motoPremiumRatioDisplay.textContent = `${(motoPremiumRatio * 100).toFixed(2)}%`;
            } else {
                DOMElements.motoPremiumRatioDisplay.textContent = '--';
            }
        }
        function applyTheme(theme) { DOMElements.html.classList.remove('theme-light', 'theme-dark'); DOMElements.html.classList.add(`theme-${theme}`); localStorage.setItem(APP_CONFIG.THEME_STORAGE_KEY, theme); updateUI(); }
        function toggleTheme() { const currentTheme = DOMElements.html.classList.contains('theme-dark') ? 'dark' : 'light'; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
        function loadSavedTheme() { const savedTheme = localStorage.getItem(APP_CONFIG.THEME_STORAGE_KEY) || 'dark'; DOMElements.html.classList.remove('theme-light', 'theme-dark'); DOMElements.html.classList.add(`theme-${savedTheme}`); }
        function toggleParametersDrawer(forceOpen) { const isOpen = DOMElements.parametersDrawer.classList.contains('is-open'); const openDrawer = typeof forceOpen === 'boolean' ? forceOpen : !isOpen; if (openDrawer) { DOMElements.parametersDrawer.classList.add('is-open'); DOMElements.drawerBackdrop.classList.add('is-visible'); document.body.style.overflow = 'hidden'; } else { DOMElements.parametersDrawer.classList.remove('is-open'); DOMElements.drawerBackdrop.classList.remove('is-visible'); if (!DOMElements.helpModal.classList.contains('is-visible')) { document.body.style.overflow = ''; } } }
        function toggleHelpModal(show) { if (show) { DOMElements.helpModal.classList.add('is-visible'); document.body.style.overflow = 'hidden'; } else { DOMElements.helpModal.classList.remove('is-visible'); if (!DOMElements.parametersDrawer.classList.contains('is-open')) { document.body.style.overflow = ''; } } }
        function storeCurrentInputValues() { currentInputValues = {}; for (const key in DOMElements.inputs) currentInputValues[key] = DOMElements.inputs[key].value; }
        function highlightChangedParameters() { for (const key in DOMElements.inputs) { const inputElement = DOMElements.inputs[key]; inputElement.classList.remove('form-field__input--highlight'); if (inputElement.value !== currentInputValues[key]) { inputElement.classList.add('form-field__input--highlight'); inputElement.addEventListener('animationend', () => inputElement.classList.remove('form-field__input--highlight'), { once: true }); } } }
        function applyScheme(schemeKey) { storeCurrentInputValues(); const scheme = APP_CONFIG.SCHEMES[schemeKey]; if (!scheme || !scheme.params) return; for (const key in scheme.params) if (DOMElements.inputs[key]) DOMElements.inputs[key].value = scheme.params[key]; updateUI(); toggleParametersDrawer(true); requestAnimationFrame(() => requestAnimationFrame(highlightChangedParameters)); setActiveSchemeLabel(schemeKey); }
        function handleSchemeChange(event) { const targetButton = event.target.closest('.btn'); if (!targetButton || !targetButton.dataset.scheme) return; const schemeKey = targetButton.dataset.scheme; applyScheme(schemeKey); $$('#schemeSelector .btn').forEach(btn => btn.classList.remove('is-active')); targetButton.classList.add('is-active'); }
        function handleAnalysisTabClick(event) {
            const targetButton = event.target.closest('.analysis-tab-btn');
            if (!targetButton || !targetButton.dataset.tab) return;
            const tabKey = targetButton.dataset.tab;
            $$('.analysis-tab-btn').forEach(btn => btn.classList.remove('is-active'));
            $$('.analysis-content').forEach(content => content.classList.remove('is-active'));
            targetButton.classList.add('is-active');
            const activeContent = $(`#analysisContent${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
            if (activeContent) activeContent.classList.add('is-active');
            if (lastCalculatedData) updateChartsForTab(tabKey, lastCalculatedData);
            ['Absolute', 'Rate'].forEach(type => {
                const chartKey = `${tabKey}${type}`;
                if (EChartsInstances[chartKey] && typeof EChartsInstances[chartKey].resize === 'function') {
                    setTimeout(() => EChartsInstances[chartKey].resize(), 50);
                }
            });
        }
        function setActiveAnalysisTab(tabKey) { const tabButton = $(`#analysisTabsContainer .analysis-tab-btn[data-tab="${tabKey}"]`); if (tabButton) tabButton.click(); }

        function setActiveSchemeLabel(schemeKey) {
            if (!DOMElements.activeSchemeLabel) return;
            const scheme = APP_CONFIG.SCHEMES[schemeKey];
            const label = scheme?.name || '自定义方案';
            DOMElements.activeSchemeLabel.textContent = label;
        }

        function updateContextInsight(calculatedData, breakEvenData) {
            if (!calculatedData || !breakEvenData) return;
            const profitIndex = APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('PROFIT');
            const edgeIndex = APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('EDGE_CONTRIBUTION');
            const tcrIndex = APP_CONFIG.RATE_CHART_INDICATORS.indexOf('TCR');
            const profit = calculatedData.combined.absolute[profitIndex];
            const edgeContribution = calculatedData.combined.absolute[edgeIndex];
            const tcr = calculatedData.combined.rate[tcrIndex];

            // 获取当前赔付率
            const inputs = getCalculationInputs();
            const carLossRatio = inputs.carLossRatio * 100;
            const motoLossRatio = inputs.motoLossRatio * 100;

            // 动态生成散文式结论
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

        function updateThemeLabel() {
            if (!DOMElements.activeThemeLabel) return;
            const isDark = DOMElements.html.classList.contains('theme-dark');
            DOMElements.activeThemeLabel.textContent = isDark ? '深色模式' : '浅色模式';
        }

        function focusOnProfitCard() {
            const profitCard = DOMElements.kpis.totalProfit ? DOMElements.kpis.totalProfit.closest('.kpi-card') : null;
            if (!profitCard) return;
            profitCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            profitCard.classList.add('kpi-card--pulse');
            profitCard.addEventListener('animationend', () => profitCard.classList.remove('kpi-card--pulse'), { once: true });
        }
        
        // --- KPI Update (Adjusted for 1 decimal place) ---
        function updateKPIs(data) { 
            const formatValue = (v, u, d = 1) => `${parseFloat(v.toFixed(d)).toLocaleString(undefined, {minimumFractionDigits:d, maximumFractionDigits:d})}<span class="unit">${u}</span>`; 
            const p = data.combined.absolute[APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('PROFIT')]; 
            const cr = data.combined.rate[APP_CONFIG.RATE_CHART_INDICATORS.indexOf('TCR')]; 
            const ec = data.combined.absolute[APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('EDGE_CONTRIBUTION')]; 
            DOMElements.kpis.totalProfit.innerHTML = formatValue(p, '万元'); 
            DOMElements.kpis.totalProfit.className = `kpi-card__value ${p >= 0 ? 'is-positive' : 'is-negative'}`; 
            DOMElements.kpis.totalCostRate.innerHTML = formatValue(cr * 100, '%'); 
            DOMElements.kpis.totalCostRate.className = `kpi-card__value ${cr <= APP_CONFIG.INDICATOR_CONFIG.TCR.threshold ? 'is-positive' : 'is-negative'}`; 
            DOMElements.kpis.totalPremium.innerHTML = formatValue(data.combined.absolute[APP_CONFIG.ABSOLUTE_CHART_INDICATORS.indexOf('PREMIUM')], '万元'); 
            DOMElements.kpis.totalPremium.className = `kpi-card__value`; 
            DOMElements.kpis.totalEdgeContribution.innerHTML = formatValue(ec, '万元'); 
            DOMElements.kpis.totalEdgeContribution.className = `kpi-card__value ${ec >= 0 ? 'is-positive' : 'is-negative'}`; 
        }

        // --- Calculations --- (Core logic remains the same)
        function getCalculationInputs() { /* ... */
            return {
                carPremium: getInputValue('carPremium'), carLossRatio: getInputValueAsRate('carLossRatio'), carHandlingFeeRate: getInputValueAsRate('carHandlingFeeRate'), carSalesPromotionRate: getInputValueAsRate('carSalesPromotionRate'), carStandardPremiumRatio: getInputValue('carStandardPremiumRatio'),
                carAveragePremium: getInputValue('carAveragePremium'), motoAveragePremium: getInputValue('motoAveragePremium'), motoQuantity: getInputValue('motoQuantity'), motoLossRatio: getInputValueAsRate('motoLossRatio'), motoWithCarFeeRate: getInputValueAsRate('motoWithCarFeeRate'), motoCardFeeRate: getInputValueAsRate('motoCardFeeRate'), motoSalesPromotionRate: getInputValueAsRate('motoSalesPromotionRate'), motoStandardPremiumRatio: getInputValue('motoStandardPremiumRatio'),
                laborBaseRate: getInputValueAsRate('laborBaseRate'), fixedOperationRate: getInputValueAsRate('fixedOperationRate'),
            };
        }
        // 盈亏平衡与敏感性分析计算
        function calculateBreakEvenAnalysis(inputs) {
            const { carPremium, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carStandardPremiumRatio, carAveragePremium, motoAveragePremium, motoQuantity, motoLossRatio, motoWithCarFeeRate, motoCardFeeRate, motoSalesPromotionRate, motoStandardPremiumRatio, laborBaseRate, fixedOperationRate } = inputs;

            // 计算保费配比
            const motoPremiumRatio = carAveragePremium > 0 ? (motoAveragePremium * motoQuantity) / carAveragePremium : 0;
            const motoHandlingFeeRate = (motoWithCarFeeRate + motoCardFeeRate) / 2;

            // 固定成本计算
            const carFixedCosts = carHandlingFeeRate + carSalesPromotionRate + (carStandardPremiumRatio * laborBaseRate);
            const motoFixedCosts = motoHandlingFeeRate + motoSalesPromotionRate + (motoStandardPremiumRatio * laborBaseRate);

            // 场景1: 固定摩意险赔付率，计算车险赔付率平衡点
            // 公式: (车险赔付率 + carFixedCosts) + motoPremiumRatio × (motoLossRatio + motoFixedCosts) = (1 + motoPremiumRatio) × (1 - fixedOperationRate)
            const carBreakEvenLossRatio = ((1 + motoPremiumRatio) * (1 - fixedOperationRate) - motoPremiumRatio * (motoLossRatio + motoFixedCosts) - carFixedCosts) * 100;

            // 场景2: 固定车险赔付率，计算摩意险赔付率平衡点
            // 公式: (carLossRatio + carFixedCosts) + motoPremiumRatio × (摩意险赔付率 + motoFixedCosts) = (1 + motoPremiumRatio) × (1 - fixedOperationRate)
            const motoBreakEvenLossRatio = (((1 + motoPremiumRatio) * (1 - fixedOperationRate) - (carLossRatio + carFixedCosts)) / motoPremiumRatio - motoFixedCosts) * 100;

            // 场景3: 车险赔付率上浮1%的利润影响
            const carSensitivity = -carPremium * 0.01; // 万元

            // 场景4: 摩意险赔付率上浮1%的利润影响
            const motoSensitivity = -carPremium * motoPremiumRatio * 0.01; // 万元

            // 场景5: 两者都上浮1%的利润影响
            const bothSensitivity = carSensitivity + motoSensitivity; // 万元

            return {
                carBreakEvenLossRatio: parseFloat(carBreakEvenLossRatio.toFixed(1)),
                motoBreakEvenLossRatio: parseFloat(motoBreakEvenLossRatio.toFixed(1)),
                carSensitivity: parseFloat(carSensitivity.toFixed(1)),
                motoSensitivity: parseFloat(motoSensitivity.toFixed(1)),
                bothSensitivity: parseFloat(bothSensitivity.toFixed(1)),
                motoPremiumRatio: parseFloat(motoPremiumRatio.toFixed(4))
            };
        }

        function performCalculations(inputs) { /* ... */
             const { carPremium, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carStandardPremiumRatio, carAveragePremium, motoAveragePremium, motoQuantity, motoLossRatio, motoWithCarFeeRate, motoCardFeeRate, motoSalesPromotionRate, motoStandardPremiumRatio, laborBaseRate, fixedOperationRate } = inputs;
            // 计算保费配比和摩意险保单获取成本率
            const motoPremiumRatio = carAveragePremium > 0 ? (motoAveragePremium * motoQuantity) / carAveragePremium : 0;
            const motoHandlingFeeRate = (motoWithCarFeeRate + motoCardFeeRate) / 2;
            const carLaborCostRate = carStandardPremiumRatio * laborBaseRate; const carVariableCostRate = carLossRatio + carHandlingFeeRate + carSalesPromotionRate + carLaborCostRate; const carTotalCostRate = carVariableCostRate + fixedOperationRate; const carEdgeContributionRate = 1 - carVariableCostRate; const carLoss = carPremium * carLossRatio; const carHandlingFee = carPremium * carHandlingFeeRate; const carSalesPromotion = carPremium * carSalesPromotionRate; const carLaborCost = carPremium * carLaborCostRate; const carEdgeContribution = carPremium * carEdgeContributionRate; const carProfit = carPremium * (1 - carTotalCostRate);
            const motoPremium = carPremium * motoPremiumRatio; const motoLaborCostRate = motoStandardPremiumRatio * laborBaseRate; const motoVariableCostRate = motoLossRatio + motoHandlingFeeRate + motoSalesPromotionRate + motoLaborCostRate; const motoTotalCostRate = motoVariableCostRate + fixedOperationRate; const motoEdgeContributionRate = 1 - motoVariableCostRate; const motoLoss = motoPremium * motoLossRatio; const motoHandlingFee = motoPremium * motoHandlingFeeRate; const motoSalesPromotion = motoPremium * motoSalesPromotionRate; const motoLaborCost = motoPremium * motoLaborCostRate; const motoEdgeContribution = motoPremium * motoEdgeContributionRate; const motoProfit = motoPremium * (1 - motoTotalCostRate);
            const totalPremium = carPremium + motoPremium; const totalLoss = carLoss + motoLoss; const totalHandlingFee = carHandlingFee + motoHandlingFee; const totalSalesPromotion = carSalesPromotion + motoSalesPromotion; const totalLaborCost = carLaborCost + motoLaborCost; const totalVariableCost = totalLoss + totalHandlingFee + totalSalesPromotion + totalLaborCost; const totalVariableCostRate = totalPremium > 0 ? totalVariableCost / totalPremium : 0; const totalCostRate = totalVariableCostRate + fixedOperationRate; const totalEdgeContribution = carEdgeContribution + motoEdgeContribution; const totalProfit = carProfit + motoProfit; const totalEdgeContributionRate = 1 - totalVariableCostRate;
            return { car: { absolute: [carPremium, carLoss, carHandlingFee, carSalesPromotion, carLaborCost, carEdgeContribution, carProfit], rate: [carTotalCostRate, carVariableCostRate, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carLaborCostRate, carEdgeContributionRate] }, moto: { absolute: [motoPremium, motoLoss, motoHandlingFee, motoSalesPromotion, motoLaborCost, motoEdgeContribution, motoProfit], rate: [motoTotalCostRate, motoVariableCostRate, motoLossRatio, motoHandlingFeeRate, motoSalesPromotionRate, motoLaborCostRate, motoEdgeContributionRate] }, combined: { absolute: [totalPremium, totalLoss, totalHandlingFee, totalSalesPromotion, totalLaborCost, totalEdgeContribution, totalProfit], rate: [totalCostRate, totalVariableCostRate, totalPremium > 0 ? totalLoss/totalPremium : 0, totalPremium > 0 ? totalHandlingFee/totalPremium : 0, totalPremium > 0 ? totalSalesPromotion/totalPremium : 0, totalPremium > 0 ? totalLaborCost/totalPremium : 0, totalEdgeContributionRate] } };
        }

        // --- ECharts Theming & Configuration (Adjusted for 1 decimal, new titles, removed Y-axis) ---
        function getChartThemeOptions() {
            const isDark = DOMElements.html.classList.contains('theme-dark');
            const cssVar = (name) => getCssVariable(name);

            return {
                isDark, colorPositive: cssVar('--color-positive'), colorNegative: cssVar('--color-negative'), colorNeutral: cssVar('--color-neutral'), colorAccent: cssVar('--color-accent'),
                textColorPrimary: cssVar('--color-text-primary'), textColorSecondary: cssVar('--color-text-secondary'), borderColor: cssVar('--color-border'),
                title: { left: 'center', top: '5%', textStyle: { color: cssVar('--color-text-primary'), fontSize: 18, fontWeight: cssVar('--font-weight-semibold'), fontFamily: cssVar('--font-family-sans'), } }, // Slightly larger title
                grid: { left: '3%', right: '5%', bottom: '20%', top: '20%', containLabel: true }, // Adjusted bottom/top for larger X-axis labels and title
                textStyle: { fontFamily: cssVar('--font-family-sans'), color: cssVar('--color-text-secondary'), fontSize: parseFloat(cssVar('--font-size-chart-xaxis')) }, // Base text style for chart
                tooltip: {
                    trigger: 'axis', axisPointer: { type: 'shadow' },
                    backgroundColor: cssVar(isDark ? '--color-background-elevated' : '--color-background-content'),
                    borderColor: cssVar('--color-border'),
                    textStyle: { color: cssVar('--color-text-primary') },
                    confine: true,
                    valueFormatter: (value) => value != null ? parseFloat(value).toFixed(1) : 'N/A' // Tooltip value 1 decimal
                },
                xAxis: {
                    type: 'category',
                    axisLine: { show: true, lineStyle: { color: cssVar('--color-border'), width: 1 } },
                    axisTick: { show: false },
                    axisLabel: { 
                        color: cssVar('--color-text-secondary'), 
                        fontSize: parseFloat(cssVar('--font-size-chart-xaxis')),
                        interval: 0, rotate: 0,
                        fontWeight: cssVar('--font-weight-semibold') // Bolder X-axis labels
                    }
                },
                yAxis: { show: false }, // Y-axis removed
                seriesBase: {
                    type: 'bar', barWidth: '70%', barGap: '-50%',
                    itemStyle: { borderRadius: [5, 5, 0, 0] },
                    label: {
                        show: true, position: 'top',
                        fontFamily: cssVar('--font-family-sans'),
                        fontSize: parseFloat(cssVar('--font-size-chart-xaxis')),
                        fontWeight: cssVar('--font-weight-bold'),
                        distance: 8,
                        padding: [5, 5, 5, 5], // 增加内边距
                        formatter: (params) => parseFloat(params.value).toFixed(1) // Data label 1 decimal
                    }
                },
                colorPalette: isDark
                    ? [cssVar('--color-accent'), '#5e5ce6', '#64d2ff', '#ff9f0a', '#bf5af2', '#30d15b', '#ff453a']
                    : [cssVar('--color-accent'), '#5856d6', '#5ac8fa', '#ff9500', '#af52de', '#34c759', '#dc3545']
            };
        }
        function determineColor(value, config, themeOpts) { /* ... same as before ... */ 
             if (config.colorKey === 'conditional') { if (config.isRate && config.higherIsWorse) { return value > config.threshold ? themeOpts.colorNegative : themeOpts.colorPositive; } else if (config.positiveGood) { return value >= 0 ? themeOpts.colorPositive : themeOpts.colorNegative; } } return config.colorKey === 'neutral' ? themeOpts.colorNeutral : themeOpts.colorAccent;
        }

        function createAbsoluteChartOption(data, chartTitle, unit = '万元') {
            const themeOpts = getChartThemeOptions();
            // 瀑布图数据结构：保费, -赔款, -手续费, -销推, -人力, =边际贡献, -固定成本, =利润
            // data数组: [保费, 赔款, 手续费, 销推, 人力, 边际贡献, 利润]
            const [premium, loss, handlingFee, salesPromotion, laborCost, edgeContribution, profit] = data.map(v => parseFloat(v.toFixed(1)));

            // 计算固定成本 = 边际贡献 - 利润
            const fixedCost = parseFloat((edgeContribution - profit).toFixed(1));

            // 瀑布图X轴标签
            const xAxisData = ['保费', '赔款', '手续费', '销推费用', '人力成本', '边际贡献', '固定成本', '利润'];

            // 计算累计值（用于透明助手柱）
            let cumulative = 0;
            const helpers = [];
            const values = [];
            const colors = [];

            // 1. 保费（起点）
            helpers.push(0);
            values.push(premium);
            cumulative = premium;
            colors.push(themeOpts.colorNeutral);

            // 2-5. 成本项（减项）
            const costs = [loss, handlingFee, salesPromotion, laborCost];
            costs.forEach(cost => {
                helpers.push(cumulative - cost);
                values.push(cost);
                cumulative -= cost;
                colors.push(themeOpts.colorNegative);
            });

            // 6. 边际贡献（中间点）
            helpers.push(0);
            values.push(edgeContribution);
            colors.push(edgeContribution >= 0 ? themeOpts.colorPositive : themeOpts.colorNegative);

            // 7. 固定成本（减项）
            helpers.push(cumulative - fixedCost);
            values.push(fixedCost);
            cumulative -= fixedCost;
            colors.push(themeOpts.colorNegative);

            // 8. 利润（终点）
            helpers.push(0);
            values.push(profit);
            colors.push(profit >= 0 ? themeOpts.colorPositive : themeOpts.colorNegative);

            return {
                title: { ...themeOpts.title, text: chartTitle },
                grid: themeOpts.grid,
                textStyle: themeOpts.textStyle,
                tooltip: {
                    ...themeOpts.tooltip,
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params) => {
                        const item = params[1]; // values series
                        const name = item.axisValue;
                        const value = parseFloat(item.value).toFixed(1);
                        return `${name}<br/>${value} ${unit}`;
                    }
                },
                xAxis: { ...themeOpts.xAxis, data: xAxisData },
                yAxis: themeOpts.yAxis,
                series: [
                    {
                        name: '辅助',
                        type: 'bar',
                        stack: 'total',
                        itemStyle: { color: 'transparent' },
                        emphasis: { itemStyle: { color: 'transparent' } },
                        data: helpers,
                        animation: false
                    },
                    {
                        name: '数值',
                        type: 'bar',
                        stack: 'total',
                        barWidth: '50%',
                        itemStyle: {
                            borderRadius: [5, 5, 0, 0]
                        },
                        label: {
                            show: true,
                            position: 'top',
                            fontFamily: themeOpts.textStyle.fontFamily,
                            fontSize: parseFloat(getCssVariable('--font-size-chart-xaxis')),
                            fontWeight: getCssVariable('--font-weight-bold'),
                            distance: 8,
                            padding: [5, 5, 5, 5],
                            formatter: (params) => parseFloat(params.value).toFixed(1)
                        },
                        data: values.map((val, idx) => ({
                            value: val,
                            itemStyle: { color: colors[idx] },
                            label: { color: colors[idx] }
                        }))
                    }
                ]
            };
        }

        function createRateChartOption(data, chartTitle) {
            const themeOpts = getChartThemeOptions();
            // 瀑布图数据结构（比率）: data = [综合成本率, 变动成本率, 赔付率, 手续费率, 销推费率, 人力成本率, 边际贡献率]
            const [totalCostRate, variableCostRate, lossRatio, handlingFeeRatio, salesPromotionRatio, laborCostRatio, edgeContributionRatio] = data;

            // 转换为百分比
            const lossRatioPct = parseFloat((lossRatio * 100).toFixed(1));
            const handlingFeeRatioPct = parseFloat((handlingFeeRatio * 100).toFixed(1));
            const salesPromotionRatioPct = parseFloat((salesPromotionRatio * 100).toFixed(1));
            const laborCostRatioPct = parseFloat((laborCostRatio * 100).toFixed(1));
            const variableCostRatePct = parseFloat((variableCostRate * 100).toFixed(1));
            const fixedCostRatePct = parseFloat(((totalCostRate - variableCostRate) * 100).toFixed(1));
            const totalCostRatePct = parseFloat((totalCostRate * 100).toFixed(1));
            const profitRatePct = parseFloat(((1 - totalCostRate) * 100).toFixed(1));

            // 瀑布图X轴标签
            const xAxisData = ['保费基准', '赔付率', '手续费率', '销推费率', '人力成本率', '变动成本率', '固定成本率', '综合成本率', '利润率'];

            // 计算累计值
            let cumulative = 100; // 从100%开始
            const helpers = [];
            const values = [];
            const colors = [];

            // 1. 保费基准（100%）
            helpers.push(0);
            values.push(100);
            colors.push(themeOpts.colorNeutral);

            // 2-5. 成本率项（减项）
            const costs = [lossRatioPct, handlingFeeRatioPct, salesPromotionRatioPct, laborCostRatioPct];
            costs.forEach(cost => {
                helpers.push(cumulative - cost);
                values.push(cost);
                cumulative -= cost;
                colors.push(themeOpts.colorNegative);
            });

            // 6. 变动成本率（累计点）
            helpers.push(0);
            values.push(variableCostRatePct);
            colors.push(themeOpts.colorNeutral);

            // 7. 固定成本率（减项）
            helpers.push(cumulative - fixedCostRatePct);
            values.push(fixedCostRatePct);
            cumulative -= fixedCostRatePct;
            colors.push(themeOpts.colorNegative);

            // 8. 综合成本率（累计点）
            helpers.push(0);
            values.push(totalCostRatePct);
            colors.push(totalCostRatePct <= 100 ? themeOpts.colorNeutral : themeOpts.colorNegative);

            // 9. 利润率（剩余）
            helpers.push(0);
            values.push(profitRatePct);
            colors.push(profitRatePct >= 0 ? themeOpts.colorPositive : themeOpts.colorNegative);

            return {
                title: { ...themeOpts.title, text: chartTitle },
                grid: themeOpts.grid,
                textStyle: themeOpts.textStyle,
                tooltip: {
                    ...themeOpts.tooltip,
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params) => {
                        const item = params[1]; // values series
                        const name = item.axisValue;
                        const value = parseFloat(item.value).toFixed(1);
                        return `${name}<br/>${value}%`;
                    }
                },
                xAxis: { ...themeOpts.xAxis, data: xAxisData },
                yAxis: themeOpts.yAxis,
                series: [
                    {
                        name: '辅助',
                        type: 'bar',
                        stack: 'total',
                        itemStyle: { color: 'transparent' },
                        emphasis: { itemStyle: { color: 'transparent' } },
                        data: helpers,
                        animation: false
                    },
                    {
                        name: '数值',
                        type: 'bar',
                        stack: 'total',
                        barWidth: '50%',
                        itemStyle: {
                            borderRadius: [5, 5, 0, 0]
                        },
                        label: {
                            show: true,
                            position: 'top',
                            fontFamily: themeOpts.textStyle.fontFamily,
                            fontSize: parseFloat(getCssVariable('--font-size-chart-xaxis')),
                            fontWeight: getCssVariable('--font-weight-bold'),
                            distance: 8,
                            padding: [5, 5, 5, 5],
                            formatter: (params) => `${parseFloat(params.value).toFixed(1)}%`
                        },
                        data: values.map((val, idx) => ({
                            value: val,
                            itemStyle: { color: colors[idx] },
                            label: { color: colors[idx] }
                        }))
                    }
                ]
            };
        }

        const CHART_META = {
            carAbsolute: { getter: d => d.car.absolute, title: '车险成本瀑布分析 (万元)', option: createAbsoluteChartOption },
            carRate: { getter: d => d.car.rate, title: '车险成本率瀑布分析 (%)', option: createRateChartOption },
            motoAbsolute: { getter: d => d.moto.absolute, title: '摩意险成本瀑布分析 (万元)', option: createAbsoluteChartOption },
            motoRate: { getter: d => d.moto.rate, title: '摩意险成本率瀑布分析 (%)', option: createRateChartOption },
            combinedAbsolute: { getter: d => d.combined.absolute, title: '综合成本瀑布分析 (万元)', option: createAbsoluteChartOption },
            combinedRate: { getter: d => d.combined.rate, title: '综合成本率瀑布分析 (%)', option: createRateChartOption }
        };
        const TAB_CHARTS = {
            car: ['carAbsolute', 'carRate'],
            moto: ['motoAbsolute', 'motoRate'],
            combined: ['combinedAbsolute', 'combinedRate']
        };

        function updateChartsForTab(tabKey, data) {
            const chartKeys = TAB_CHARTS[tabKey] || [];
            chartKeys.forEach(key => {
                const meta = CHART_META[key];
                const chart = EChartsInstances[key];
                if (chart && meta) {
                    chart.showLoading();
                    chart.clear();
                    chart.setOption(meta.option(meta.getter(data), meta.title), true);
                    chart.hideLoading();
                }
            });
        }
        
        function initCharts() {
            for (const key in APP_CONFIG.CHART_SELECTORS) {
                const chartDom = $(APP_CONFIG.CHART_SELECTORS[key]);
                if (chartDom) EChartsInstances[key] = echarts.init(chartDom);
            }
        }
        function disposeCharts() {
            for (const key in EChartsInstances) {
                if (EChartsInstances[key] && !EChartsInstances[key].isDisposed()) {
                    EChartsInstances[key].dispose();
                }
            }
        }
        // --- Data Export ---
        function exportDataToCSV() {
            const inputs = getCalculationInputs();
            const data = performCalculations(inputs);
            const breakEvenData = calculateBreakEvenAnalysis(inputs);

            let csvContent = '\ufeff';
            csvContent += '车+摩意险成本测算结果汇总表\n\n';

            // 第一部分：基本指标
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
                if (indicator.rateIndex !== undefined) { const rateArray = sectionData === data.combined.rate ? sectionData : sectionData.rate; return (rateArray[indicator.rateIndex] * 100).toFixed(1); }
                return '';
            }

            indicatorMap.forEach(indicator => {
                const row = [indicator.name, getValue(data.car, indicator), getValue(data.moto, indicator), getValue(indicator.isPercent ? data.combined.rate : data.combined, indicator)];
                csvContent += row.join(',') + '\n';
            });

            // 第二部分：瀑布图中间累计值（绝对值）
            csvContent += '\n二、成本瀑布分析(绝对值-万元)\n';
            csvContent += '瀑布节点,车险,摩意险,合计\n';

            // 计算固定成本
            const carFixedCost = parseFloat((data.car.absolute[5] - data.car.absolute[6]).toFixed(1));
            const motoFixedCost = parseFloat((data.moto.absolute[5] - data.moto.absolute[6]).toFixed(1));
            const totalFixedCost = parseFloat((data.combined.absolute[5] - data.combined.absolute[6]).toFixed(1));

            const waterfallAbsolute = [
                ['保费', data.car.absolute[0].toFixed(1), data.moto.absolute[0].toFixed(1), data.combined.absolute[0].toFixed(1)],
                ['赔款', data.car.absolute[1].toFixed(1), data.moto.absolute[1].toFixed(1), data.combined.absolute[1].toFixed(1)],
                ['手续费', data.car.absolute[2].toFixed(1), data.moto.absolute[2].toFixed(1), data.combined.absolute[2].toFixed(1)],
                ['销推费用', data.car.absolute[3].toFixed(1), data.moto.absolute[3].toFixed(1), data.combined.absolute[3].toFixed(1)],
                ['人力成本', data.car.absolute[4].toFixed(1), data.moto.absolute[4].toFixed(1), data.combined.absolute[4].toFixed(1)],
                ['边际贡献', data.car.absolute[5].toFixed(1), data.moto.absolute[5].toFixed(1), data.combined.absolute[5].toFixed(1)],
                ['固定成本', carFixedCost.toFixed(1), motoFixedCost.toFixed(1), totalFixedCost.toFixed(1)],
                ['利润', data.car.absolute[6].toFixed(1), data.moto.absolute[6].toFixed(1), data.combined.absolute[6].toFixed(1)]
            ];
            waterfallAbsolute.forEach(row => csvContent += row.join(',') + '\n');

            // 第三部分：瀑布图中间累计值（比率）
            csvContent += '\n三、成本瀑布分析(比率-%)\n';
            csvContent += '瀑布节点,车险,摩意险,合计\n';

            const carFixedCostRate = ((data.car.rate[0] - data.car.rate[1]) * 100).toFixed(1);
            const motoFixedCostRate = ((data.moto.rate[0] - data.moto.rate[1]) * 100).toFixed(1);
            const totalFixedCostRate = ((data.combined.rate[0] - data.combined.rate[1]) * 100).toFixed(1);

            const waterfallRate = [
                ['保费基准', '100.0', '100.0', '100.0'],
                ['赔付率', (data.car.rate[2] * 100).toFixed(1), (data.moto.rate[2] * 100).toFixed(1), (data.combined.rate[2] * 100).toFixed(1)],
                ['手续费率', (data.car.rate[3] * 100).toFixed(1), (data.moto.rate[3] * 100).toFixed(1), (data.combined.rate[3] * 100).toFixed(1)],
                ['销推费率', (data.car.rate[4] * 100).toFixed(1), (data.moto.rate[4] * 100).toFixed(1), (data.combined.rate[4] * 100).toFixed(1)],
                ['人力成本率', (data.car.rate[5] * 100).toFixed(1), (data.moto.rate[5] * 100).toFixed(1), (data.combined.rate[5] * 100).toFixed(1)],
                ['变动成本率', (data.car.rate[1] * 100).toFixed(1), (data.moto.rate[1] * 100).toFixed(1), (data.combined.rate[1] * 100).toFixed(1)],
                ['固定成本率', carFixedCostRate, motoFixedCostRate, totalFixedCostRate],
                ['综合成本率', (data.car.rate[0] * 100).toFixed(1), (data.moto.rate[0] * 100).toFixed(1), (data.combined.rate[0] * 100).toFixed(1)],
                ['利润率', ((1 - data.car.rate[0]) * 100).toFixed(1), ((1 - data.moto.rate[0]) * 100).toFixed(1), ((1 - data.combined.rate[0]) * 100).toFixed(1)]
            ];
            waterfallRate.forEach(row => csvContent += row.join(',') + '\n');

            // 第四部分：盈亏平衡分析
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

        // --- Core Update Cycle & Event Listeners (mostly same) ---
        function updateUI() {
            const inputs = getCalculationInputs();
            const calculatedData = performCalculations(inputs);
            const breakEvenData = calculateBreakEvenAnalysis(inputs);
            lastCalculatedData = calculatedData;
            updateKPIs(calculatedData);
            updateChartsForTab(getActiveTab(), calculatedData);
            updateContextInsight(calculatedData, breakEvenData);
            updateThemeLabel();
            updateMotoPremiumRatioDisplay();
        }
        function bindEventListeners() {
            DOMElements.themeToggleBtn.addEventListener('click', toggleTheme);
            DOMElements.openParametersBtn.addEventListener('click', () => toggleParametersDrawer(true));
            if (DOMElements.openParametersBtnSecondary) DOMElements.openParametersBtnSecondary.addEventListener('click', () => toggleParametersDrawer(true));
            DOMElements.closeParametersBtn.addEventListener('click', () => toggleParametersDrawer(false));
            DOMElements.drawerBackdrop.addEventListener('click', () => toggleParametersDrawer(false));
            DOMElements.showHelpBtn.addEventListener('click', () => toggleHelpModal(true));
            DOMElements.closeHelpModalBtn.addEventListener('click', () => toggleHelpModal(false));
            DOMElements.helpModal.addEventListener('click', (e) => { if (e.target === DOMElements.helpModal) toggleHelpModal(false); });
            DOMElements.schemeSelector.addEventListener('click', handleSchemeChange);
            DOMElements.exportDataBtn.addEventListener('click', exportDataToCSV);
            DOMElements.analysisTabsContainer.addEventListener('click', handleAnalysisTabClick);
            if (DOMElements.focusOnProfitBtn) DOMElements.focusOnProfitBtn.addEventListener('click', focusOnProfitCard);
            const debouncedUpdate = debounce(updateUI, 300);
            for (const key in DOMElements.inputs) {
                DOMElements.inputs[key].addEventListener('focus', storeCurrentInputValues);
                DOMElements.inputs[key].addEventListener('input', debouncedUpdate);
                DOMElements.inputs[key].addEventListener('change', () => { highlightChangedParameters(); updateUI(); });
            }
            window.addEventListener('resize', () => {
                for (const key in EChartsInstances) {
                    if (EChartsInstances[key] && typeof EChartsInstances[key].resize === 'function') EChartsInstances[key].resize();
                }
            });
            window.addEventListener('beforeunload', disposeCharts);
        }
        
        // --- Initialization ---
        function init() {
            cacheDOMElements();
            loadSavedTheme();
            initCharts();
            initParameterTableCollapse();
            setupInputAutoFocus();
            bindEventListeners();
            storeCurrentInputValues();
            applyScheme(DEFAULT_SCHEME_KEY);
            const defaultSchemeBtn = $(`#schemeSelector .btn[data-scheme="${DEFAULT_SCHEME_KEY}"]`);
            if (defaultSchemeBtn) defaultSchemeBtn.classList.add('is-active');
            setActiveAnalysisTab(DEFAULT_ANALYSIS_TAB);
        }
        return { init };
    })();
    document.addEventListener('DOMContentLoaded', CostInsightPro.init);
