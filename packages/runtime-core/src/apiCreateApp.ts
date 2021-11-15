import { creatVnode } from './vnode';

/**
 * @description: 创建vnode
 * @param {*} render
 * @return {*}
 */
export function ApiCreateApp(render) {
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
