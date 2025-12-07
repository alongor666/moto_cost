import { APP_CONFIG } from '../../config.js';
import { getInputValue, getInputValueAsRate } from '../ui/parametersForm.js';

export function getCalculationInputs(DOMElements) {
    return {
        carPremium: getInputValue(DOMElements, 'carPremium'),
        motoPremium: getInputValue(DOMElements, 'motoPremium'),
        carLossRatio: getInputValueAsRate(DOMElements, 'carLossRatio'),
        carHandlingFeeRate: getInputValueAsRate(DOMElements, 'carHandlingFeeRate'),
        carSalesPromotionRate: getInputValueAsRate(DOMElements, 'carSalesPromotionRate'),
        carStandardPremiumRatio: getInputValue(DOMElements, 'carStandardPremiumRatio'),
        carAveragePremium: getInputValue(DOMElements, 'carAveragePremium'),
        motoAveragePremium: getInputValue(DOMElements, 'motoAveragePremium'),
        motoQuantity: getInputValue(DOMElements, 'motoQuantity'),
        motoLossRatio: getInputValueAsRate(DOMElements, 'motoLossRatio'),
        motoWithCarFeeRate: getInputValueAsRate(DOMElements, 'motoWithCarFeeRate'),
        motoCardFeeRate: getInputValueAsRate(DOMElements, 'motoCardFeeRate'),
        motoSalesPromotionRate: getInputValueAsRate(DOMElements, 'motoSalesPromotionRate'),
        motoStandardPremiumRatio: getInputValue(DOMElements, 'motoStandardPremiumRatio'),
        laborBaseRate: getInputValueAsRate(DOMElements, 'laborBaseRate'),
        fixedOperationRate: getInputValueAsRate(DOMElements, 'fixedOperationRate'),
    };
}

export function calculateBreakEvenAnalysis(inputs) {
    const { carPremium, motoPremium, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carStandardPremiumRatio, carAveragePremium, motoAveragePremium, motoQuantity, motoLossRatio, motoWithCarFeeRate, motoCardFeeRate, motoSalesPromotionRate, motoStandardPremiumRatio, laborBaseRate, fixedOperationRate } = inputs;

    const motoPremiumRatio = carPremium > 0 ? motoPremium / carPremium : 0;
    const motoHandlingFeeRate = (motoWithCarFeeRate + motoCardFeeRate) / 2;

    const carFixedCosts = carHandlingFeeRate + carSalesPromotionRate + (carStandardPremiumRatio * laborBaseRate);
    const motoFixedCosts = motoHandlingFeeRate + motoSalesPromotionRate + (motoStandardPremiumRatio * laborBaseRate);

    const carBreakEvenLossRatio = ((1 + motoPremiumRatio) * (1 - fixedOperationRate) - motoPremiumRatio * (motoLossRatio + motoFixedCosts) - carFixedCosts) * 100;

    const motoBreakEvenLossRatio = (((1 + motoPremiumRatio) * (1 - fixedOperationRate) - (carLossRatio + carFixedCosts)) / motoPremiumRatio - motoFixedCosts) * 100;

    const carSensitivity = -carPremium * 0.01;
    const motoSensitivity = -carPremium * motoPremiumRatio * 0.01;
    const bothSensitivity = carSensitivity + motoSensitivity;

    return {
        carBreakEvenLossRatio: parseFloat(carBreakEvenLossRatio.toFixed(1)),
        motoBreakEvenLossRatio: parseFloat(motoBreakEvenLossRatio.toFixed(1)),
        carSensitivity: parseFloat(carSensitivity.toFixed(1)),
        motoSensitivity: parseFloat(motoSensitivity.toFixed(1)),
        bothSensitivity: parseFloat(bothSensitivity.toFixed(1)),
        motoPremiumRatio: parseFloat(motoPremiumRatio.toFixed(4))
    };
}

export function performCalculations(inputs) {
    const { carPremium, motoPremium, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carStandardPremiumRatio, carAveragePremium, motoAveragePremium, motoQuantity, motoLossRatio, motoWithCarFeeRate, motoCardFeeRate, motoSalesPromotionRate, motoStandardPremiumRatio, laborBaseRate, fixedOperationRate } = inputs;
    const motoPremiumRatio = carPremium > 0 ? motoPremium / carPremium : 0;
    const motoHandlingFeeRate = (motoWithCarFeeRate + motoCardFeeRate) / 2;
    const carLaborCostRate = carStandardPremiumRatio * laborBaseRate;
    const carVariableCostRate = carLossRatio + carHandlingFeeRate + carSalesPromotionRate + carLaborCostRate;
    const carTotalCostRate = carVariableCostRate + fixedOperationRate;
    const carEdgeContributionRate = 1 - carVariableCostRate;
    const carLoss = carPremium * carLossRatio;
    const carHandlingFee = carPremium * carHandlingFeeRate;
    const carSalesPromotion = carPremium * carSalesPromotionRate;
    const carLaborCost = carPremium * carLaborCostRate;
    const carFixedCost = carPremium * fixedOperationRate;
    const carEdgeContribution = carPremium * carEdgeContributionRate;
    const carProfit = carPremium * (1 - carTotalCostRate);
    // const motoPremium = carPremium * motoPremiumRatio; // Removed as it is now an input
    const motoLaborCostRate = motoStandardPremiumRatio * laborBaseRate;
    const motoVariableCostRate = motoLossRatio + motoHandlingFeeRate + motoSalesPromotionRate + motoLaborCostRate;
    const motoTotalCostRate = motoVariableCostRate + fixedOperationRate;
    const motoEdgeContributionRate = 1 - motoVariableCostRate;
    const motoLoss = motoPremium * motoLossRatio;
    const motoHandlingFee = motoPremium * motoHandlingFeeRate;
    const motoSalesPromotion = motoPremium * motoSalesPromotionRate;
    const motoLaborCost = motoPremium * motoLaborCostRate;
    const motoFixedCost = motoPremium * fixedOperationRate;
    const motoEdgeContribution = motoPremium * motoEdgeContributionRate;
    const motoProfit = motoPremium * (1 - motoTotalCostRate);
    const totalPremium = carPremium + motoPremium;
    const totalLoss = carLoss + motoLoss;
    const totalHandlingFee = carHandlingFee + motoHandlingFee;
    const totalSalesPromotion = carSalesPromotion + motoSalesPromotion;
    const totalLaborCost = carLaborCost + motoLaborCost;
    const totalFixedCost = carFixedCost + motoFixedCost;
    const totalVariableCost = totalLoss + totalHandlingFee + totalSalesPromotion + totalLaborCost;
    const totalVariableCostRate = totalPremium > 0 ? totalVariableCost / totalPremium : 0;
    const totalCostRate = totalVariableCostRate + fixedOperationRate;
    const totalEdgeContribution = carEdgeContribution + motoEdgeContribution;
    const totalProfit = carProfit + motoProfit;
    const totalEdgeContributionRate = 1 - totalVariableCostRate;
    return {
        car: { absolute: [carPremium, carLoss, carHandlingFee, carSalesPromotion, carLaborCost, carFixedCost, carProfit], rate: [carTotalCostRate, carLossRatio, carHandlingFeeRate, carSalesPromotionRate, carLaborCostRate, fixedOperationRate] },
        moto: { absolute: [motoPremium, motoLoss, motoHandlingFee, motoSalesPromotion, motoLaborCost, motoFixedCost, motoProfit], rate: [motoTotalCostRate, motoLossRatio, motoHandlingFeeRate, motoSalesPromotionRate, motoLaborCostRate, fixedOperationRate] },
        combined: { absolute: [totalPremium, totalLoss, totalHandlingFee, totalSalesPromotion, totalLaborCost, totalFixedCost, totalProfit], rate: [totalCostRate, totalPremium > 0 ? totalLoss/totalPremium : 0, totalPremium > 0 ? totalHandlingFee/totalPremium : 0, totalPremium > 0 ? totalSalesPromotion/totalPremium : 0, totalPremium > 0 ? totalLaborCost/totalPremium : 0, fixedOperationRate] }
    };
}

export const determineColor = (value, config, themeOpts) => {
    if (config.colorKey === 'neutral') return themeOpts.colorNeutral;
    if (config.colorKey === 'accent') return themeOpts.colorAccent;
    if (config.colorKey === 'conditional') {
        const positiveGood = config.positiveGood !== false;
        const threshold = config.threshold ?? 0;
        if (config.higherIsWorse) return value <= threshold ? themeOpts.colorPositive : themeOpts.colorNegative;
        return (positiveGood ? value >= threshold : value <= threshold) ? themeOpts.colorPositive : themeOpts.colorNegative;
    }
    return themeOpts.colorNeutral;
};

export const deriveFixedCost = (premium, rateData) => premium * (rateData[0] - rateData[1]);

export const calculateProfitFromFactors = ({ premium, loss, handlingFee, salesPromotion, laborCost, fixedCost }) => premium - (loss + handlingFee + salesPromotion + laborCost + fixedCost);

export const buildRateFactors = (rateData) => {
    const factorKeys = ['LOSS_RATIO', 'HANDLING_FEE_RATIO', 'SALES_PROMOTION_RATIO', 'LABOR_COST_RATIO', 'EDGE_CONTRIBUTION_RATIO'];
    return factorKeys.map(key => ({
        key,
        name: APP_CONFIG.INDICATOR_CONFIG[key].label,
        value: rateData[APP_CONFIG.RATE_CHART_INDICATORS.indexOf(key)] * 100
    })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
};

export const mapRateFactorValues = (rateData) => {
    const factors = {};
    APP_CONFIG.RATE_CHART_INDICATORS.forEach(key => {
        factors[key] = rateData[APP_CONFIG.RATE_CHART_INDICATORS.indexOf(key)] * 100;
    });
    return factors;
};
