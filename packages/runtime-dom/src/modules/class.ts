/**
 * @description: 处理class
 * @param {Element} el 目标元素
 * @param {*} value class的类名
 * @return {*}
 */
export const patchClass = (el: Element, value) => {
  if (value == null) {
    value = '';
  }
  // 对标签的class赋值，如果有新的覆盖
  el.className = value;
};
