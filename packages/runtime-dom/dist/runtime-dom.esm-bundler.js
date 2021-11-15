// 判断是否对象
const isObject = (val) => val !== null && typeof val === 'object';
// 合并对象
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isString = (val) => typeof val === 'string';
// 判断是否存在属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);

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
    if (nextValue && exists) {
        // 原来有
        exists.value = nextValue;
    }
    else {
        // 事件名字
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

/**
 * @description: 作用和h函数一样，创建vnode
 * @param {*} type 类型
 * @param {*} props 属性
 * @param {*} childen 插槽
 * @return { vnode } vnode
 */
// h('div',{},[])
function creatVnode(type, props, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
    // 区分组件的虚拟dom还是普通元素
    const shapeFlag = isString(type)
        ? 1 /* ELEMENT */
        : isObject(type)
            ? 4 /* STATEFUL_COMPONENT */
            : isFunction(type)
                ? 2 /* FUNCTIONAL_COMPONENT */
                : 0;
    const vnode = {
        _v_isVnode: true,
        type,
        props,
        children,
        key: props && props.key,
        el: null,
        component: null,
        shapeFlag // 判断类型
    };
    // children
    normalizeChildren(vnode, children);
    return vnode;
}
function normalizeChildren(vnode, children) {
    let type = 0;
    if (children == null) {
        return;
    }
    else if (isArray(children)) {
        type = 16 /* ARRAY_CHILDREN */;
    }
    else {
        type = 8 /* TEXT_CHILDREN */;
    }
    vnode.shapeFlag = vnode.shapeFlag | type;
}

/**
 * @description: 创建vnode
 * @param {*} render
 * @return {*}
 */
function ApiCreateApp(render) {
    return function creatApp(rootcomponent, rootProps) {
        const app = {
            _component: rootcomponent,
            _props: rootProps,
            _container: null,
            mount(container) {
                // 创建vnode
                let vnode = creatVnode(rootcomponent, rootProps);
                // 渲染
                render(vnode, container);
            }
        };
        return app;
    };
}

const componentPublicInstance = {
    get({ _: instance }, key) {
        const { props, setupState, data } = instance;
        if (key[0] === '$') {
            // $开头的不能获取
            return;
        }
        if (hasOwn(props, key)) {
            return props[key];
        }
        else if (hasOwn(setupState, key)) {
            return setupState[key];
        }
    },
    set({ _: instance }, key, value) {
        const { props, setupState, data } = instance;
        if (hasOwn(props, key)) {
            props[key] = value;
        }
        else if (hasOwn(setupState, key)) {
            setupState[key] = value;
        }
    }
};

// 创建组件实例
const createComponentInstance = (vnode) => {
    const instance = {
        vnode,
        type: vnode.type,
        props: {},
        attrs: {},
        data: { a: 1 },
        render: false,
        setupState: {},
        ctx: {},
        proxy: {},
        isMounted: false // 是否挂载
    };
    instance.ctx = {
        _: instance
    };
    return instance;
};
// 解析数据到组件实例
const setupComponent = (instance) => {
    // 设置值
    const { props, children } = instance.vnode;
    instance.props = props;
    instance.children = children;
    console.log(children, '==>children');
    let isStateFul = instance.vnode.shapeFlag && 4 /* STATEFUL_COMPONENT */;
    if (isStateFul) {
        // 有的话就是有状态的组件
        setupStateComponent(instance);
    }
};
// 执行setup
function setupStateComponent(instance) {
    instance.proxy = new Proxy(instance.ctx, componentPublicInstance);
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
    }
    else {
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
    }
    else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    // 最终去执行render
    finishComponentSetup(instance);
}
// 处理render
function finishComponentSetup(instance) {
    let component = instance.type;
    // 判断setup是否有render
    if (!instance.render) {
        // 没有render
        // 进行模版编译
        if (!component.render && component.template) ;
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
        emit: () => { },
        expose: () => { }
    };
}

/**
 * @description: 平台判断，创建渲染器
 * @return {Function} createApp 挂载函数
 */
function createRenderer(rendererOptions) {
    const mountComponent = (initialVNode, container) => {
        // 组件初始化流程
        // 1.先有一个组件的对象render（proxy）
        const instance = (initialVNode.component = createComponentInstance(initialVNode));
        // 2.解析数据到实例对象
        setupComponent(instance);
    };
    // 组件创建
    const processComponent = (n1, n2, container) => {
        if (n1 == null) {
            // 第一次
            mountComponent(n2);
        }
    };
    /**
     * @description: 实现渲染，组件初始化
     * @param {*} vnode 虚拟dom
     * @param {*} container 容器
     * @return {*} container
     */
    function render(vnode, container) {
        // 组件初始化
        /**
         * @description: 渲染
         * @param {*} n1 上一个节点
         * @param {*} n2 需要渲染的节点
         * @param {*} container 渲染的目标容器
         * @return {*}
         */
        function patch(n1, n2, container) {
            const { shapeFlag } = n2;
            if (shapeFlag & 1 /* ELEMENT */) {
                console.log('元素');
            }
            else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                console.log('当前渲染的是组件');
                processComponent(n1, n2);
            }
        }
        // 渲染
        patch(null, vnode);
    }
    return {
        createApp: ApiCreateApp(render) // 创建vnode
    };
}

// 操作dom的文件
const rendererOptions = extend({ patchProp }, nodeOps);
const creatApp = (rootcomponent, rootProps) => {
    // 平台判断，创建一个渲染器
    const app = createRenderer().createApp(rootcomponent, rootProps);
    const { mount } = app;
    app.mount = function (container) {
        // #app
        // 挂载组件
        // 1.先清空容器内的内容
        container = rendererOptions.querySelector(container);
        container.innerHTML = '';
        // 将组件的dom元素进行挂载
        mount(container);
    };
    return app;
};

export { creatApp, rendererOptions };
//# sourceMappingURL=runtime-dom.esm-bundler.js.map
