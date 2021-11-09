import { isArray, isIntegerKey } from '@vue/shared';
import { TriggerOpTypes } from './operations';

export function effect(fn, options: any = {}) {
  const effect = createReactiveEffect(fn, options);
  // 判断options
  if (!options.lazy) {
    console.log('用户没有传递lazy，执行');
    effect(); // 默认执行
  }
  return effect;
}
let uid = 0; // 记录effect的下标
let activeEffect; // 保存当前的effect
const effectTrack = []; // 定义一个栈解决嵌套树型结构effect，为了解决当前effect是哪一个
/*
[effect1,effect2,effect3]]
effect(() => {
  state.name
  effect(() => {
    state.age
    effect(() => {
      state.a
    })
  })

})
*/
function createReactiveEffect(fn, options) {
  const effect = function reativeEffect() {
    if (!effectTrack.includes(effect)) {
      console.log('当前创建的effect不存在栈中,创建effect');
      // 没有入栈当前的effect
      try {
        // 入栈
        effectTrack.push(effect);
        activeEffect = effect;
        console.log('执行用户方法');
        // 响应式effect
        fn(); // 执行用户的方法
      } finally {
        console.log('执行finally');
        // 无论是否成功，都执行
        // 出栈
        effectTrack.pop();
        activeEffect = effectTrack[effectTrack.length - 1];
      }
    }
  };
  effect.id = uid++; // 区别effect
  effect._isEffect = true; // 区分是否响应
  effect.raw = fn; // 保存用户方法
  effect.options = options; // 保存用户配置
  return effect;
}

// 收集effect，获取数据的时候触发get 收集effect
let targetMap = new WeakMap(); // 创建表
export function Track(target, type, key) {
  console.log('触发get，且当前不是只读，进行收集依赖');
  console.log(target, type, key, activeEffect, activeEffect);
  // 1.name ==> effect
  // key和effect一一对应
  if (typeof activeEffect === 'undefined') {
    // 当前对象没有的在effect函数中使用
    return;
  }
  // key===target==属性==>Set[effect,effect]
  let depMap = targetMap.get(target); //
  if (!depMap) {
    targetMap.set(target, (depMap = new Map())); // 添加值
  }
  // 当前key
  let dep = depMap.get(key);
  // 判断key是否存在，不存在就创建一个set
  if (!dep) {
    depMap.set(key, (dep = new Set()));
  }
  // 如果当前set不存在当前effect，
  if (!dep.has(activeEffect)) {
    // 收集effect，并添加进去
    dep.add(activeEffect);
  }
  console.log('依赖收集完成，当前创建的依赖weakmap==>', targetMap);
}

// 触发依赖
// 1.处理对象
export function trigger(target, type, key?, newValue?, oldValue?) {
  console.log(target, type, key, newValue, oldValue, '==>触发更新');
  const depsMap = targetMap.get(target);
  // 判断目标对象有没有被收集==> 不是响应的
  if (!depsMap) return;
  const effectSet = new Set();
  // 性能优化如果有多个同时修改一个值，相同就过滤
  const add = (effectAdd) => {
    if (effectAdd) {
      effectAdd.forEach((effect) => {
        effectSet.add(effect);
      });
    }
  };
  // 修改数组长度，数组特殊处理
  if (key === 'length' && isArray(target)) {
    // proxy在添加数组的时候默认会讲length等属性加入
    // 在effect中length也被添加依赖
    // 当用户修改长度，或者修改的下标小于所有数组的下标
    // 将length和下标的effect放入dep中
    depsMap.forEach((dep, key) => {
      // 如歌
      if (key === 'length' || key >= newValue) {
        console.log('dep==>', dep);
        add(dep);
      }
    });
  } else {
    // 可能是对象
    if (key !== undefined) {
      // 获取当前key下的effect
      add(depsMap.get(key));
    }
    switch (type) {
      // 如果是新增属性
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          // 如果是个数组且key为整数，就将length的effect加入依赖
          add(depsMap.get('length'));
        }
    }
  }
  effectSet.forEach((effect: any) => effect());
  // 执行
}
