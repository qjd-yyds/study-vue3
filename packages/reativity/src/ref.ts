import { hasChanged } from '@vue/shared';
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
      console.log("触发set--value");
      trigger(this, TriggerOpTypes.SET, 'value', newValue);
    }
  }
}
function createRef(rawValue, shallow = false) {
  // 创建ref，返回实例对象
  return new RefImpl(rawValue, shallow);
}
export function toRefs() {}
