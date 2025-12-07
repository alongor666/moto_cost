import { APP_CONFIG } from '../../config.js';
import { determineColor, deriveFixedCost, buildRateFactors, mapRateFactorValues } from '../services/calculator.js';
import { getCssVariable } from '../utils/style.js';

export function getChartThemeOptions(DOMElements) {
    const isDark = DOMElements.html.classList.contains('theme-dark');
    const cssVar = (name) => getCssVariable(DOMElements, name);

    return {
        isDark,
        colorPositive: cssVar('--color-positive'),
        colorNegative: cssVar('--color-negative'),
        colorNeutral: cssVar('--color-neutral'),
        colorAccent: cssVar('--color-accent'),
        textColorPrimary: cssVar('--color-text-primary'),
        textColorSecondary: cssVar('--color-text-secondary'),
        borderColor: cssVar('--color-border'),
        title: { left: 'center', top: '5%', textStyle: { color: cssVar('--color-text-primary'), fontSize: 18, fontWeight: cssVar('--font-weight-semibold'), fontFamily: cssVar('--font-family-sans') } },
        grid: { left: '3%', right: '5%', bottom: '20%', top: '20%', containLabel: true },
        textStyle: { fontFamily: cssVar('--font-family-sans'), color: cssVar('--color-text-secondary'), fontSize: parseFloat(cssVar('--font-size-chart-xaxis')) },
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: cssVar(isDark ? '--color-background-elevated' : '--color-background-content'),
            borderColor: cssVar('--color-border'),
            textStyle: { color: cssVar('--color-text-primary') },
            confine: true,
            valueFormatter: (value) => value != null ? parseFloat(value).toFixed(1) : 'N/A'
        },
        xAxis: {
            type: 'category',
            axisLine: { show: true, lineStyle: { color: cssVar('--color-border'), width: 1 } },
            axisTick: { show: false },
            axisLabel: {
                color: cssVar('--color-text-secondary'),
                fontSize: parseFloat(cssVar('--font-size-chart-xaxis')),
                interval: 0, rotate: 0,
                fontWeight: cssVar('--font-weight-semibold')
            }
        },
        yAxis: { show: false },
        seriesBase: {
            type: 'bar', barWidth: '70%', barGap: '-50%',
            itemStyle: { borderRadius: [5, 5, 0, 0] },
            label: {
                show: true, position: 'top',
                fontFamily: cssVar('--font-family-sans'),
                fontSize: parseFloat(cssVar('--font-size-chart-xaxis')),
                fontWeight: cssVar('--font-weight-bold'),
                distance: 8,
                padding: [5, 5, 5, 5],
                formatter: (params) => parseFloat(params.value).toFixed(1)
            }
        }
    };
}

export function createAbsoluteChartOption(DOMElements, data, rateData, chartTitle, unit = '万元') {
    const themeOpts = getChartThemeOptions(DOMElements);
    const indicators = APP_CONFIG.ABSOLUTE_CHART_INDICATORS;
    const config = APP_CONFIG.INDICATOR_CONFIG;
    const xAxisData = indicators.map(key => config[key].label);
    const values = data;
    const helpers = new Array(values.length).fill(0);
    const colors = values.map((val, idx) => determineColor(val, config[indicators[idx]], themeOpts));

    helpers[0] = values[0];
    for (let i = 1; i < values.length; i++) helpers[i] = helpers[i - 1] - values[i];

    const seriesData = values.map((value, idx) => ({
        value,
        itemStyle: { color: colors[idx] },
        label: { color: colors[idx], formatter: (params) => `${parseFloat(params.value).toFixed(1)}${unit}` }
    }));

    return {
        backgroundColor: 'transparent',
        title: { ...themeOpts.title, text: chartTitle },
        grid: themeOpts.grid,
        textStyle: themeOpts.textStyle,
        tooltip: themeOpts.tooltip,
        xAxis: { ...themeOpts.xAxis, data: xAxisData },
        yAxis: themeOpts.yAxis,
        series: [
            { ...themeOpts.seriesBase, name: '辅助', itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } }, data: helpers, animation: false },
            { ...themeOpts.seriesBase, name: '数值', barWidth: '50%', data: seriesData, label: { ...themeOpts.seriesBase.label, formatter: (params) => `${parseFloat(params.value).toFixed(1)}${unit}`, color: undefined } }
        ]
    };
}

export function createRateChartOption(DOMElements, data, chartTitle) {
    const themeOpts = getChartThemeOptions(DOMElements);
    const indicators = APP_CONFIG.RATE_CHART_INDICATORS;
    const config = APP_CONFIG.INDICATOR_CONFIG;
    const xAxisData = indicators.map(key => config[key].label);
    const values = data.map(v => v * 100);
    const helpers = new Array(values.length).fill(0);
    const colors = values.map((val, idx) => determineColor(val / 100, config[indicators[idx]], themeOpts));

    helpers[0] = 100;
    for (let i = 1; i < values.length; i++) helpers[i] = helpers[i - 1] - values[i];

    return {
        backgroundColor: 'transparent',
        title: { ...themeOpts.title, text: chartTitle },
        grid: themeOpts.grid,
        textStyle: themeOpts.textStyle,
        tooltip: themeOpts.tooltip,
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
                itemStyle: { borderRadius: [5, 5, 0, 0] },
                label: {
                    show: true,
                    position: 'top',
                    fontFamily: themeOpts.textStyle.fontFamily,
                    fontSize: parseFloat(getCssVariable(DOMElements, '--font-size-chart-xaxis')),
                    fontWeight: getCssVariable(DOMElements, '--font-weight-bold'),
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

export function updateChartsForTab(DOMElements, EChartsInstances, tabKey, data) {
    const chartKeys = TAB_CHARTS[tabKey] || [];
    chartKeys.forEach(key => {
        const meta = CHART_META[key];
        const chart = EChartsInstances[key];
        if (chart && meta) {
            chart.showLoading();
            chart.clear();
            chart.setOption(meta.option(DOMElements, meta.getter(data), meta.rateGetter ? meta.rateGetter(data) : null, meta.title), true);
            chart.hideLoading();
        }
    });
}

export function initCharts(DOMElements, EChartsInstances) {
    for (const key in APP_CONFIG.CHART_SELECTORS) {
        const chartDom = document.querySelector(APP_CONFIG.CHART_SELECTORS[key]);
        if (chartDom) EChartsInstances[key] = echarts.init(chartDom);
    }
}

export function disposeCharts(EChartsInstances) {
    for (const key in EChartsInstances) {
        if (EChartsInstances[key] && !EChartsInstances[key].isDisposed()) {
            EChartsInstances[key].dispose();
        }
    }
}

export { deriveFixedCost, mapRateFactorValues, buildRateFactors };
