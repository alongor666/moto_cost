// Application configuration and constants extracted for modularity
const DEFAULT_SCHEME_KEY = '104.2';
const DEFAULT_ANALYSIS_TAB = 'combined';
const THEME_STORAGE_KEY = 'costInsightProTheme';

const APP_CONFIG = {
    THEME_STORAGE_KEY,
    INDICATOR_CONFIG: {
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
    SCHEMES: {
        '90.8': { name: '方案A (盈利)', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1000, carLossRatio: 90.8, carHandlingFeeRate: 0, carSalesPromotionRate: 0.3, carStandardPremiumRatio: 0.5, carAveragePremium: 120, motoAveragePremium: 100, motoQuantity: 2, motoLossRatio: 4, motoWithCarFeeRate: 65, motoCardFeeRate: 85, motoSalesPromotionRate: 0.9, motoStandardPremiumRatio: 1.8 }},
        '104.2': { name: '方案B (平衡)', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1000, carLossRatio: 104.2, carHandlingFeeRate: 0, carSalesPromotionRate: 0.3, carStandardPremiumRatio: 0.5, carAveragePremium: 120, motoAveragePremium: 100, motoQuantity: 2, motoLossRatio: 4, motoWithCarFeeRate: 65, motoCardFeeRate: 85, motoSalesPromotionRate: 0.9, motoStandardPremiumRatio: 1.8 }},
        '117.5': { name: '方案C (微亏)', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1000, carLossRatio: 117.5, carHandlingFeeRate: 0, carSalesPromotionRate: 0.3, carStandardPremiumRatio: 0.5, carAveragePremium: 120, motoAveragePremium: 100, motoQuantity: 2, motoLossRatio: 4, motoWithCarFeeRate: 65, motoCardFeeRate: 85, motoSalesPromotionRate: 0.9, motoStandardPremiumRatio: 1.8 }},
        '130.8': { name: '方案D (巨亏)', params: { laborBaseRate: 2.8, fixedOperationRate: 7.21, carPremium: 1000, carLossRatio: 130.8, carHandlingFeeRate: 0, carSalesPromotionRate: 0.3, carStandardPremiumRatio: 0.5, carAveragePremium: 120, motoAveragePremium: 100, motoQuantity: 2, motoLossRatio: 4, motoWithCarFeeRate: 65, motoCardFeeRate: 85, motoSalesPromotionRate: 0.9, motoStandardPremiumRatio: 1.8 }}
    },
    INPUT_SELECTORS: {
        laborBaseRate: '#laborBaseRate',
        fixedOperationRate: '#fixedOperationRate',
        carPremium: '#carPremium',
        carLossRatio: '#carLossRatio',
        carHandlingFeeRate: '#carHandlingFeeRate',
        carSalesPromotionRate: '#carSalesPromotionRate',
        carStandardPremiumRatio: '#carStandardPremiumRatio',
        carAveragePremium: '#carAveragePremium',
        motoAveragePremium: '#motoAveragePremium',
        motoQuantity: '#motoQuantity',
        motoLossRatio: '#motoLossRatio',
        motoWithCarFeeRate: '#motoWithCarFeeRate',
        motoCardFeeRate: '#motoCardFeeRate',
        motoSalesPromotionRate: '#motoSalesPromotionRate',
        motoStandardPremiumRatio: '#motoStandardPremiumRatio'
    },
    CHART_SELECTORS: {
        combinedAbsolute: '#combinedAbsoluteChart',
        combinedRate: '#combinedRateChart',
        carAbsolute: '#carAbsoluteChart',
        carRate: '#carRateChart',
        motoAbsolute: '#motoAbsoluteChart',
        motoRate: '#motoRateChart'
    },
    KPI_SELECTORS: {
        totalProfit: '#kpiTotalProfit',
        totalCostRate: '#kpiTotalCostRate',
        totalPremium: '#kpiTotalPremium',
        totalEdgeContribution: '#kpiTotalEdgeContribution'
    }
};

// expose to global scope
if (typeof window !== 'undefined') {
    window.DEFAULT_SCHEME_KEY = DEFAULT_SCHEME_KEY;
    window.DEFAULT_ANALYSIS_TAB = DEFAULT_ANALYSIS_TAB;
    window.APP_CONFIG = APP_CONFIG;
}

// Support simple Node-based checks
if (typeof module !== 'undefined') {
    module.exports = { DEFAULT_SCHEME_KEY, DEFAULT_ANALYSIS_TAB, THEME_STORAGE_KEY, APP_CONFIG };
}

