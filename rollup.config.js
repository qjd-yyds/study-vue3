import ts from 'rollup-plugin-typescript2'; // 解析ts
import json from '@rollup/plugin-json'; // 解析
import resolvePlugin from '@rollup/plugin-node-resolve'; // 解析第三方
import path from 'path'; // 处理路径
// 获取文件路径
let packagesDirs = path.resolve(__dirname, 'packages');

// 获取需要打包的包

let packageDir = path.resolve(packagesDirs, process.env.TARGET);

const resolve = (p) => path.resolve(packageDir, p); // 只想自身包路径
const pkg = require(resolve(`package.json`)); // 获取每个包的json
const packageOptions = pkg.buildOptions || {}; // 获取配置
const name = path.basename(packageDir);
console.log('需要的包配置=>>', packageOptions);

// 创建一个映射表
const outputOptions = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es'
  },
  "cjs": {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  "global": {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
};

const options = pkg.buildOptions;
// 导出配置
function createOptions(format, output) {
  // 进行打包
  output.name = options.name;
  output.sourcemap = true;
  // 生成rollup配置
  return {
    input: resolve('src/index.ts'), // 入口
    output,
    plugins: [
      json(),
      ts({
        // 解析ts
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }),
      resolvePlugin() // 解析第三方包
    ]
  };
}

export default options.formats.map((format) => createOptions(format, outputOptions[format]));
