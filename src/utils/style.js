export const getCssVariable = (DOMElements, varName) => getComputedStyle(DOMElements.html).getPropertyValue(varName).trim();
