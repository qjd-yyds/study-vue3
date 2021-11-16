import { isArray, isObject } from '@vue/shared';
import { creatVnode, isVnode } from './vnode';

export function h(type, propsOrChildren, childen = null) {
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
    } else {
      return creatVnode(type, null, propsOrChildren); // 是儿子
    }
  } else {
    if (i > 3) {
      // h('div',{},'1','2')
      // 超过三个的
      childen = Array.prototype.slice.call(arguments, 2); // 从第二个开始切割
    } else if (i === 3 && isVnode(childen)) {
      childen = [childen]; // h('div',{},h('div'))
    }
    return creatVnode(type, propsOrChildren, childen);
  }
}
