// 打包
const fs = require('fs');
const execa = require('execa');
const dirs = fs.readdirSync('packages').filter((item) => {
  if (!fs.statSync(`packages/${item}`).isDirectory()) {
    return false;
  }
  return true;
});
// 打包
async function build(target) {
  console.log('开启并发子进程传递的target==>',target);
  // execa 开启子进程 rollup -c 执行
  await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'
  });
}
// 并行打包
async function runParaller(dirs, itemfn) {
  const result = [];
  for (let item of dirs) {
    result.push(itemfn(item));
  }
  return Promise.all(result);
}
runParaller(dirs, build).then(() => {
  console.log('打包成功');
});
