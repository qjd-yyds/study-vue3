import { hasChanged, hasOwn, isArray, isIntegerKey, isObject } from '@vue/shared';
import { Track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { readonly, reative } from './reative';
// 处理get
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver); // target[key]
    // 不是只读
    if (!isReadonly) {
      // 收集依赖effect,目标对象的key采用的操作get
      Track(target, TrackOpTypes.GET, key);
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
    // 存储旧值
    const oldValue = target[key];
    // 设置的是数组还是对象，添加值还是修改
    // 判断是否是数组，proxy的key就是数组的索引，如果key大于length表示新增false,小于表示修改true
    // 如果是对象，如果存在属性就是修改true，不存在就是新增属性flase
    let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);

    const result = Reflect.set(target, key, value, receiver);
    if (!hadKey) {
      // 没有
      console.log('触发set新增');
      // 新增 key操作的属性 value 新值
      trigger(target, TriggerOpTypes.ADD, key, value);
    } else {
      // 修改值
      // 如果新值和旧值不相同
      if (hasChanged(value, oldValue)) {
        console.log('触发set修改');
        trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      }
    }
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
