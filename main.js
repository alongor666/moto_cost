    // --- CostInsightPro Application Module ---
    const CostInsightPro = (() => {
        const DOMElements = {};
        const VALIDATION_RULES = {
            laborBaseRate: { min: 0, max: 150, warningHigh: 60, dangerHigh: 100, label: '人力成本率' },
            fixedOperationRate: { min: 0, max: 50, warningHigh: 15, dangerHigh: 25, label: '固定运营成本率' },
            carPremium: { min: 0, max: 5000, warningLow: 200, label: '车险保费(万元)' },
            carLossRatio: { min: 0, max: 200, warningHigh: 110, dangerHigh: 130, label: '车险赔付率' },
            carHandlingFeeRate: { min: 0, max: 50, warningHigh: 20, dangerHigh: 35, label: '车险手续费率' },
            carSalesPromotionRate: { min: 0, max: 30, warningHigh: 10, dangerHigh: 20, label: '车险销推费用率' },
            carStandardPremiumRatio: { min: 0, max: 5, warningHigh: 2, dangerHigh: 3, label: '车险标保系数' },
            carAveragePremium: { min: 0, max: 500, warningLow: 60, label: '车险单均保费(元)' },
            motoAveragePremium: { min: 0, max: 500, warningLow: 50, label: '摩意险件均保费(元)' },
            motoQuantity: { min: 0, max: 10, warningHigh: 5, label: '摩意险份数' },
            motoLossRatio: { min: 0, max: 200, warningHigh: 80, dangerHigh: 120, label: '摩意险赔付率' },
            motoWithCarFeeRate: { min: 0, max: 150, warningHigh: 90, dangerHigh: 120, label: '随车费用率' },
            motoCardFeeRate: { min: 0, max: 150, warningHigh: 90, dangerHigh: 120, label: '卡单费用率' },
            motoSalesPromotionRate: { min: 0, max: 30, warningHigh: 10, dangerHigh: 20, label: '摩意险销推费用率' },
            motoStandardPremiumRatio: { min: 0, max: 5, warningHigh: 2.5, dangerHigh: 3.5, label: '摩意险标保系数' }
        };
        const CONVERSION_LABELS = {
            laborBaseRate: '人力成本基数',
            fixedOperationRate: '固定运营成本率',
            carLossRatio: '车险赔付率',
            carHandlingFeeRate: '车险手续费率',
            carSalesPromotionRate: '车险销推费用率',
            carStandardPremiumRatio: '车险标保系数',
            motoLossRatio: '摩意险赔付率',
            motoWithCarFeeRate: '随车业务费用率',
            motoCardFeeRate: '卡单费用率',
            motoSalesPromotionRate: '摩意险销推费用率',
            motoStandardPremiumRatio: '摩意险标保系数'
        };
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
            DOMElements.html = $('html'); DOMElements.themeToggleBtn = $('#themeToggleBtn'); DOMElements.parametersDrawer = $('#parametersDrawer'); DOMElements.openParametersBtn = $('#openParametersBtn'); DOMElements.closeParametersBtn = $('#closeParametersBtn'); DOMElements.drawerBackdrop = $('#drawerBackdrop'); DOMElements.helpModal = $('#indicatorHelpModal'); DOMElements.showHelpBtn = $('#showHelpBtn'); DOMElements.closeHelpModalBtn = $('#closeHelpModalBtn'); DOMElements.schemeSelector = $('#schemeSelector'); DOMElements.drawerSchemeSelector = $('#drawerSchemeSelector'); DOMElements.exportDataBtn = $('#exportDataBtn'); DOMElements.analysisTabsContainer = $('#analysisTabsContainer');
            DOMElements.activeSchemeLabel = $('#activeSchemeLabel'); DOMElements.activeThemeLabel = $('#activeThemeLabel'); DOMElements.insightSummary = $('#insightSummary');
            DOMElements.summaryHeadline = $('#summaryHeadline'); DOMElements.summarySubline = $('#summarySubline'); DOMElements.focusOnProfitBtn = $('#focusOnProfitBtn'); DOMElements.openParametersBtnSecondary = $('#openParametersBtnSecondary'); DOMElements.resetParametersBtn = $('#resetParametersBtn'); DOMElements.applyParametersBtn = $('#applyParametersBtn');
            DOMElements.motoPremiumRatioDisplay = $('#motoPremiumRatioDisplay');
            DOMElements.toggleAllCardsBtn = $('#toggleAllCardsBtn');
            DOMElements.inputs = {}; for (const key in APP_CONFIG.INPUT_SELECTORS) DOMElements.inputs[key] = $(APP_CONFIG.INPUT_SELECTORS[key]);
            DOMElements.statusChips = {}; $$('.status-chip').forEach(chip => { if (chip.dataset.field) DOMElements.statusChips[chip.dataset.field] = chip; });
            DOMElements.kpis = {}; for (const key in APP_CONFIG.KPI_SELECTORS) DOMElements.kpis[key] = $(APP_CONFIG.KPI_SELECTORS[key]);
        }

        // --- 参数卡片折叠展开功能 ---
        function initParameterCardsCollapse() {
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

        // --- 输入辅助：默认填充、步进与校验 ---
        function clampValue(value, min, max) {
            let result = value;
            if (!isNaN(min)) result = Math.max(min, result);
            if (!isNaN(max)) result = Math.min(max, result);
            return result;
        }

        function evaluateValidation(fieldId, value) {
            const rule = VALIDATION_RULES[fieldId];
            if (!rule) return { status: 'neutral', message: '' };
            if (isNaN(value)) return { status: 'error', message: '请输入数值' };

            if (!isNaN(rule.min) && value < rule.min) return { status: 'error', message: `低于下限 ${rule.min}` };
            if (!isNaN(rule.max) && value > rule.max) return { status: 'error', message: `高于上限 ${rule.max}` };

            if (!isNaN(rule.warningLow) && value < rule.warningLow) return { status: 'warning', message: `低于建议值 ${rule.warningLow}` };
            if (!isNaN(rule.warningHigh) && value > rule.warningHigh) return { status: 'warning', message: `高于建议值 ${rule.warningHigh}` };
            if (!isNaN(rule.dangerHigh) && value > rule.dangerHigh) return { status: 'error', message: `超出阈值 ${rule.dangerHigh}` };

            return { status: 'success', message: '在合理区间' };
        }

        function updateStatus(fieldId, result) {
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

        function validateField(fieldId) {
            const input = DOMElements.inputs[fieldId];
            if (!input) return;
            const value = parseFloat(input.value);
            const result = evaluateValidation(fieldId, value);
            updateStatus(fieldId, result);
        }

        function validateAllInputs() {
            Object.keys(DOMElements.inputs).forEach(validateField);
        }

        function setupDefaultFillers() {
            $$('.fill-default-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.target;
                    const input = DOMElements.inputs[target];
                    const defaultValue = btn.closest('.default-cell')?.querySelector('.default-value')?.dataset.default;
                    if (input && defaultValue !== undefined) {
                        input.value = defaultValue;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
            });
        }

        function setupSteppers() {
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

        function updateConversionHints() {
            Object.keys(DOMElements.inputs).forEach(key => {
                const value = parseFloat(DOMElements.inputs[key].value);
                const hintEl = document.querySelector(`#${key}Conversion`);
                if (!hintEl) return;
                if (isNaN(value)) { hintEl.textContent = ''; return; }

                if (CONVERSION_LABELS[key]) {
                    const factor = VALIDATION_RULES[key]?.label?.includes('费') || VALIDATION_RULES[key]?.label?.includes('率')
                        ? value / 100
                        : value;
                    hintEl.textContent = `= ${factor.toFixed(2)}x ${CONVERSION_LABELS[key]}`;
                }
            });

            const carAvg = getInputValue('carAveragePremium');
            const motoAvg = getInputValue('motoAveragePremium');
            const qty = getInputValue('motoQuantity');
            const ratio = carAvg > 0 ? (motoAvg * qty) / carAvg : 0;
            const ratioText = carAvg > 0 ? `= ${ratio.toFixed(2)}x 保费配比` : '';
            ['carAveragePremiumConversion', 'motoAveragePremiumConversion', 'motoQuantityConversion'].forEach(id => {
                const el = document.querySelector(`#${id}`);
                if (el) el.textContent = ratioText;
            });
            const motoPremiumRatioEl = document.querySelector('#motoPremiumRatioConversion');
            if (motoPremiumRatioEl) motoPremiumRatioEl.textContent = ratioText;
        }
        function applyTheme(theme) { DOMElements.html.classList.remove('theme-light', 'theme-dark'); DOMElements.html.classList.add(`theme-${theme}`); localStorage.setItem(APP_CONFIG.THEME_STORAGE_KEY, theme); updateUI(); }
        function toggleTheme() { const currentTheme = DOMElements.html.classList.contains('theme-dark') ? 'dark' : 'light'; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
        function loadSavedTheme() { const savedTheme = localStorage.getItem(APP_CONFIG.THEME_STORAGE_KEY) || 'dark'; DOMElements.html.classList.remove('theme-light', 'theme-dark'); DOMElements.html.classList.add(`theme-${savedTheme}`); }
        function toggleParametersDrawer(forceOpen) { const isOpen = DOMElements.parametersDrawer.classList.contains('is-open'); const openDrawer = typeof forceOpen === 'boolean' ? forceOpen : !isOpen; if (openDrawer) { DOMElements.parametersDrawer.classList.add('is-open'); DOMElements.drawerBackdrop.classList.add('is-visible'); document.body.style.overflow = 'hidden'; } else { DOMElements.parametersDrawer.classList.remove('is-open'); DOMElements.drawerBackdrop.classList.remove('is-visible'); if (!DOMElements.helpModal.classList.contains('is-visible')) { document.body.style.overflow = ''; } } }
        function toggleHelpModal(show) { if (show) { DOMElements.helpModal.classList.add('is-visible'); document.body.style.overflow = 'hidden'; } else { DOMElements.helpModal.classList.remove('is-visible'); if (!DOMElements.parametersDrawer.classList.contains('is-open')) { document.body.style.overflow = ''; } } }
        function storeCurrentInputValues() { currentInputValues = {}; for (const key in DOMElements.inputs) currentInputValues[key] = DOMElements.inputs[key].value; }
        function highlightChangedParameters() { for (const key in DOMElements.inputs) { const inputElement = DOMElements.inputs[key]; inputElement.classList.remove('form-field__input--highlight'); if (inputElement.value !== currentInputValues[key]) { inputElement.classList.add('form-field__input--highlight'); inputElement.addEventListener('animationend', () => inputElement.classList.remove('form-field__input--highlight'), { once: true }); } } }
        function applyScheme(schemeKey) { storeCurrentInputValues(); const scheme = APP_CONFIG.SCHEMES[schemeKey]; if (!scheme || !scheme.params) return; for (const key in scheme.params) if (DOMElements.inputs[key]) DOMElements.inputs[key].value = scheme.params[key]; updateUI(); toggleParametersDrawer(true); requestAnimationFrame(() => requestAnimationFrame(highlightChangedParameters)); setActiveSchemeLabel(schemeKey); setActiveSchemeButtons(schemeKey); }
        function handleSchemeChange(event) { const targetButton = event.target.closest('.btn'); if (!targetButton || !targetButton.dataset.scheme) return; const schemeKey = targetButton.dataset.scheme; applyScheme(schemeKey); }
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

        function setActiveSchemeButtons(schemeKey) {
            [DOMElements.schemeSelector, DOMElements.drawerSchemeSelector].forEach(group => {
                if (!group) return;
                group.querySelectorAll('.btn').forEach(btn => {
                    btn.classList.toggle('is-active', btn.dataset.scheme === schemeKey);
                });
            });
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

        function deriveFixedCost(premium, rateData) {
            if (!rateData || rateData.length < 2) return 0;
            const [totalCostRate, variableCostRate] = rateData;
            return parseFloat((premium * (totalCostRate - variableCostRate)).toFixed(1));
        }

        function calculateProfitFromFactors({ premium, loss, handlingFee, salesPromotion, laborCost, fixedCost }) {
            return parseFloat((premium - loss - handlingFee - salesPromotion - laborCost - fixedCost).toFixed(1));
        }

        function createAbsoluteChartOption(data, rateData, chartTitle, unit = '万元') {
            const themeOpts = getChartThemeOptions();
            // data数组: [保费, 赔款, 手续费, 销推, 人力, 边际贡献, 利润]
            const formattedData = data.map(v => parseFloat(v.toFixed(1)));
            const [premium, loss, handlingFee, salesPromotion, laborCost, edgeContribution] = formattedData;
            const profitFromData = formattedData[6] || 0;

            // 公式因子：固定成本 = 保费 × (总成本率 - 变动成本率)
            const fixedCost = deriveFixedCost(premium, rateData) || parseFloat((edgeContribution - profitFromData).toFixed(1));

            // 利润严格按照公式重新计算，避免依赖派生项
            const profit = calculateProfitFromFactors({ premium, loss, handlingFee, salesPromotion, laborCost, fixedCost });

            // 需要排序的成本项（按绝对金额降序）
            const costItems = [
                { name: '赔款', value: loss },
                { name: '手续费', value: handlingFee },
                { name: '销推费用', value: salesPromotion },
                { name: '人力成本', value: laborCost },
                { name: '固定成本', value: fixedCost }
            ].sort((a, b) => b.value - a.value);

            // 瀑布图X轴标签
            const xAxisData = ['保费', ...costItems.map(item => item.name), '利润'];

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

            // 2-n. 成本项（按金额排序后的减项）
            costItems.forEach(cost => {
                helpers.push(cumulative - cost.value);
                values.push(cost.value);
                cumulative -= cost.value;
                colors.push(themeOpts.colorNegative);
            });

            // 终点利润（确保逻辑闭合）
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

        function buildRateFactors(rateData) {
            const [totalCostRate, variableCostRate, lossRatio, handlingFeeRatio, salesPromotionRatio, laborCostRatio] = rateData;
            const fixedCostRate = totalCostRate - variableCostRate;

            const factors = [
                { key: 'LOSS_RATIO', name: '赔付率', value: parseFloat((lossRatio * 100).toFixed(1)) },
                { key: 'HANDLING_FEE_RATIO', name: '手续费率', value: parseFloat((handlingFeeRatio * 100).toFixed(1)) },
                { key: 'SALES_PROMOTION_RATIO', name: '销推费率', value: parseFloat((salesPromotionRatio * 100).toFixed(1)) },
                { key: 'LABOR_COST_RATIO', name: '人力成本率', value: parseFloat((laborCostRatio * 100).toFixed(1)) },
                { key: 'FIXED_COST_RATIO', name: '固定成本率', value: parseFloat((fixedCostRate * 100).toFixed(1)) }
            ];

            return factors.sort((a, b) => b.value - a.value);
        }

        function mapRateFactorValues(rateData) {
            const [totalCostRate, variableCostRate, lossRatio, handlingFeeRatio, salesPromotionRatio, laborCostRatio] = rateData;
            const fixedCostRate = totalCostRate - variableCostRate;

            return {
                LOSS_RATIO: parseFloat((lossRatio * 100).toFixed(1)),
                HANDLING_FEE_RATIO: parseFloat((handlingFeeRatio * 100).toFixed(1)),
                SALES_PROMOTION_RATIO: parseFloat((salesPromotionRatio * 100).toFixed(1)),
                LABOR_COST_RATIO: parseFloat((laborCostRatio * 100).toFixed(1)),
                FIXED_COST_RATIO: parseFloat((fixedCostRate * 100).toFixed(1))
            };
        }

        function createRateChartOption(data, chartTitle) {
            const themeOpts = getChartThemeOptions();
            const costFactors = buildRateFactors(data);

            // 瀑布图X轴标签（保费基准 + 动态排序的成本率因子）
            const xAxisData = ['保费基准', ...costFactors.map(factor => factor.name)];

            // 计算累计值
            let cumulative = 100; // 从100%开始
            const helpers = [];
            const values = [];
            const colors = [];

            // 1. 保费基准（100%）
            helpers.push(0);
            values.push(100);
            colors.push(themeOpts.colorNeutral);

            // 2-n. 成本率项（减项，按当前值降序）
            costFactors.forEach(cost => {
                helpers.push(cumulative - cost.value);
                values.push(cost.value);
                cumulative -= cost.value;
                colors.push(themeOpts.colorNegative);
            });

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
            carAbsolute: { getter: d => d.car.absolute, rateGetter: d => d.car.rate, title: '车险成本瀑布分析 (万元)', option: createAbsoluteChartOption },
            carRate: { getter: d => d.car.rate, title: '车险成本率瀑布分析 (%)', option: createRateChartOption },
            motoAbsolute: { getter: d => d.moto.absolute, rateGetter: d => d.moto.rate, title: '摩意险成本瀑布分析 (万元)', option: createAbsoluteChartOption },
            motoRate: { getter: d => d.moto.rate, title: '摩意险成本率瀑布分析 (%)', option: createRateChartOption },
            combinedAbsolute: { getter: d => d.combined.absolute, rateGetter: d => d.combined.rate, title: '综合成本瀑布分析 (万元)', option: createAbsoluteChartOption },
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
                    chart.setOption(meta.option(meta.getter(data), meta.rateGetter ? meta.rateGetter(data) : null, meta.title), true);
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

            // 计算固定成本和利润（严格按公式因子）
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
                {
                    name: '赔款',
                    car: data.car.absolute[1],
                    moto: data.moto.absolute[1],
                    total: data.combined.absolute[1]
                },
                {
                    name: '手续费',
                    car: data.car.absolute[2],
                    moto: data.moto.absolute[2],
                    total: data.combined.absolute[2]
                },
                {
                    name: '销推费用',
                    car: data.car.absolute[3],
                    moto: data.moto.absolute[3],
                    total: data.combined.absolute[3]
                },
                {
                    name: '人力成本',
                    car: data.car.absolute[4],
                    moto: data.moto.absolute[4],
                    total: data.combined.absolute[4]
                },
                {
                    name: '固定成本',
                    car: carFixedCost,
                    moto: motoFixedCost,
                    total: totalFixedCost
                }
            ].sort((a, b) => b.total - a.total);

            const waterfallAbsolute = [
                ['保费', data.car.absolute[0].toFixed(1), data.moto.absolute[0].toFixed(1), data.combined.absolute[0].toFixed(1)],
                ...costItemsAbsolute.map(item => [item.name, item.car.toFixed(1), item.moto.toFixed(1), item.total.toFixed(1)]),
                ['利润', carProfit.toFixed(1), motoProfit.toFixed(1), totalProfit.toFixed(1)]
            ];
            waterfallAbsolute.forEach(row => csvContent += row.join(',') + '\n');

            // 第三部分：瀑布图中间累计值（比率）
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
            validateAllInputs();
            updateKPIs(calculatedData);
            updateChartsForTab(getActiveTab(), calculatedData);
            updateContextInsight(calculatedData, breakEvenData);
            updateThemeLabel();
            updateMotoPremiumRatioDisplay();
            updateConversionHints();
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
            if (DOMElements.drawerSchemeSelector) DOMElements.drawerSchemeSelector.addEventListener('click', handleSchemeChange);
            DOMElements.exportDataBtn.addEventListener('click', exportDataToCSV);
            DOMElements.analysisTabsContainer.addEventListener('click', handleAnalysisTabClick);
            if (DOMElements.focusOnProfitBtn) DOMElements.focusOnProfitBtn.addEventListener('click', focusOnProfitCard);
            if (DOMElements.resetParametersBtn) DOMElements.resetParametersBtn.addEventListener('click', () => applyScheme(DEFAULT_SCHEME_KEY));
            if (DOMElements.applyParametersBtn) DOMElements.applyParametersBtn.addEventListener('click', () => { updateUI(); toggleParametersDrawer(false); });
            const debouncedUpdate = debounce(updateUI, 300);
            for (const key in DOMElements.inputs) {
                DOMElements.inputs[key].addEventListener('focus', storeCurrentInputValues);
                DOMElements.inputs[key].addEventListener('input', () => { validateField(key); updateConversionHints(); debouncedUpdate(); });
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
            initParameterCardsCollapse();
            setupInputAutoFocus();
            setupDefaultFillers();
            setupSteppers();
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
