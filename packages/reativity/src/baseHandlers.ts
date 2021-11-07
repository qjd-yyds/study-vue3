import { isObject } from '@vue/shared';
import { readonly, reative } from './reative';
// 处理get
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    console.log('触发get');
    const res = Reflect.get(target, key, receiver); // target[key]
    // 不是只读
    if (!isReadonly) {
      // 收集依赖
    }
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
export const reativeHandlers = {
  get,
  set
};
// 数据第一层代理
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
};
// 全部只读
export const readonlyHandlers = {
  get: readonlyGet,
  set: (target, key, value) => {
    console.error('不可以修改key，只读全部');
  }
};
// 第一层只读
export const shallowReativeHandlers = {
  get: shallowReadonlyGet,
  set: (target, key, value) => {
    console.error('不可以修改key只读一层');
  }
};
