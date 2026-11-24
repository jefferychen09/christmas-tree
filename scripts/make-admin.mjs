// 把一个已注册的用户设为管理员（可以删除任何人的照片、帮别人重置密码）
//
//   npm run admin -- 用户名            线上网站的数据库
//   npm run admin -- 用户名 --local    本地测试数据库
//   npm run admin -- 用户名 --remove   取消管理员
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const local = args.includes('--local');
const remove = args.includes('--remove');
// 和服务器一样处理用户名：全角转半角、去掉首尾空格、多个空格合成一个、不区分大小写
const name = args
  .filter((a) => !a.startsWith('--'))
  .join(' ')
  .normalize('NFKC')
  .trim()
  .replace(/\s+/g, ' ');

if (!name) {
  console.error('用法：npm run admin -- 用户名 [--local] [--remove]');
  process.exit(1);
}

const key = name.toLowerCase().replace(/'/g, "''");
const sql =
  `UPDATE users SET is_admin = ${remove ? 0 : 1} WHERE name_key = '${key}'; ` +
  `SELECT name, is_admin FROM users WHERE name_key = '${key}';`;

execFileSync('npx', ['wrangler', 'd1', 'execute', 'christmas-tree', local ? '--local' : '--remote', '--command', sql], {
  stdio: 'inherit',
});
console.log(`\n如果上面的结果里没有「${name}」，说明这个用户名还没注册。`);
