import { ShapeFlags } from '@vue/shared';
import { ApiCreateApp } from './apiCreateApp';
import { createComponentInstance, setupComponent, setupRenderEffect } from './component';
/**
 * @description: 平台判断，创建渲染器
 * @return {Function} createApp 挂载函数
 */
export function createRenderer(rendererOptions) {
  const mountComponent = (initialVNode, container) => {
    // 组件初始化流程
    // 1.先有一个组件的对象render（proxy）
    const instance = (initialVNode.component = createComponentInstance(initialVNode));
    // 2.解析数据到实例对象
    setupComponent(instance);
    // 3.创建effect让render执行
    setupRenderEffect();
  };
  // 组件创建
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      // 第一次
      mountComponent(n2, container);
    } else {
      // 更新
    }
  };
  /**
   * @description: 实现渲染，组件初始化
   * @param {*} vnode 虚拟dom
   * @param {*} container 容器
   * @return {*} container
   */
  function render(vnode, container) {
    // 组件初始化
    /**
     * @description: 渲染
     * @param {*} n1 上一个节点
     * @param {*} n2 需要渲染的节点
     * @param {*} container 渲染的目标容器
     * @return {*}
     */
    function patch(n1, n2, container) {
      const { shapeFlag } = n2;
      if (shapeFlag & ShapeFlags.ELEMENT) {
        console.log('元素');
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        console.log('当前渲染的是组件');
        processComponent(n1, n2, container);
      }
    }
    // 渲染
    patch(null, vnode, container);
  }
  return {
    createApp: ApiCreateApp(render) // 创建vnode
  };
}
