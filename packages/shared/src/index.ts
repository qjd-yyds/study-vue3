// 判断是否对象
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';
// 合并对象
export const extend = Object.assign;

export const isArray = Array.isArray;

export const isFunction = (val) => typeof val === 'function';

export const isString = (val) => typeof val === 'string';
export const isNumber = (val) => typeof val === 'number';

// 判断是否存在属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val => hasOwnProperty.call(val, key);

// 判断数组的key是不是整数
export const isIntegerKey = (key) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;

// 判断两个值是否相同
export const hasChanged = (value: any, oldValue: any): boolean => !Object.is(value, oldValue);

export * from './shapeFlags';
