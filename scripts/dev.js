// 打包
const execa = require('execa');
// 打包
async function build(target) {
  console.log('开启并发子进程传递的target==>',target);
  // execa 开启子进程 rollup -c 自动检测
  await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'
  });
}
build("reativity")