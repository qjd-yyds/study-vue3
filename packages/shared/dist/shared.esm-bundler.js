// 判断是否对象
const isObject = (val) => val !== null && typeof val === 'object';
// 合并对象
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
const isNumber = (val) => typeof val === 'number';
// 判断是否存在属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
// 判断数组的key是不是整数
const isIntegerKey = (key) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;
// 判断两个值是否相同
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

export { extend, hasChanged, hasOwn, isArray, isFunction, isIntegerKey, isNumber, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
