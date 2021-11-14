// 操作dom的文件

import { extend } from '@vue/shared';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';
import { createRenderer } from '@vue/runtime-core';
export const rendererOptions = extend({ patchProp }, nodeOps);

export const creatApp = (rootcomponent, rootProps) => {
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
