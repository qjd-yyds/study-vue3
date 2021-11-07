'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => val !== null && typeof val === 'object';

// 处理get
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        console.log('触发get');
        const res = Reflect.get(target, key, receiver); // target[key]
        // 浅
        if (shallow) {
            return res;
        }
        // key是一个对象,递归，懒代理，即当访问下一层对象才开始进行拦截，必须被使用
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reative(res);
        }
        return res;
    };
}
// 柯里化，根据不同参数处理逻辑
// 处理get
const get = /*#__PURE__*/ createGetter(); // 深度非只读
const shallowGet = /*#__PURE__*/ createGetter(false, true); // 非只读 浅
const readonlyGet = /*#__PURE__*/ createGetter(true); // 只读 深度
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true); // 只读 浅
// 处理set,是否浅
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const result = Reflect.set(target, key, value, receiver);
        return result;
    };
}
const set = /*#__PURE__*/ createSetter();
const shallowSet = /*#__PURE__*/ createSetter(true);
// 全部代理
const reativeHandlers = {
    get,
    set
};
// 数据第一层代理
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
};
// 全部只读
const readonlyHandlers = {
    get: readonlyGet,
    set: (target, key, value) => {
        console.error('不可以修改key，只读全部');
    }
};
// 第一层只读
const shallowReativeHandlers = {
    get: shallowReadonlyGet,
    set: (target, key, value) => {
        console.error('不可以修改key只读一层');
    }
};

function reative(target) {
    return createReativeObj(target, false, reativeHandlers);
}
function shallowReactive(target) {
    return createReativeObj(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReativeObj(target, true, readonlyHandlers);
}
function shallowReative(target) {
    return createReativeObj(target, true, shallowReativeHandlers);
}
// 核心是proxy 采用柯里化根据不同参数处理
// 创建一个表来存储当前代理的对象
const reativeMap = new WeakMap(); // key必须为一个对象 自动垃圾回收
const readOnlyMap = new WeakMap(); // key必须为一个对象 自动垃圾回收
// 创建reative对象，返回一个proxy
function createReativeObj(target, isReadonly, baseHandlers) {
    if (!isObject(target)) {
        return target;
    }
    // 通过是否只读来创建不同map
    const proxyMap = isReadonly ? readOnlyMap : reativeMap;
    const proxyEs = proxyMap.get(target);
    // 如果已经创建过，就返回已经创建的代理
    if (proxyEs) {
        return proxyEs;
    }
    // 如果没有，将代理存入表中，并返回
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}

exports.readonly = readonly;
exports.reative = reative;
exports.shallowReactive = shallowReactive;
exports.shallowReative = shallowReative;
//# sourceMappingURL=reativity.cjs.js.map
