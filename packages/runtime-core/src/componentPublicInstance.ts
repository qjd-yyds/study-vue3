import { hasOwn } from '@vue/shared';

export const componentPublicInstance = {
  get({ _: instance }, key) {
    const { props, setupState, data } = instance;
    if (key[0] === '$') {
      // $开头的不能获取
      return;
    }
    if (hasOwn(props, key)) {
      return props[key];
    } else if (hasOwn(setupState, key)) {
      return setupState[key];
    }
  },
  set({ _: instance }, key, value) {
    const { props, setupState, data } = instance;
    if (hasOwn(props, key)) {
      props[key] = value;
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value;
    }
  }
};
