var VueRuntimeDom = (function (exports) {
  'use strict';

  // 判断是否对象
  const isObject = (val) => val !== null && typeof val === 'object';
  // 合并对象
  const extend = Object.assign;
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

  // 操作节点增删改插
  const doc = (typeof document !== 'undefined' ? document : null);
  const svgNS = 'http://www.w3.org/2000/svg';
  const nodeOps = {
      // 创建元素createElement
      createElement: (tag, isSVG, is, props) => {
          const el = isSVG ? doc.createElementNS(svgNS, tag) : doc.createElement(tag, is ? { is } : undefined);
          if (tag === 'select' && props && props.multiple != null) {
              el.setAttribute('multiple', props.multiple);
          }
          return el;
      },
      // 删除一个元素
      remove: (child) => {
          const parent = child.parentNode;
          if (parent) {
              parent.removeChild(child);
          }
      },
      // 插入
      insert: (child, parent, anchor) => {
          parent.insertBefore(child, anchor || null); // appendchild
      },
      setElementText: (el, text) => {
          el.textContent = text;
      },
      // 选择
      querySelector: (selector) => doc.querySelector(selector),
      // ==>创建节点文本
      createText: (text) => doc.createTextNode(text),
      // 设置文本节点
      setText: (node, text) => {
          node.nodeValue = text;
      }
  };

  /**
   * @description: 自定义属性
   * @param {*} el 目标元素
   * @param {*} el 属性
   * @param {*} value 设置的值
   */
  const patchAttr = (el, key, value) => {
      if (value == null) {
          el.removeAttribute(key);
      }
      else {
          el.setAttribute(key, value);
      }
  };

  /**
   * @description: 处理class
   * @param {Element} el 目标元素
   * @param {*} value class的类名
   * @return {*}
   */
  const patchClass = (el, value) => {
      if (value == null) {
          value = '';
      }
      // 对标签的class赋值，如果有新的覆盖
      el.className = value;
  };

  const PatchEvent = (el, key, nextValue) => {
      // 1.函数缓存
      const invokers = el._vei || (el._vei = {});
      const exists = invokers[key];
      if (nextValue && exists) {
          // 原来有
          exists.value = nextValue;
      }
      else {
          // 事件名字
          const eventName = key.slice(2).toLowerCase();
          if (nextValue) {
              // 1.新的有
              let invoker = (invokers[eventName] = createInvoker(nextValue));
              el.addEventListener(eventName, invoker);
          }
          else {
              // 2.新的没有
              el.removeEventListener(eventName, exists);
              invokers[eventName] = undefined;
          }
      }
  };
  function createInvoker(value) {
      const invoker = (e) => {
          invoker.value(e);
      };
      invoker.value = value;
      return invoker;
  }
  // 事件处理
  // 1.给元素缓存一个绑定事件的列表
  // 2.如果缓存中没有，但是value有值，绑定事件并且缓存当前事件
  // 3.以前绑定过，删除缓存，讲value缓存
  // 4.两个都有，直接改变invoker里的value

  /**
   * @description: style的处理
   * @param {*} el 目标元素
   * @param {*} prev 之前的值
   * @param {*} next 修改的值
   */
  const patchStyle = (el, prev, next) => {
      const style = el.style;
      if (next == null) {
          // 删除
          el.removeAttribute('style');
      }
      else {
          // 老的有，新的没有
          if (prev) {
              for (let key in prev) {
                  if (next[key] == null) {
                      style[key] = '';
                  }
              }
          }
          // 老的没有，新的有
          for (let key in next) {
              style[key] = next[key];
          }
      }
  };

  // 属性操作 ，策略模式
  function patchProp(el, key, prevValue, nextValue) {
      switch (key) {
          case 'class':
              patchClass(el, nextValue);
              break;
          case 'style':
              patchStyle(el, prevValue, nextValue);
              break;
          default:
              // 判断是不是事件
              if (/^on[^a-z]/.test(key)) {
                  // 事件
                  PatchEvent(el, key, nextValue);
              }
              else {
                  // 否则为属性
                  patchAttr(el, key, nextValue);
              }
              break;
      }
  }

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

  /**
   * @description: 作用和h函数一样，创建vnode
   * @param {*} type 类型
   * @param {*} props 属性
   * @param {*} childen 插槽
   * @return { vnode } vnode
   */
  // h('div',{},[])
  function creatVnode(type, props, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
      // 区分组件的虚拟dom还是普通元素
      const shapeFlag = isString(type)
          ? 1 /* ELEMENT */
          : isObject(type)
              ? 4 /* STATEFUL_COMPONENT */
              : isFunction(type)
                  ? 2 /* FUNCTIONAL_COMPONENT */
                  : 0;
      const vnode = {
          _v_isVnode: true,
          type,
          props,
          children,
          key: props && props.key,
          el: null,
          component: null,
          shapeFlag // 判断类型
      };
      // children
      normalizeChildren(vnode, children);
      return vnode;
  }
  function normalizeChildren(vnode, children) {
      let type = 0;
      if (children == null) {
          return;
      }
      else if (isArray(children)) {
          type = 16 /* ARRAY_CHILDREN */;
      }
      else {
          type = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag = vnode.shapeFlag | type;
  }
  // 判断是否是vnode
  function isVnode(vnode) {
      return vnode._v_isVnode;
  }
  const TEXT = Symbol('text');
  // 元素的children 变成vnode
  function CVnode(child) {
      // ['text'],[h()]
      if (isObject(child)) {
          return child;
      }
      return creatVnode(TEXT, null, String(child));
  }

  /**
   * @description: 创建vnode
   * @param {*} render
   * @return {*}
   */
  function ApiCreateApp(render) {
      return function creatApp(rootcomponent, rootProps) {
          const app = {
              _component: rootcomponent,
              _props: rootProps,
              _container: null,
              mount(container) {
                  // 创建vnode
                  let vnode = creatVnode(rootcomponent, rootProps);
                  // 渲染
                  render(vnode, container);
              }
          };
          return app;
      };
  }

  const componentPublicInstance = {
      get({ _: instance }, key) {
          const { props, setupState, data } = instance;
          if (key[0] === '$') {
              // $开头的不能获取
              return;
          }
          if (hasOwn(props, key)) {
              return props[key];
          }
          else if (hasOwn(setupState, key)) {
              return setupState[key];
          }
      },
      set({ _: instance }, key, value) {
          const { props, setupState, data } = instance;
          if (hasOwn(props, key)) {
              props[key] = value;
          }
          else if (hasOwn(setupState, key)) {
              setupState[key] = value;
          }
      }
  };

  // 创建组件实例
  const createComponentInstance = (vnode) => {
      const instance = {
          vnode,
          type: vnode.type,
          props: {},
          attrs: {},
          data: { a: 1 },
          render: false,
          setupState: {},
          ctx: {},
          proxy: {},
          isMounted: false // 是否挂载
      };
      instance.ctx = {
          _: instance
      };
      return instance;
  };
  // 解析数据到组件实例
  const setupComponent = (instance) => {
      // 设置值
      const { props, children } = instance.vnode;
      instance.props = props;
      instance.children = children;
      let isStateFul = instance.vnode.shapeFlag && 4 /* STATEFUL_COMPONENT */;
      if (isStateFul) {
          // 有的话就是有状态的组件
          setupStateComponent(instance);
      }
  };
  // 执行setup
  function setupStateComponent(instance) {
      instance.proxy = new Proxy(instance.ctx, componentPublicInstance);
      // setup的返回值，变成render函数的参数this
      // 获取组件的类型
      let component = instance.type;
      let { setup } = component;
      // 判断组件有没有setup
      if (setup) {
          const setupContext = createContext(instance);
          let setupResult = setup(instance.props, setupContext);
          // 返回值对象，函数
          handleSetupResult(instance, setupResult); // 如果是对象，将值放入实例上的setupState，如果函数就是render
      }
      else {
          // setup没有，调用render
          finishComponentSetup(instance);
      }
      // component.render(instance.proxy);
  }
  // 处理setup的返回结果
  function handleSetupResult(instance, setupResult) {
      if (isFunction(setupResult)) {
          instance.render = setupResult; // 将setup返回的函数保存到实例上
          // 函数
      }
      else if (isObject(setupResult)) {
          instance.setupState = setupResult;
      }
      // 最终去执行render
      finishComponentSetup(instance);
  }
  // 处理render
  function finishComponentSetup(instance) {
      let component = instance.type;
      // 判断setup是否有render
      if (!instance.render) {
          // 没有render
          // 进行模版编译
          if (!component.render && component.template) ;
          // 将实例上的setup放入render里
          instance.render = component.render;
      }
  }
  // 创建上下文 ctx
  function createContext(instance) {
      return {
          attrs: instance.attrs,
          slot: instance.slots,
          emit: () => { },
          expose: () => { }
      };
  }

  /**
   * @description: 平台判断，创建渲染器
   * @return {Function} createApp 挂载函数
   */
  function createRenderer(rendererOptions) {
      // 获取全部的dom操作
      const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, setText: hostSetText, setElementText: hostSetElementText } = rendererOptions;
      // 给setup创建effect
      function setupRenderEffect(instance, container) {
          // 每次数据变化重新执行render
          effect(function componentEffect() {
              console.log('effect');
              // 判断是不是第一次加载
              if (!instance.isMounted) {
                  // 获取render的返回值
                  const proxy = instance.proxy;
                  // 执行render方法获取vnode
                  let subTree = (instance.subTree = instance.render.call(proxy, proxy));
                  console.log('subTree', subTree);
                  // 渲染子树 创建元素
                  patch(null, subTree, container);
                  instance.isMounted = true;
              }
              else {
                  // 更新
                  console.log('更新');
                  const proxy = instance.proxy;
                  // 对吧旧的值和新的值
                  const prevTree = instance.subTree;
                  const nextTree = instance.render.call(proxy, proxy);
                  instance.subTree = nextTree;
                  patch(prevTree, nextTree, container);
              }
          });
      }
      // ------------------处理组件
      const mountComponent = (initialVNode, container) => {
          // 组件初始化流程
          // 1.先有一个组件的对象render（proxy）
          const instance = (initialVNode.component = createComponentInstance(initialVNode));
          // 2.解析数据到实例对象
          setupComponent(instance);
          // 3.创建effect让render执行
          setupRenderEffect(instance, container);
      };
      // 组件创建
      const processComponent = (n1, n2, container) => {
          if (n1 == null) {
              // 第一次或者重新加载
              mountComponent(n2, container);
          }
          else {
              // 同一个元素
              console.log('同一个组件比对');
          }
      };
      // ----------------------处理文本
      function processText(n1, n2, container) {
          if (n1 == null) {
              hostInsert(hostCreateText(n2.children), container);
          }
      }
      //  -------------------处理元素
      // 加载元素
      function mountChildren(el, children) {
          for (let i = 0; i < children.length; i++) {
              let child = CVnode(children[i]);
              // 创建文本元素
              patch(null, child, el);
          }
      }
      function mountedElement(vnode, container) {
          // 创建元素
          // h('div',{},[h('div')])
          // 递归渲染变成真实dom
          const { props, shapeFlag, type, children } = vnode;
          // 创建元素
          let el = hostCreateElement(type);
          vnode.el = el; // 保存当前真实dom
          // 添加属性
          if (props) {
              for (let key in props) {
                  hostPatchProp(el, key, null, props[key]);
              }
          }
          // 处理children// h('div',{style:{color:'red'}},'text')
          // 处理children// h('div',{style:{color:'red'}},['text'])
          // 处理children// h('div',{style:{color:'red'}},[h()])
          if (children) {
              if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                  // 文本，创建文本元素
                  hostSetElementText(el, children);
              }
              else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                  // 递归 patch 要求：是一个虚拟dom
                  mountChildren(el, children);
              }
          }
          // 放到对应的位置
          hostInsert(el, container);
      }
      // 属性比对
      const patchProps = (el, oldProps, newProps) => {
          // 旧的有属性，新的没有这个属性
          // 循环
          if (oldProps != newProps) {
              for (let key in newProps) {
                  const prev = oldProps[key]; // 旧属性
                  const next = newProps[key]; // 旧属性
                  if (prev != next) {
                      // 不相同的就执行替换
                      console.log('当前替换的属性==>', key, '被替换的值', prev, '==>', next);
                      hostPatchProp(el, key, prev, next);
                  }
              }
          }
          // 如果旧的属性不在新的属性里，直接删除
          for (let key in oldProps) {
              if (!(key in newProps)) {
                  console.log('被删除的属性key==>', key, '被删除的属性值value', oldProps[key]);
                  hostPatchProp(el, key, oldProps[key], null);
              }
          }
      };
      // 同一个元素比对
      const patchElement = (n1, n2, container) => {
          // 属性比对style class
          let el = (n2.el = n1.el); // 获取真实的节点
          const oldProps = n1.props || {};
          const newProps = n2.props || {};
          patchProps(el, oldProps, newProps); // 处理属性
      };
      function processeElement(n1, n2, container) {
          if (n1 == null) {
              // 创建
              mountedElement(n2, container);
          }
          else {
              // 更新
              console.log('同一个元素比对');
              patchElement(n1, n2);
          }
      }
      // 判断是不是同一个元素
      function isSameVnode(n1, n2) {
          return n1.type == n2.type && n1.key == n2.key;
      }
      // 删除
      function unmount(vnode) {
          console.log(vnode.el);
          hostRemove(vnode.el);
      }
      //
      /**
       * @description: 渲染
       * @param {*} n1 上一个节点
       * @param {*} n2 需要渲染的节点
       * @param {*} container 渲染的目标容器
       * @return {*}
       */
      function patch(n1, n2, container) {
          // 判断是不是同一个元素
          if (n1 && !isSameVnode(n1, n2)) {
              // 不是同一个元素，直接替换
              unmount(n1); // 删除之前的元素
              n1 = null;
          }
          const { shapeFlag, type } = n2;
          // 文本
          switch (type) {
              case TEXT:
                  // 文本类型
                  processText(n1, n2, container);
                  break;
          }
          if (shapeFlag & 1 /* ELEMENT */) {
              console.log('当前渲染的是元素');
              processeElement(n1, n2, container);
          }
          else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
              console.log('当前渲染的是组件');
              processComponent(n1, n2, container);
          }
      }
      /**
       * @description: 实现渲染，组件初始化
       * @param {*} vnode 虚拟dom
       * @param {*} container 容器
       * @return {*} container
       */
      function render(vnode, container) {
          // 组件初始化
          // 渲染
          patch(null, vnode, container);
      }
      return {
          createApp: ApiCreateApp(render) // 创建vnode
      };
  }
  // 组件初始化流程： 将组件变成vnode ==> 创建一个组件实例 ==>再进行渲染vnode ==> 真实dom

  function h(type, propsOrChildren, childen = null) {
      // 变成vnode
      // h('div',{},'hello')
      // h('div',{},[h('span')])
      const i = arguments.length; // 参数个数
      if (i === 2) {
          if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
              // h('div',{})
              // h('div',h('div'))
              // 判断是不是一个vnode
              if (isVnode(propsOrChildren)) {
                  return creatVnode(type, null, [propsOrChildren]);
              }
              return creatVnode(type, propsOrChildren); // 没有儿子，只有属性
          }
          else {
              return creatVnode(type, null, propsOrChildren); // 是儿子
          }
      }
      else {
          if (i > 3) {
              // h('div',{},'1','2')
              // 超过三个的
              childen = Array.prototype.slice.call(arguments, 2); // 从第二个开始切割
          }
          else if (i === 3 && isVnode(childen)) {
              childen = [childen]; // h('div',{},h('div'))
          }
          return creatVnode(type, propsOrChildren, childen);
      }
  }

  // 操作dom的文件
  const rendererOptions = extend({ patchProp }, nodeOps);
  const creatApp = (rootcomponent, rootProps) => {
      // 平台判断，创建一个渲染器
      const app = createRenderer(rendererOptions).createApp(rootcomponent, rootProps);
      const { mount } = app;
      app.mount = function (container) {
          // #app
          // 挂载组件
          // 1.先清空容器内的内容
          container = rendererOptions.querySelector(container);
          container.innerHTML = '';
          // 将组件的dom元素进行挂载
          mount(container);
      };
      return app;
  };

  exports.computed = computed;
  exports.creatApp = creatApp;
  exports.createRenderer = createRenderer;
  exports.effect = effect;
  exports.h = h;
  exports.readonly = readonly;
  exports.reative = reative;
  exports.ref = ref;
  exports.rendererOptions = rendererOptions;
  exports.shallowReactive = shallowReactive;
  exports.shallowReative = shallowReative;
  exports.toRef = toRef;
  exports.toRefs = toRefs;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=runtime-dom.global.js.map
