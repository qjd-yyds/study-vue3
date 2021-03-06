var VueReactivity = (function (exports) {
  'use strict';

  // 判断是否对象
  const isObject = (val) => val !== null && typeof val === 'object';
  const isArray = Array.isArray;
  const isFunction = (val) => typeof val === 'function';
  const isString = (val) => typeof val === 'string';
  // 判断是否存在属性
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  // 判断数组的key是不是整数
  const isIntegerKey = (key) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key;
  // 判断两个值是否相同
  const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

  function effect(fn, options = {}) {
      const effect = createReactiveEffect(fn, options);
      // 判断options
      if (!options.lazy) {
          console.log('用户没有传递lazy，立即执行一次');
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
              // 当前创建的effect不存在栈中,创建effect
              // 没有入栈当前的effect
              try {
                  // 入栈
                  effectTrack.push(effect);
                  activeEffect = effect;
                  // 响应式effect
                  return fn(); // 执行用户的方法
              }
              finally {
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
  function Track(target, type, key) {
      console.log('触发收集', '被收集的target==>', target, '被收集的key==>', key);
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
  function trigger(target, type, key, newValue, oldValue) {
      // 触发更新
      const depsMap = targetMap.get(target);
      // 判断目标对象有没有被收集==> 不是响应的
      if (!depsMap)
          return;
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
              if (key === 'length' || key >= newValue) {
                  add(dep);
              }
          });
      }
      else {
          // 可能是对象
          if (key !== undefined) {
              // 获取当前key下的effect
              add(depsMap.get(key));
          }
          switch (type) {
              // 如果是新增属性
              case "add" /* ADD */:
                  if (isArray(target) && isIntegerKey(key)) {
                      // 如果是个数组且key为整数，就将length的effect加入依赖
                      add(depsMap.get('length'));
                  }
          }
      }
      // 触发effect方法
      effectSet.forEach((effect) => {
          if (effect.options.scheduler) {
              // 当前scheduler存在，effect为computed,effect的副作用放在get里
              effect.options.scheduler();
          }
          else {
              effect();
          }
      });
      // 执行
  }

  // 处理get
  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          const res = Reflect.get(target, key, receiver); // target[key]
          // 不是只读
          if (!isReadonly) {
              // 收集依赖effect,目标对象的key采用的操作get
              Track(target, "get" /* GET */, key);
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
              // 没有，触发新增数据
              console.log('当前值为新增，触发set新增==>', key);
              // 新增 key操作的属性 value 新值
              trigger(target, "add" /* ADD */, key, value);
          }
          else {
              // 有，修改值
              // 如果新值和旧值不相同
              if (hasChanged(value, oldValue)) {
                  console.log('当前值为修改，触发set修改');
                  trigger(target, "set" /* SET */, key, value);
              }
          }
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
          console.error("必须为一个对象");
          return target;
      }
      console.log('reative传入的值=>', target);
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

  function ref(target) {
      return createRef(target);
  }
  // 创建类RefImpl
  class RefImpl {
      rawValue;
      shallow;
      __v_isRef = true; // 标识ref代理
      _value;
      constructor(rawValue, shallow) {
          this.rawValue = rawValue;
          this.shallow = shallow;
          this._value = rawValue; // 原来的值
      }
      // 类的属性访问器,收集依赖track
      get value() {
          Track(this, "get" /* GET */, 'value');
          return this._value;
      }
      set value(newValue) {
          // 修改，触发依赖
          if (hasChanged(newValue, this._value)) {
              this._value = newValue;
              this.rawValue = newValue;
              console.log('触发set--value');
              trigger(this, "set" /* SET */, 'value', newValue);
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
  function toRef(target, key) {
      return new ObjectRefImpl(target, key);
  }
  /**
   * @description: toref返回的值，本质是通过模拟value 触发reative的get和set
   * @param {Object} target
   * @param {String} key
   */
  class ObjectRefImpl {
      target;
      key;
      __v_isRef = true; // 标识ref代理
      constructor(target, key) {
          this.target = target;
          this.key = key;
      }
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
  function toRefs(target) {
      // 遍历当前对象
      // 如果是数组 new Array
      let ret = isArray(target) ? new Array(target.length) : {};
      for (let key in target) {
          // 将对象变成toref
          ret[key] = toRef(target, key);
      }
      return ret;
  }

  // 计算属性
  function computed(getterOrOptions) {
      // 1.函数 2.对象
      // 获取数据
      let getter; // 获取
      let setter; // 设置
      if (isFunction(getterOrOptions)) {
          getter = getterOrOptions;
          setter = () => {
              console.warn('computed value must be readonly');
          };
      }
      else {
          // {get(),set()}
          // 对象
          getter = getterOrOptions.get;
          setter = getterOrOptions.set;
      }
      return new ComputedRefImpl(getter, setter);
  }
  class ComputedRefImpl {
      setter;
      _dirty = true; // 默认获取执行
      _value;
      effect;
      constructor(getter, setter) {
          this.setter = setter;
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

  exports.computed = computed;
  exports.effect = effect;
  exports.readonly = readonly;
  exports.reative = reative;
  exports.ref = ref;
  exports.shallowReactive = shallowReactive;
  exports.shallowReative = shallowReative;
  exports.toRef = toRef;
  exports.toRefs = toRefs;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=reativity.global.js.map
