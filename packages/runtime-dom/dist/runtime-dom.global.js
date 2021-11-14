var VueRuntimeDom = (function (exports) {
  'use strict';

  // 判断是否对象
  const isObject = (val) => val !== null && typeof val === 'object';
  // 合并对象
  const extend = Object.assign;
  const isArray = Array.isArray;
  const isFunction = (val) => typeof val === 'function';
  const isString = (val) => typeof val === 'string';

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
          key: props && props.key,
          el: null,
          shapeFlag
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
                  console.log(vnode, 'vnode');
                  // 渲染
                  render(vnode, container);
              }
          };
          return app;
      };
  }

  /**
   * @description: 平台判断，创建渲染器
   * @return {Function} createApp 挂载函数
   */
  function createRenderer(rendererOptions) {
      /**
       * @description: 实现渲染，组件初始化
       * @param {*} vnode 虚拟dom
       * @param {*} container 容器
       * @return {*} container
       */
      function render(vnode, container) {
          // 组件初始化
      }
      return {
          createApp: ApiCreateApp(render) // 创建vnode
      };
  }

  // 操作dom的文件
  const rendererOptions = extend({ patchProp }, nodeOps);
  const creatApp = (rootcomponent, rootProps) => {
      // 平台判断，创建一个渲染器
      const app = createRenderer().createApp(rootcomponent, rootProps);
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

  exports.creatApp = creatApp;
  exports.rendererOptions = rendererOptions;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=runtime-dom.global.js.map
