// 操作dom的文件

import { extend } from '@vue/shared';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

export const rendererOptions = extend({ patchProp }, nodeOps);
