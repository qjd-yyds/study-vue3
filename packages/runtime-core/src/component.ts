import { isFunction, isObject, ShapeFlags } from '@vue/shared';
import { componentPublicInstance } from './componentPublicInstance';
// 创建组件实例
export const createComponentInstance = (vnode) => {
  const instance = {
    vnode,
    type: vnode.type, // 组件的类型,用户自己写的
    props: {},
    attrs: {},
    data: { a: 1 },
    render: false,
    setupState: {}, // setup入口函数的状态
    ctx: {}, // 代理
    proxy: {},
    isMounted: false // 是否挂载
  };
  instance.ctx = {
    _: instance
  };
  return instance;
};

// 解析数据到组件实例
export const setupComponent = (instance) => {
  // 设置值
  const { props, children } = instance.vnode;
  instance.props = props;
  instance.children = children;
  console.log(children, '==>children');
  let isStateFul = instance.vnode.shapeFlag && ShapeFlags.STATEFUL_COMPONENT;
  if (isStateFul) {
    // 有的话就是有状态的组件
    setupStateComponent(instance);
  }
};
// 执行setup
function setupStateComponent(instance) {
  instance.proxy = new Proxy(instance.ctx, componentPublicInstance as any);
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
  } else {
    // setup没有，调用render
    finishComponentSetup(instance);
  }

  component.render(instance.proxy);
}
// 处理setup的返回结果
function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult; // 将setup返回的函数保存到实例上
    // 函数
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
  // 最终去执行render
  finishComponentSetup(instance);
}
// 处理render
function finishComponentSetup(instance) {
  let component = instance.type;
  // 判断setup是否有render
  if(!instance.render) {
    // 没有render
    // 进行模版编译
    if(!component.render && component.template) {
      // 模版变 ==>render
    }
    // 将实例上的setup放入render里
    instance.render = component.render;
  }
  console.log(instance.render.toString());
}
// 创建上下文 ctx
function createContext(instance) {
  return {
    attrs: instance.attrs,
    slot: instance.slots,
    emit: () => {},
    expose: () => {}
  };
}
export const setupRenderEffect = () => {};
