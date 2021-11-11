// 属性操作 ，策略模式
import { patchAttr } from './modules/attr';
import { patchClass } from './modules/class';
import { PatchEvent } from './modules/event';
import { patchStyle } from './modules/style';
export function patchProp(el, key, prevValue, nextValue) {
  switch (key) {
    case 'class':
      patchClass(el, nextValue);
      break;
    case 'style':
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      // 判断是不是事件
      if (/^on[^a-z]/.test(key)) {
        // 事件
        PatchEvent(el, key, nextValue);
      } else {
        // 否则为属性
        patchAttr(el, key, nextValue);
      }

      break;
  }
}
