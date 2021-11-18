import { effect } from '@vue/reativity';
import { ShapeFlags } from '@vue/shared';
import { ApiCreateApp } from './apiCreateApp';
import { createComponentInstance, setupComponent } from './component';
import { CVnode, TEXT } from './vnode';
/**
 * @description: 平台判断，创建渲染器
 * @return {Function} createApp 挂载函数
 */
export function createRenderer(rendererOptions) {
  // 获取全部的dom操作

  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText
  } = rendererOptions;
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
      } else {
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
    } else {
      // 同一个元素
      console.log('同一个组件比对');
    }
  };
  // ----------------------处理文本
  function processText(n1, n2, container) {
    if (n1 == null) {
      hostInsert(hostCreateText(n2.children), container);
    } else {
      // 更新
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
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 文本，创建文本元素
        hostSetElementText(el, children);
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
    } else {
      // 更新
      console.log('同一个元素比对');
      patchElement(n1, n2, container);
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

      default:
        break;
    }
    if (shapeFlag & ShapeFlags.ELEMENT) {
      console.log('当前渲染的是元素');
      processeElement(n1, n2, container);
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
