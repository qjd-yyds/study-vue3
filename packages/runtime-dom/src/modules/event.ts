export const PatchEvent = (el, key, nextValue) => {
  // 1.函数缓存
  const invokers = el._vei || (el._vei = {});
  const exists = invokers[key];
  if (nextValue && exists) {
    // 原来有
    exists.value = nextValue;
  } else {
    // 事件名字
    const eventName = key.slice(2).toLowerCase();
    if (nextValue) {
      // 1.新的有
      let invoker = (invokers[eventName] = createInvoker(nextValue));
      el.addEventListener(eventName, invoker);
    } else {
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
