// 操作节点增删改插
const doc = (typeof document !== 'undefined' ? document : null) as Document;
export const svgNS = 'http://www.w3.org/2000/svg';
export const nodeOps = {
  // 创建元素createElement
  createElement: (tag, isSVG, is, props): Element => {
    const el = isSVG ? doc.createElementNS(svgNS, tag) : doc.createElement(tag, is ? { is } : undefined);

    if (tag === 'select' && props && props.multiple != null) {
      (el as HTMLSelectElement).setAttribute('multiple', props.multiple);
    }

    return el;
  },
  // 删除一个元素
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  // 插入
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null); // appendchild
  },
  setElementText: (el, text) => {
    el.textContent = text;
  },
  // 选择
  querySelector: (selector) => doc.querySelector(selector),
  // ==>创建节点文本
  createText: (text) => doc.createTextNode(text),
  // 设置文本节点
  setText: (node, text) => {
    node.nodeValue = text;
  }
};
