// 判断是否对象
// 合并对象
const extend = Object.assign;

// 操作节点增删改插
const doc = (typeof document !== 'undefined' ? document : null);
const svgNS = 'http://www.w3.org/2000/svg';
const nodeOps = {
    // 创建元素createElement
    createElement: (tag, isSVG, is, props) => {
        const el = isSVG ? doc.createElementNS(svgNS, tag) : doc.createElement(tag, is ? { is } : undefined);
        if (tag === 'select' && props && props.multiple != null) {
            el.setAttribute('multiple', props.multiple);
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

/**
 * @description: 自定义属性
 * @param {*} el 目标元素
 * @param {*} el 属性
 * @param {*} value 设置的值
 */
const patchAttr = (el, key, value) => {
    if (value == null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, value);
    }
};

/**
 * @description: 处理class
 * @param {Element} el 目标元素
 * @param {*} value class的类名
 * @return {*}
 */
const patchClass = (el, value) => {
    if (value == null) {
        value = '';
    }
    // 对标签的class赋值，如果有新的覆盖
    el.className = value;
};

const PatchEvent = (el, key, nextValue) => {
    // 1.函数缓存
    const invokers = el._vei || (el._vei = {});
    const exists = invokers[key];
    if (exists && nextValue) {
        exists.value = nextValue;
        // 原来有
    }
    else {
        const eventName = key.slice(2).toLowerCase();
        if (nextValue) {
            // 1.新的有
            let invoker = (invokers[eventName] = createInvoker(nextValue));
            el.addEventListener(eventName, invoker);
        }
        else {
            // 2.新的没有
            el.removeEventListener(eventName, exists);
            invokers[eventName] = undefined;
        }
    }
};
function createInvoker(value) {
    const invoker = (e) => {
        invoker.value(e);
    };
    invoker.value = value;
    return invoker;
}
// 事件处理
// 1.给元素缓存一个绑定事件的列表
// 2.如果缓存中没有，但是value有值，绑定事件并且缓存当前事件
// 3.以前绑定过，删除缓存，讲value缓存
// 4.两个都有，直接改变invoker里的value

/**
 * @description: style的处理
 * @param {*} el 目标元素
 * @param {*} prev 之前的值
 * @param {*} next 修改的值
 */
const patchStyle = (el, prev, next) => {
    const style = el.style;
    if (next == null) {
        // 删除
        el.removeAttribute('style');
    }
    else {
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

// 属性操作 ，策略模式
function patchProp(el, key, prevValue, nextValue) {
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
            }
            else {
                // 否则为属性
                patchAttr(el, key, nextValue);
            }
            break;
    }
}

// 操作dom的文件
const rendererOptions = extend({ patchProp }, nodeOps);

export { rendererOptions };
//# sourceMappingURL=runtime-dom.esm-bundler.js.map
