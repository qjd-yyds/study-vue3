import { isString, ShapeFlags, isObject, isFunction, isArray } from '@vue/shared';

/**
 * @description: 作用和h函数一样，创建vnode
 * @param {*} type 类型
 * @param {*} props 属性
 * @param {*} childen 插槽
 * @return { vnode } vnode
 */
// h('div',{},[])
export function creatVnode(
  type,
  props,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false
) {
  // 区分组件的虚拟dom还是普通元素
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;
  const vnode = {
    _v_isVnode: true,
    type,
    props,
    key: props && props.key, // diff算法
    el: null, // 和真实元素和dom对应
    shapeFlag
  };
  // children
  normalizeChildren(vnode, children);
  return vnode;
}

export function normalizeChildren(vnode, children) {
  let type = 0;
  if (children == null) {
    return;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag = vnode.shapeFlag | type;
}
