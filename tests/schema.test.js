const assert = require('assert');
const { PARAMETER_SCHEMA, PARAMETER_MAP, VALIDATION_RULES, CONVERSION_LABELS } = require('../src/config/parameters.js');
const { APP_CONFIG } = require('../config.js');

assert(Array.isArray(PARAMETER_SCHEMA) && PARAMETER_SCHEMA.length > 0, '参数 schema 不能为空');

const schemaIds = PARAMETER_SCHEMA.map(param => param.id).sort();
assert.deepStrictEqual(Object.keys(VALIDATION_RULES).sort(), schemaIds, '校验规则应覆盖全部参数');

const conversionIdsFromSchema = PARAMETER_SCHEMA.filter(param => param.conversionLabel).map(param => param.id).sort();
assert.deepStrictEqual(Object.keys(CONVERSION_LABELS).sort(), conversionIdsFromSchema, '转换标签应来自 schema');

assert.deepStrictEqual(Object.keys(APP_CONFIG.INPUT_SELECTORS).sort(), schemaIds, '表单选择器需要与 schema 参数保持一致');

PARAMETER_SCHEMA.forEach(param => {
    assert.strictEqual(PARAMETER_MAP[param.id], param, `参数 ${param.id} 应映射到自身配置`);
    assert.strictEqual(VALIDATION_RULES[param.id].label, param.label, `参数 ${param.id} 的标签应一致`);
    if (!isNaN(param.min) && !isNaN(param.max)) {
        assert(param.min <= param.max, `参数 ${param.id} 的范围定义需合法`);
    }
    assert.strictEqual(typeof param.defaultValue, 'number', `参数 ${param.id} 需要默认数值`);
});

console.log('Schema definitions verified successfully.');
