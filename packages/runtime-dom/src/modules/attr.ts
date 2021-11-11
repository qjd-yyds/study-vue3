/**
 * @description: 自定义属性
 * @param {*} el 目标元素
 * @param {*} el 属性
 * @param {*} value 设置的值
 */
export const patchAttr = (el: Element, key, value) => {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
};
