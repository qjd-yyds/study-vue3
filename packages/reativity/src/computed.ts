import { isFunction } from '@vue/shared';
import { effect } from '.';

// 计算属性
export function computed(getterOrOptions) {
  // 1.函数 2.对象
  // 获取数据
  let getter; // 获取
  let setter; // 设置
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn('computed value must be readonly');
    };
  } else {
    // {get(),set()}
    // 对象
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
  public _dirty = true; // 默认获取执行
  public _value;
  public effect;
  constructor(getter, public setter) {
    // 当创建一个computed的时候，就当前的getter作为effect的回调函数
    // 并且将effect存到自己的effect
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        // 当修改数据的时候执行
        if (!this._dirty) {
          this._dirty = true;
        }
      }
    });
  }
  // 通过.value
  get value() {
    // 当获取xxx.value的时候，执行effect函数，吧effect执行后的数据放在_value,并返回这个数据
    // 如果当前dirty为false，代表当前依赖响应未发生变化，从缓存拿值
    if (this._dirty) {
      console.log('进入缓存判断，当前dirty为true，执行effect');
      this._dirty = false; // 变更为false
      this._value = this.effect(); // 获取用户的值，只要数据被改变
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}
