import { isObject } from '@vue/shared';
import { reativeHandlers,shallowReactiveHandlers,readonlyHandlers,shallowReativeHandlers } from './baseHandlers';
export function reative(target) {
  return createReativeObj(target, false, reativeHandlers);
}
export function shallowReactive(target) {
  return createReativeObj(target, false, shallowReactiveHandlers);
}
export function readonly(target) {
  return createReativeObj(target, true, readonlyHandlers);
}
export function shallowReative(target) {
  return createReativeObj(target, true, shallowReativeHandlers);
}

// 核心是proxy 采用柯里化根据不同参数处理
// 创建一个表来存储当前代理的对象
const reativeMap = new WeakMap(); // key必须为一个对象 自动垃圾回收
const readOnlyMap = new WeakMap(); // key必须为一个对象 自动垃圾回收
// 创建reative对象，返回一个proxy
function createReativeObj(target, isReadonly, baseHandlers) {
  if (!isObject(target)) {
    return target;
  }
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
