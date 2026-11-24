-- 账号、登录会话、大家分享的照片

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                -- 显示的用户名
  name_key TEXT NOT NULL UNIQUE,     -- 转成小写，用来判断重名
  pass TEXT NOT NULL,                -- pbkdf2$迭代次数$盐$哈希（不存明文密码）
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,       -- 只存登录令牌的 SHA-256，不存原文
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expires ON sessions(expires_at);

CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  thumb TEXT NOT NULL,               -- 256px JPEG（base64），挂在树上
  full TEXT NOT NULL                 -- 720px JPEG（base64），点开看大图；放在最后，列表查询不用读它
);
CREATE INDEX photos_user ON photos(user_id, id);

-- 防止暴力猜密码、刷注册：key → 次数，到 reset_at 后清零
CREATE TABLE throttle (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

-- photos_version：照片每次增删都 +1，用作照片列表的 ETag（没变化时浏览器直接用缓存）
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
INSERT INTO meta (key, value) VALUES ('photos_version', 0);
