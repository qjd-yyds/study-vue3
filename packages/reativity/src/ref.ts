import { hasChanged, isArray } from '@vue/shared';
import { Track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';

export function ref(target) {
  return createRef(target);
}
export function shallowRef(target) {
  // 浅，如果是一个对象
  return createRef(target, true);
}
// 创建类RefImpl
class RefImpl {
  public __v_isRef = true; // 标识ref代理
  public _value;
  constructor(public rawValue, public shallow) {
    this._value = rawValue; // 原来的值
  }
  // 类的属性访问器,收集依赖track
  get value() {
    Track(this, TrackOpTypes.GET, 'value');
    return this._value;
  }
  set value(newValue) {
    // 修改，触发依赖
    if (hasChanged(newValue, this._value)) {
      this._value = newValue;
      this.rawValue = newValue;
      console.log('触发set--value');
      trigger(this, TriggerOpTypes.SET, 'value', newValue);
    }
  }
}
/**
 * @description: 创建ref，返回实例对象
 * @param {*} rawValue
 * @param {Boolean} shallow
 * @return {Object} RefImpl
 */
function createRef(rawValue, shallow = false) {
  // 创建ref，返回实例对象
  return new RefImpl(rawValue, shallow);
}
/**
 * @description: 目标对象如果是响应式，返回的属性是响应的，如果是普通的就是普通的
 * @param {Object} target
 * @param {String} key
 * @return {ObjectRefImpl} ObjectRefImpl
 */
export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
/**
 * @description: toref返回的值，本质是通过模拟value 触发reative的get和set
 * @param {Object} target
 * @param {String} key
 */
class ObjectRefImpl {
  public __v_isRef = true; // 标识ref代理
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}
/**
 * @description: reative的所有值变成ObjectRefImpl实例
 * @param {object} reative
 * @return {object} Record<string,ObjectRefImpl>
 */
export function toRefs(target) {
  // 遍历当前对象
  // 如果是数组 new Array
  let ret = isArray(target) ? new Array(target.length) : {};
  for (let key in target) {
    // 将对象变成toref
    ret[key] = toRef(target, key);
  }
  return ret;
}
