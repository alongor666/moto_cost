    // --- CostInsightPro Application Module ---
    const CostInsightPro = (() => {
        const DOMElements = {}; 
        const EChartsInstances = {};
        let currentInputValues = {};
        const DEFAULT_SCHEME_KEY = '120.8';
        const DEFAULT_ANALYSIS_TAB = 'combined';
        const APP_CONFIG = {
            THEME_STORAGE_KEY: 'costInsightProTheme',
            INDICATOR_CONFIG: { // UPDATED LABELS
                PREMIUM: { label: '保费', colorKey: 'neutral', isRate: false },
                LOSS: { label: '赔款', colorKey: 'neutral', isRate: false },
                HANDLING_FEE: { label: '手续费', colorKey: 'neutral', isRate: false },
                SALES_PROMOTION: { label: '销推费用', colorKey: 'neutral', isRate: false },
                LABOR_COST: { label: '人力成本', colorKey: 'neutral', isRate: false },
                EDGE_CONTRIBUTION: { label: '边际贡献额', colorKey: 'conditional', isRate: false, positiveGood: true },
                PROFIT: { label: '利润', colorKey: 'conditional', isRate: false, positiveGood: true },
                TCR: { label: '综合成本率', colorKey: 'conditional', isRate: true, threshold: 1, higherIsWorse: true },
                VCR: { label: '变动成本率', colorKey: 'conditional', isRate: true, threshold: 0.9, higherIsWorse: true },
                LOSS_RATIO: { label: '赔付率', colorKey: 'neutral', isRate: true },
                HANDLING_FEE_RATIO: { label: '手续费率', colorKey: 'neutral', isRate: true },
                SALES_PROMOTION_RATIO: { label: '销推费用率', colorKey: 'neutral', isRate: true },
                LABOR_COST_RATIO: { label: '人力成本率', colorKey: 'neutral', isRate: true },
                EDGE_CONTRIBUTION_RATIO: { label: '边际贡献率', colorKey: 'conditional', isRate: true, positiveGood: true }
            },
            ABSOLUTE_CHART_INDICATORS: ['PREMIUM', 'LOSS', 'HANDLING_FEE', 'SALES_PROMOTION', 'LABOR_COST', 'EDGE_CONTRIBUTION', 'PROFIT'],
            RATE_CHART_INDICATORS: ['TCR', 'VCR', 'LOSS_RATIO', 'HANDLING_FEE_RATIO', 'SALES_PROMOTION_RATIO', 'LABOR_COST_RATIO', 'EDGE_CONTRIBUTION_RATIO'],
            SCHEMES: { /* Same as before */ 
                '150': { name: '方案A', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1200, carLossRatio: 150, carHandlingFeeRate: 0, carSalesPromotionRate: 0.15, carStandardPremiumRatio: 0.5, motoPremiumRatio: 1.75, motoLossRatio: 4, motoHandlingFeeRate: 66.1, motoSalesPromotionRate: 0.74, motoStandardPremiumRatio: 1.8 }},
                '135': { name: '方案B', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1200, carLossRatio: 135, carHandlingFeeRate: 0, carSalesPromotionRate: 0.15, carStandardPremiumRatio: 0.5, motoPremiumRatio: 1.75, motoLossRatio: 4, motoHandlingFeeRate: 66.1, motoSalesPromotionRate: 0.74, motoStandardPremiumRatio: 1.8 }},
                '120.8': { name: '方案C (保本)', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1200, carLossRatio: 120.8, carHandlingFeeRate: 0, carSalesPromotionRate: 0.15, carStandardPremiumRatio: 0.5, motoPremiumRatio: 1.75, motoLossRatio: 4, motoHandlingFeeRate: 66.1, motoSalesPromotionRate: 0.74, motoStandardPremiumRatio: 1.8 }},
                '110': { name: '方案D', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1200, carLossRatio: 110, carHandlingFeeRate: 0, carSalesPromotionRate: 0.15, carStandardPremiumRatio: 0.5, motoPremiumRatio: 1.75, motoLossRatio: 4, motoHandlingFeeRate: 66.1, motoSalesPromotionRate: 0.74, motoStandardPremiumRatio: 1.8 }}
            },
            INPUT_SELECTORS: { /* Same as before */
                laborBaseRate: '#laborBaseRate', fixedOperationRate: '#fixedOperationRate', carPremium: '#carPremium', carLossRatio: '#carLossRatio', carHandlingFeeRate: '#carHandlingFeeRate', carSalesPromotionRate: '#carSalesPromotionRate', carStandardPremiumRatio: '#carStandardPremiumRatio', motoPremiumRatio: '#motoPremiumRatio', motoLossRatio: '#motoLossRatio', motoHandlingFeeRate: '#motoHandlingFeeRate', motoSalesPromotionRate: '#motoSalesPromotionRate', motoStandardPremiumRatio: '#motoStandardPremiumRatio',
            },
            CHART_SELECTORS: { /* Same as before */
                combinedAbsolute: '#combinedAbsoluteChart', combinedRate: '#combinedRateChart', carAbsolute: '#carAbsoluteChart', carRate: '#carRateChart', motoAbsolute: '#motoAbsoluteChart', motoRate: '#motoRateChart',
             },
            KPI_SELECTORS: { /* Same as before */
                totalProfit: '#kpiTotalProfit', totalCostRate: '#kpiTotalCostRate', totalPremium: '#kpiTotalPremium', totalEdgeContribution: '#kpiTotalEdgeContribution',
            }
        };

        // --- Utilities ---
        const $ = (s) => document.querySelector(s);
        const $$ = (s) => document.querySelectorAll(s);
        const getInputValue = (id) => parseFloat(DOMElements.inputs[id].value) || 0;
        const getInputValueAsRate = (id) => (parseFloat(DOMElements.inputs[id].value) / 100) || 0;
        const getCssVariable = (varName) => getComputedStyle(DOMElements.html).getPropertyValue(varName).trim();

        // --- DOM Cache, Theme, Drawer, Modal, Scheme, Tabs (mostly same logic as before) ---
        function cacheDOMElements() { /* ... same as before ... */ 
            DOMElements.html = $('html'); DOMElements.themeToggleBtn = $('#themeToggleBtn'); DOMElements.parametersDrawer = $('#parametersDrawer'); DOMElements.openParametersBtn = $('#openParametersBtn'); DOMElements.closeParametersBtn = $('#closeParametersBtn'); DOMElements.drawerBackdrop = $('#drawerBackdrop'); DOMElements.helpModal = $('#indicatorHelpModal'); DOMElements.showHelpBtn = $('#showHelpBtn'); DOMElements.closeHelpModalBtn = $('#closeHelpModalBtn'); DOMElements.schemeSelector = $('#schemeSelector'); DOMElements.exportDataBtn = $('#exportDataBtn'); DOMElements.analysisTabsContainer = $('#analysisTabsContainer');
            DOMElements.inputs = {}; for (const key in APP_CONFIG.INPUT_SELECTORS) DOMElements.inputs[key] = $(APP_CONFIG.INPUT_SELECTORS[key]);
            DOMElements.kpis = {}; for (const key in APP_CONFIG.KPI_SELECTORS) DOMElements.kpis[key] = $(APP_CONFIG.KPI_SELECTORS[key]);
        }
        function applyTheme(theme) { DOMElements.html.classList.remove('theme-light', 'theme-dark'); DOMElements.html.classList.add(`theme-${theme}`); localStorage.setItem(APP_CONFIG.THEME_STORAGE_KEY, theme); updateUI(); }
        function toggleTheme() { const currentTheme = DOMElements.html.classList.contains('theme-dark') ? 'dark' : 'light'; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
        function loadSavedTheme() { const savedTheme = localStorage.getItem(APP_CONFIG.THEME_STORAGE_KEY) || 'dark'; DOMElements.html.classList.remove('theme-light', 'theme-dark'); DOMElements.html.classList.add(`theme-${savedTheme}`); }
        function toggleParametersDrawer(forceOpen) { const isOpen = DOMElements.parametersDrawer.classList.contains('is-open'); const openDrawer = typeof forceOpen === 'boolean' ? forceOpen : !isOpen; if (openDrawer) { DOMElements.parametersDrawer.classList.add('is-open'); DOMElements.drawerBackdrop.classList.add('is-visible'); document.body.style.overflow = 'hidden'; } else { DOMElements.parametersDrawer.classList.remove('is-open'); DOMElements.drawerBackdrop.classList.remove('is-visible'); if (!DOMElements.helpModal.classList.contains('is-visible')) { document.body.style.overflow = ''; } } }
        function toggleHelpModal(show) { if (show) { DOMElements.helpModal.classList.add('is-visible'); document.body.style.overflow = 'hidden'; } else { DOMElements.helpModal.classList.remove('is-visible'); if (!DOMElements.parametersDrawer.classList.contains('is-open')) { document.body.style.overflow = ''; } } }
        function storeCurrentInputValues() { currentInputValues = {}; for (const key in DOMElements.inputs) currentInputValues[key] = DOMElements.inputs[key].value; }
        function highlightChangedParameters() { for (const key in DOMElements.inputs) { const inputElement = DOMElements.inputs[key]; inputElement.classList.remove('form-field__input--highlight'); if (inputElement.value !== currentInputValues[key]) { inputElement.classList.add('form-field__input--highlight'); inputElement.addEventListener('animationend', () => inputElement.classList.remove('form-field__input--highlight'), { once: true }); } } }
        function applyScheme(schemeKey) { storeCurrentInputValues(); const scheme = APP_CONFIG.SCHEMES[schemeKey]; if (!scheme || !scheme.params) return; for (const key in scheme.params) if (DOMElements.inputs[key]) DOMElements.inputs[key].value = scheme.params[key]; updateUI(); toggleParametersDrawer(true); requestAnimationFrame(() => requestAnimationFrame(highlightChangedParameters)); }
        function handleSchemeChange(event) { const targetButton = event.target.closest('.btn'); if (!targetButton || !targetButton.dataset.scheme) return; const schemeKey = targetButton.dataset.scheme; applyScheme(schemeKey); $$('#schemeSelector .btn').forEach(btn => btn.classList.remove('is-active')); targetButton.classList.add('is-active'); }
        function handleAnalysisTabClick(event) { const targetButton = event.target.closest('.analysis-tab-btn'); if (!targetButton || !targetButton.dataset.tab) return; const tabKey = targetButton.dataset.tab; $$('.analysis-tab-btn').forEach(btn => btn.classList.remove('is-active')); $$('.analysis-content').forEach(content => content.classList.remove('is-active')); targetButton.classList.add('is-active'); const activeContent = $(`#analysisContent${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`); if (activeContent) activeContent.classList.add('is-active'); ['Absolute', 'Rate'].forEach(type => { const chartKey = `${tabKey}${type}`; if (EChartsInstances[chartKey] && typeof EChartsInstances[chartKey].resize === 'function') setTimeout(() => EChartsInstances[chartKey].resize(), 50); }); }
        function setActiveAnalysisTab(tabKey) { const tabButton = $(`#analysisTabsContainer .analysis-tab-btn[data-tab="${tabKey}"]`); if (tabButton) tabButton.click(); }
        
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
                motoPremiumRatio: getInputValue('motoPremiumRatio'), motoLossRatio: getInputValueAsRate('motoLossRatio'), motoHandlingFeeRate: getInputValueAsRate('motoHandlingFeeRate'), motoSalesPromotionRate: getInputValueAsRate('motoSalesPromotionRate'), motoStandardPremiumRatio: getInputValue('motoStandardPremiumRatio'),
                laborBaseRate: getInputValueAsRate('laborBaseRate'), fixedOperationRate: getInputValueAsRate('fixedOperationRate'),
            };
        }
        function performCalculations(inputs) { /* ... */
             const { carPremium, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carStandardPremiumRatio, motoPremiumRatio, motoLossRatio, motoHandlingFeeRate, motoSalesPromotionRate, motoStandardPremiumRatio, laborBaseRate, fixedOperationRate } = inputs;
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
            const indicators = APP_CONFIG.ABSOLUTE_CHART_INDICATORS;
            const xAxisData = indicators.map(key => APP_CONFIG.INDICATOR_CONFIG[key].label);

            const seriesData = data.map((value, index) => {
                const indicatorKey = indicators[index];
                const config = APP_CONFIG.INDICATOR_CONFIG[indicatorKey];
                const val = parseFloat(value.toFixed(1)); // Store with 1 decimal for consistency
                
                let itemColor = determineColor(val, config, themeOpts);
                if ((itemColor === themeOpts.colorNeutral && config.colorKey !== 'neutral') || (itemColor === themeOpts.colorAccent && config.colorKey !== 'accent' && config.colorKey !== 'conditional')) {
                    itemColor = themeOpts.colorPalette[index % themeOpts.colorPalette.length];
                }
                let labelColor = itemColor;

                return {
                    value: val, itemStyle: { ...themeOpts.seriesBase.itemStyle, color: itemColor },
                    label: { 
                        ...themeOpts.seriesBase.label, 
                        color: labelColor, 
                        position: val < 0 ? 'bottom' : 'top', 
                        distance: val < 0 ? 15 : 8, // 增加负值标签的距离
                        padding: [5, 5, 5, 5] // 增加内边距
                    }
                };
            });

            return {
                title: { ...themeOpts.title, text: chartTitle },
                grid: themeOpts.grid, textStyle: themeOpts.textStyle, tooltip: { ...themeOpts.tooltip, valueFormatter: value => `${value != null ? parseFloat(value).toFixed(1) : 'N/A'} ${unit}` },
                xAxis: { ...themeOpts.xAxis, data: xAxisData, axisLabel: {...themeOpts.xAxis.axisLabel, color: (value, index) => seriesData[index].label.color } },
                yAxis: themeOpts.yAxis, 
                series: [{ ...themeOpts.seriesBase, data: seriesData }]
            };
        }

        function createRateChartOption(data, chartTitle) {
            const themeOpts = getChartThemeOptions();
            const indicators = APP_CONFIG.RATE_CHART_INDICATORS;
            const xAxisData = indicators.map(key => APP_CONFIG.INDICATOR_CONFIG[key].label);

            const seriesData = data.map((value, index) => {
                const indicatorKey = indicators[index];
                const config = APP_CONFIG.INDICATOR_CONFIG[indicatorKey];
                const valPct = parseFloat((value * 100).toFixed(1)); // Store with 1 decimal
                
                let itemColor = determineColor(value, config, themeOpts);
                if ((itemColor === themeOpts.colorNeutral && config.colorKey !== 'neutral') || (itemColor === themeOpts.colorAccent && config.colorKey !== 'accent' && config.colorKey !== 'conditional')) {
                    itemColor = themeOpts.colorPalette[index % themeOpts.colorPalette.length];
                }
                let labelColor = itemColor;

                return {
                    value: valPct, itemStyle: { ...themeOpts.seriesBase.itemStyle, color: itemColor },
                    label: {
                        ...themeOpts.seriesBase.label,
                        color: labelColor,
                        position: valPct < 0 && config.positiveGood ? 'bottom' : 'top',
                        distance: valPct < 0 && config.positiveGood ? 15 : 8, // 增加负值标签的距离
                        formatter: (params) => `${parseFloat(params.value).toFixed(1)}%`,
                        padding: [5, 5, 5, 5] // 增加内边距
                    }
                };
            });
            
            return {
                title: { ...themeOpts.title, text: chartTitle },
                grid: themeOpts.grid, textStyle: themeOpts.textStyle, tooltip: { ...themeOpts.tooltip, valueFormatter: value => `${value != null ? parseFloat(value).toFixed(1) : 'N/A'}%` },
                xAxis: { ...themeOpts.xAxis, data: xAxisData, axisLabel: {...themeOpts.xAxis.axisLabel, color: (value, index) => seriesData[index].label.color } },
                yAxis: themeOpts.yAxis,
                series: [{ ...themeOpts.seriesBase, data: seriesData }]
            };
        }
        
        function initCharts() { /* ... same as before ... */ 
            for (const key in APP_CONFIG.CHART_SELECTORS) { const chartDom = $(APP_CONFIG.CHART_SELECTORS[key]); if (chartDom) EChartsInstances[key] = echarts.init(chartDom); }
        }
        function updateAllCharts(data) { /* ... same as before, but pass chart titles ... */
            const setOpt = (key, optionFn, dataArg, title) => { if (EChartsInstances[key] && typeof EChartsInstances[key].setOption === 'function') { EChartsInstances[key].clear(); EChartsInstances[key].setOption(optionFn(dataArg, title), true); } else { console.warn(`Chart instance for ${key} is not available.`); } };
            setOpt('carAbsolute', createAbsoluteChartOption, data.car.absolute, '关键指标金额 (万元)'); setOpt('carRate', createRateChartOption, data.car.rate, '核心效能比率 (%)'); 
            setOpt('motoAbsolute', createAbsoluteChartOption, data.moto.absolute, '关键指标金额 (万元)'); setOpt('motoRate', createRateChartOption, data.moto.rate, '核心效能比率 (%)'); 
            setOpt('combinedAbsolute', createAbsoluteChartOption, data.combined.absolute, '关键指标金额 (万元)'); setOpt('combinedRate', createRateChartOption, data.combined.rate, '核心效能比率 (%)');
        }

        // --- Data Export ---
        function exportDataToCSV() { /* ... Adjusted for 1 decimal place ... */
            const inputs = getCalculationInputs(); const data = performCalculations(inputs); let csvContent = '\ufeff'; csvContent += '车+摩意险成本测算结果汇总表\n\n'; csvContent += '指标分类,车险,摩意险,合计\n';
            const indicatorMap = [ { name: '保费(万元)', absoluteIndex: 0 }, { name: '赔款(万元)', absoluteIndex: 1 }, { name: '手续费(万元)', absoluteIndex: 2 }, { name: '销推费用(万元)', absoluteIndex: 3 }, { name: '人力成本(万元)', absoluteIndex: 4 }, { name: '边际贡献额(万元)', absoluteIndex: 5 }, { name: '利润(万元)', absoluteIndex: 6 }, { name: '综合成本率(%)', rateIndex: 0, isPercent: true }, { name: '变动成本率(%)', rateIndex: 1, isPercent: true }, { name: '赔付率(%)', rateIndex: 2, isPercent: true }, { name: '边际贡献率(%)', rateIndex: 6, isPercent: true } ];
            function getValue(sectionData, indicator) { 
                if (indicator.absoluteIndex !== undefined) return sectionData.absolute[indicator.absoluteIndex].toFixed(1); 
                if (indicator.rateIndex !== undefined) { const rateArray = sectionData === data.combined.rate ? sectionData : sectionData.rate; return (rateArray[indicator.rateIndex] * 100).toFixed(1); } return ''; 
            }
            indicatorMap.forEach(indicator => { const row = [indicator.name, getValue(data.car, indicator), getValue(data.moto, indicator), getValue(indicator.isPercent ? data.combined.rate : data.combined, indicator)]; csvContent += row.join(',') + '\n'; });
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = '成本洞察Pro_测算结果.csv'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }

        // --- Core Update Cycle & Event Listeners (mostly same) ---
        function updateUI() { const inputs = getCalculationInputs(); const calculatedData = performCalculations(inputs); updateKPIs(calculatedData); updateAllCharts(calculatedData); }
        function bindEventListeners() { DOMElements.themeToggleBtn.addEventListener('click', toggleTheme); DOMElements.openParametersBtn.addEventListener('click', () => toggleParametersDrawer(true)); DOMElements.closeParametersBtn.addEventListener('click', () => toggleParametersDrawer(false)); DOMElements.drawerBackdrop.addEventListener('click', () => toggleParametersDrawer(false)); DOMElements.showHelpBtn.addEventListener('click', () => toggleHelpModal(true)); DOMElements.closeHelpModalBtn.addEventListener('click', () => toggleHelpModal(false)); DOMElements.helpModal.addEventListener('click', (e) => { if (e.target === DOMElements.helpModal) toggleHelpModal(false); }); DOMElements.schemeSelector.addEventListener('click', handleSchemeChange); DOMElements.exportDataBtn.addEventListener('click', exportDataToCSV); DOMElements.analysisTabsContainer.addEventListener('click', handleAnalysisTabClick); for (const key in DOMElements.inputs) { DOMElements.inputs[key].addEventListener('focus', storeCurrentInputValues); DOMElements.inputs[key].addEventListener('input', updateUI); DOMElements.inputs[key].addEventListener('change', () => { highlightChangedParameters(); updateUI(); }); } window.addEventListener('resize', () => { for (const key in EChartsInstances) if (EChartsInstances[key] && typeof EChartsInstances[key].resize === 'function') EChartsInstances[key].resize(); }); }
        
        // --- Initialization ---
        function init() { cacheDOMElements(); loadSavedTheme(); initCharts(); bindEventListeners(); storeCurrentInputValues(); applyScheme(DEFAULT_SCHEME_KEY); const defaultSchemeBtn = $(`#schemeSelector .btn[data-scheme="${DEFAULT_SCHEME_KEY}"]`); if (defaultSchemeBtn) defaultSchemeBtn.classList.add('is-active'); setActiveAnalysisTab(DEFAULT_ANALYSIS_TAB); }
        return { init };
    })();
    document.addEventListener('DOMContentLoaded', CostInsightPro.init);
