/**
 * @description: style的处理
 * @param {*} el 目标元素
 * @param {*} prev 之前的值
 * @param {*} next 修改的值
 */
export const patchStyle = (el: Element, prev, next) => {
  const style = (el as HTMLElement).style;
  if (next == null) {
    // 删除
    el.removeAttribute('style');
  } else {
    // 老的有，新的没有
    if (prev) {
      for (let key in prev) {
        if (next[key] == null) {
          style[key] = '';
        }
      }
    }
    // 老的没有，新的有
    for (let key in next) {
      style[key] = next[key];
    }
  }
};
