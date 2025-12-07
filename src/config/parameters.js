const PARAMETER_SCHEMA = [
    {
        id: 'laborBaseRate',
        label: '人力成本基数',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 150,
        warningHigh: 60,
        dangerHigh: 100,
        defaultValue: 2.8,
        category: 'management',
        product: '通用',
        conversionLabel: '人力成本基数'
    },
    {
        id: 'fixedOperationRate',
        label: '固定运营成本率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 50,
        warningHigh: 15,
        dangerHigh: 25,
        defaultValue: 7.21,
        category: 'management',
        product: '通用',
        conversionLabel: '固定运营成本率'
    },
    {
        id: 'carPremium',
        label: '车险保费(万元)',
        type: 'amount',
        unit: '万元',
        min: 0,
        max: 5000,
        warningLow: 200,
        defaultValue: 1000,
        category: 'variable-car',
        product: '车险'
    },
    {
        id: 'carLossRatio',
        label: '车险赔付率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 200,
        warningHigh: 110,
        dangerHigh: 130,
        defaultValue: 104.2,
        category: 'variable-car',
        product: '车险',
        conversionLabel: '车险赔付率'
    },
    {
        id: 'carHandlingFeeRate',
        label: '车险手续费率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 50,
        warningHigh: 20,
        dangerHigh: 35,
        defaultValue: 0,
        category: 'variable-car',
        product: '车险',
        conversionLabel: '车险手续费率'
    },
    {
        id: 'carSalesPromotionRate',
        label: '车险销推费用率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 30,
        warningHigh: 10,
        dangerHigh: 20,
        defaultValue: 0.3,
        category: 'variable-car',
        product: '车险',
        conversionLabel: '车险销推费用率'
    },
    {
        id: 'carStandardPremiumRatio',
        label: '车险标保系数',
        type: 'ratio',
        unit: '倍',
        min: 0,
        max: 5,
        warningHigh: 2,
        dangerHigh: 3,
        defaultValue: 0.5,
        category: 'variable-car',
        product: '车险',
        conversionLabel: '车险标保系数'
    },
    {
        id: 'carAveragePremium',
        label: '车险单均保费(元)',
        type: 'amount',
        unit: '元',
        min: 0,
        max: 500,
        warningLow: 60,
        defaultValue: 120,
        category: 'variable-car',
        product: '车险',
        conversionLabel: '车险单均保费'
    },
    {
        id: 'motoAveragePremium',
        label: '摩意险件均保费(元)',
        type: 'amount',
        unit: '元',
        min: 0,
        max: 500,
        warningLow: 50,
        defaultValue: 100,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '摩意险件均保费'
    },
    {
        id: 'motoQuantity',
        label: '摩意险份数',
        type: 'count',
        unit: '份',
        min: 0,
        max: 10,
        warningHigh: 5,
        defaultValue: 2,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '摩意险份数'
    },
    {
        id: 'motoLossRatio',
        label: '摩意险赔付率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 200,
        warningHigh: 80,
        dangerHigh: 120,
        defaultValue: 4,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '摩意险赔付率'
    },
    {
        id: 'motoWithCarFeeRate',
        label: '随车费用率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 150,
        warningHigh: 90,
        dangerHigh: 120,
        defaultValue: 65,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '随车业务费用率'
    },
    {
        id: 'motoCardFeeRate',
        label: '卡单费用率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 150,
        warningHigh: 90,
        dangerHigh: 120,
        defaultValue: 85,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '卡单费用率'
    },
    {
        id: 'motoSalesPromotionRate',
        label: '摩意险销推费用率',
        type: 'percent',
        unit: '%',
        min: 0,
        max: 30,
        warningHigh: 10,
        dangerHigh: 20,
        defaultValue: 0.9,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '摩意险销推费用率'
    },
    {
        id: 'motoStandardPremiumRatio',
        label: '摩意险标保系数',
        type: 'ratio',
        unit: '倍',
        min: 0,
        max: 5,
        warningHigh: 2.5,
        dangerHigh: 3.5,
        defaultValue: 1.8,
        category: 'variable-moto',
        product: '摩意险',
        conversionLabel: '摩意险标保系数'
    }
];

const PARAMETER_MAP = PARAMETER_SCHEMA.reduce((acc, param) => {
    acc[param.id] = param;
    return acc;
}, {});

const VALIDATION_RULES = PARAMETER_SCHEMA.reduce((acc, param) => {
    const { id, label, min, max, warningLow, warningHigh, dangerHigh } = param;
    acc[id] = { label, min, max, warningLow, warningHigh, dangerHigh };
    return acc;
}, {});

const CONVERSION_LABELS = PARAMETER_SCHEMA.reduce((acc, param) => {
    if (param.conversionLabel) acc[param.id] = param.conversionLabel;
    return acc;
}, {});

const PARAMETERS_CONFIG = { PARAMETER_SCHEMA, PARAMETER_MAP, VALIDATION_RULES, CONVERSION_LABELS };

if (typeof window !== 'undefined') {
    window.PARAMETERS_CONFIG = PARAMETERS_CONFIG;
}

if (typeof module !== 'undefined') {
    module.exports = PARAMETERS_CONFIG;
}
