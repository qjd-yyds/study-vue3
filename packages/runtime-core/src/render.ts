import { ApiCreateApp } from './apiCreateApp';

/**
 * @description: 平台判断，创建渲染器
 * @return {Function} createApp 挂载函数
 */
export function createRenderer(rendererOptions) {
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
