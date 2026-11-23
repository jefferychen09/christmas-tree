import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PhotoItem } from './gifts';

export type Lang = 'en' | 'zh' | 'ja';
export const LANGS: Lang[] = ['en', 'zh', 'ja'];

const en = {
  eyebrow: 'Christmas Memory Tree',
  subtitle: 'Choose how to decorate your tree',
  uploadTitle: 'Use my photos',
  uploadDesc: 'Your photos become polaroids hanging on the tree. Tap one to see it up close.',
  choosePhotos: 'Choose photos',
  addMore: 'Add more',
  processing: 'Processing…',
  decorateWith: (n: number) => (n ? `Decorate with ${n} photo${n > 1 ? 's' : ''}` : 'Decorate the tree'),
  uploadHint: 'You can also drag photos here. Photos stay in your browser and are never uploaded.',
  uploadHintTouch: 'Photos stay in your browser and are never uploaded.',
  defaultTitle: 'Use the gift set',
  defaultDesc: 'The tree fills with Christmas gift pictures. Tap a picture to enlarge it, or tap a gift box to unwrap a surprise.',
  start: 'Start',
  close: 'Close',
  remove: 'Remove',
  prev: 'Previous',
  next: 'Next',
  hintPhoto: 'Tap a photo to enlarge',
  hintGift: 'Tap a gift box to unwrap 🎁',
  hintStar: 'Tap the star ⭐',
  hintDrag: 'Drag to rotate · scroll to zoom',
  hintDragTouch: 'Drag to rotate · pinch to zoom',
  statMemories: 'Memories',
  statGifts: 'Gifts',
  unitPhotos: 'photos',
  unitGifts: 'gifts',
  changePhotos: '🖼 Change photos',
  gestureOn: '✋ Gestures',
  gestureOff: '✋ Stop gestures',
  cameraShow: '📹 Camera view',
  cameraHide: '📹 Hide camera',
  gestureTip: 'Open palm: scatter · Fist: assemble · Move hand: rotate',
  assemble: '✨ Assemble',
  scatter: '💫 Scatter',
  unwrapping: 'Unwrapping…',
  youGot: (name: string) => `🎉 You got: ${name}`,
  surprise: 'a surprise',
  keepIt: 'Keep it',
  another: 'Open another',
  statusLoading: 'Downloading the gesture model…',
  statusCamera: 'Waiting for camera permission…',
  statusReady: 'Gestures ready: show your hand to the camera',
  statusTracking: 'Hand detected',
  statusDenied: 'Camera permission was denied. Allow camera access in the browser and try again.',
  statusError: (m: string) => `Gestures failed: ${m}`,
  guideTitle: 'Gestures',
  guideTryHint: 'Tap a row to try it',
  loveMessage: 'Merry Christmas 🎄',
  // 贺卡
  cardCtaTitle: 'Send someone a Christmas card',
  cardCtaDesc: 'Write a few words and get a link. When they open it, the tree lights up and your card is waiting.',
  writeCard: '💌 Write a card',
  sendCard: '💌 Send a card',
  reopenCard: '💌 Card',
  composerTitle: 'Write a Christmas card',
  toLabel: 'To',
  toPlaceholder: 'Their name',
  msgLabel: 'Message',
  msgPlaceholder: 'Write something warm…',
  fromLabel: 'From',
  fromPlaceholder: 'Your name (optional)',
  samplesLabel: 'Need an idea?',
  samples: [
    'Wishing you a cozy Christmas and a bright new year.',
    'Thank you for every bit of warmth this year. Merry Christmas!',
    'May your days be merry and your nights full of lights.',
  ],
  createLink: 'Create link',
  needFields: 'Add a name and a message first',
  linkReady: 'Your link is ready',
  linkHint: 'Send it to them in any chat. The link carries your words, and the tree is decorated with the gift set. Photos you uploaded stay on this device.',
  copy: 'Copy link',
  copied: 'Copied ✓',
  copyFail: 'Select the link above and copy it',
  preview: 'Open it',
  edit: 'Edit',
  cardYear: (y: number) => `Christmas · ${y}`,
  dear: (name: string) => `Dear ${name},`,
  signed: (name: string) => `— ${name}`,
  envelopeFor: (name: string) => `For ${name}`,
  tapToOpen: 'Tap to open',
  exploreTree: 'See the tree',
  makeOwn: 'Write my own',
  gestures: {
    Closed_Fist: ['✊', 'Fist', 'Assemble the tree'],
    Open_Palm: ['🖐', 'Open palm', 'Scatter the tree'],
    MoveX: ['↔️', 'Move hand left / right', 'Rotate the tree'],
    MoveY: ['↕️', 'Move hand up / down', 'Tilt the view'],
    Pinch: ['🤏', 'Pinch / spread thumb and index', 'Zoom out / zoom in'],
    Pointing_Up: ['☝️', 'Point up', 'Unwrap a gift'],
    Victory: ['✌️', 'Victory', 'Show a random photo'],
    Thumb_Up: ['👍', 'Thumb up', 'Next photo / another gift'],
    Thumb_Down: ['👎', 'Thumb down', 'Close the popup'],
    ILoveYou: ['🤟', 'Surprise sign', 'Fireworks surprise'],
  },
};

const zh: typeof en = {
  eyebrow: 'Christmas Memory Tree',
  subtitle: '选择用什么装饰你的圣诞树',
  uploadTitle: '上传我的照片',
  uploadDesc: '照片会变成挂在树上的拍立得，点一下就能放大看',
  choosePhotos: '选择照片',
  addMore: '继续添加',
  processing: '处理中…',
  decorateWith: (n: number) => (n ? `用 ${n} 张照片装饰` : '用照片装饰圣诞树'),
  uploadHint: '也可以把照片直接拖到这里 · 照片只在你的浏览器里处理，不会上传到服务器',
  uploadHintTouch: '照片只在你的浏览器里处理，不会上传到服务器',
  defaultTitle: '使用默认礼品',
  defaultDesc: '树上挂满各种圣诞礼品图，点开放大；点礼盒还能拆出随机礼物',
  start: '直接开始',
  close: '关闭',
  remove: '移除',
  prev: '上一张',
  next: '下一张',
  hintPhoto: '点照片放大',
  hintGift: '点礼盒拆礼物 🎁',
  hintStar: '点星星有惊喜 ⭐',
  hintDrag: '拖动旋转 · 滚轮缩放',
  hintDragTouch: '拖动旋转 · 双指缩放',
  statMemories: 'Memories',
  statGifts: 'Gifts',
  unitPhotos: '张照片',
  unitGifts: '种礼品',
  changePhotos: '🖼 更换照片',
  gestureOn: '✋ 手势控制',
  gestureOff: '✋ 关闭手势',
  cameraShow: '📹 摄像头画面',
  cameraHide: '📹 隐藏画面',
  gestureTip: '张开手掌：散开 · 握拳：聚合 · 移动手：旋转',
  assemble: '✨ 聚合成树',
  scatter: '💫 散开',
  unwrapping: '正在拆礼物…',
  youGot: (name: string) => `🎉 你拆到了：${name}`,
  surprise: '一份惊喜',
  keepIt: '收下啦',
  another: '再拆一个',
  statusLoading: '正在下载手势识别模型…',
  statusCamera: '正在请求摄像头权限…',
  statusReady: '手势已就绪：请把手放到摄像头前',
  statusTracking: '已识别到手',
  statusDenied: '摄像头权限被拒绝，请在浏览器里允许使用摄像头后重试',
  statusError: (m: string) => `手势启动失败：${m}`,
  guideTitle: '手势说明',
  guideTryHint: '点一行可以直接试试',
  loveMessage: '圣诞快乐 🎄',
  cardCtaTitle: '给 TA 寄一张圣诞贺卡',
  cardCtaDesc: '写几句话，生成一个专属链接。TA 打开时，圣诞树亮起，你的贺卡就在那里等着。',
  writeCard: '💌 写贺卡',
  sendCard: '💌 寄贺卡',
  reopenCard: '💌 贺卡',
  composerTitle: '写一张圣诞贺卡',
  toLabel: '写给',
  toPlaceholder: 'TA 的名字',
  msgLabel: '想说的话',
  msgPlaceholder: '写点温暖的话…',
  fromLabel: '署名',
  fromPlaceholder: '你的名字（可不填）',
  samplesLabel: '没想好？试试这些',
  samples: ['愿你圣诞温暖，新年闪闪发光。', '谢谢你这一年的陪伴，圣诞快乐！', '把今年最亮的那颗星送给你。'],
  createLink: '生成专属链接',
  needFields: '先填好名字和想说的话',
  linkReady: '链接已生成',
  linkHint: '发到微信或任何聊天里都可以。链接里带着你写的话，圣诞树用默认礼品装饰；你上传的照片只留在这台设备上。',
  copy: '复制链接',
  copied: '已复制 ✓',
  copyFail: '请手动选中上面的链接复制',
  preview: '打开看看',
  edit: '修改',
  cardYear: (y: number) => `Christmas · ${y}`,
  dear: (name: string) => `亲爱的 ${name}：`,
  signed: (name: string) => `—— ${name}`,
  envelopeFor: (name: string) => `给 ${name}`,
  tapToOpen: '点一下拆开',
  exploreTree: '去看圣诞树',
  makeOwn: '我也写一张',
  gestures: {
    Closed_Fist: ['✊', '握拳', '聚合成树'],
    Open_Palm: ['🖐', '张开手掌', '散开'],
    MoveX: ['↔️', '手左右移动', '旋转圣诞树'],
    MoveY: ['↕️', '手上下移动', '俯仰视角'],
    Pinch: ['🤏', '拇指食指捏合 / 张开', '拉远 / 拉近'],
    Pointing_Up: ['☝️', '食指朝上', '拆一个礼物'],
    Victory: ['✌️', '剪刀手', '随机放大一张照片'],
    Thumb_Up: ['👍', '点赞', '下一张 / 再拆一个'],
    Thumb_Down: ['👎', '拇指朝下', '关闭弹窗'],
    ILoveYou: ['🤟', '彩蛋手势', '烟花彩蛋'],
  },
};

const ja: typeof en = {
  eyebrow: 'Christmas Memory Tree',
  subtitle: 'ツリーの飾りつけを選んでください',
  uploadTitle: '自分の写真を使う',
  uploadDesc: '写真がツリーに吊るされたポラロイドになります。タップすると大きく見られます。',
  choosePhotos: '写真を選ぶ',
  addMore: '写真を追加',
  processing: '処理中…',
  decorateWith: (n: number) => (n ? `${n} 枚の写真で飾る` : '写真でツリーを飾る'),
  uploadHint: 'ここに写真をドラッグしてもOK · 写真はブラウザの中だけで処理され、サーバーには送信されません',
  uploadHintTouch: '写真はブラウザの中だけで処理され、サーバーには送信されません',
  defaultTitle: 'ギフトセットを使う',
  defaultDesc: 'クリスマスギフトのイラストでツリーがいっぱいに。タップで拡大、プレゼント箱をタップするとサプライズが出てきます。',
  start: 'はじめる',
  close: '閉じる',
  remove: '削除',
  prev: '前へ',
  next: '次へ',
  hintPhoto: '写真をタップで拡大',
  hintGift: 'プレゼント箱をタップ 🎁',
  hintStar: '星をタップしてみて ⭐',
  hintDrag: 'ドラッグで回転 · スクロールでズーム',
  hintDragTouch: 'ドラッグで回転 · ピンチでズーム',
  statMemories: 'Memories',
  statGifts: 'Gifts',
  unitPhotos: '枚',
  unitGifts: '種類',
  changePhotos: '🖼 写真を変更',
  gestureOn: '✋ ジェスチャー',
  gestureOff: '✋ ジェスチャーをオフ',
  cameraShow: '📹 カメラ映像',
  cameraHide: '📹 映像を隠す',
  gestureTip: '手を開く：散らす · グー：集める · 手を動かす：回転',
  assemble: '✨ ツリーにする',
  scatter: '💫 散らす',
  unwrapping: '開けています…',
  youGot: (name: string) => `🎉 ${name} が出ました！`,
  surprise: 'サプライズ',
  keepIt: 'もらっておく',
  another: 'もう一つ開ける',
  statusLoading: 'ジェスチャーモデルをダウンロード中…',
  statusCamera: 'カメラの許可を待っています…',
  statusReady: '準備OK：カメラに手を映してください',
  statusTracking: '手を認識しました',
  statusDenied: 'カメラの使用が拒否されました。ブラウザでカメラを許可してから、もう一度お試しください。',
  statusError: (m: string) => `ジェスチャーを開始できませんでした：${m}`,
  guideTitle: 'ジェスチャー',
  guideTryHint: '行をタップすると試せます',
  loveMessage: 'メリークリスマス 🎄',
  cardCtaTitle: '大切な人にクリスマスカードを',
  cardCtaDesc: 'ひとこと書くとリンクができます。相手が開くとツリーが灯り、あなたのカードが待っています。',
  writeCard: '💌 カードを書く',
  sendCard: '💌 カードを送る',
  reopenCard: '💌 カード',
  composerTitle: 'クリスマスカードを書く',
  toLabel: 'あて先',
  toPlaceholder: '相手の名前',
  msgLabel: 'メッセージ',
  msgPlaceholder: 'あたたかい言葉をどうぞ…',
  fromLabel: '差出人',
  fromPlaceholder: 'あなたの名前（省略可）',
  samplesLabel: '迷ったらこちら',
  samples: ['あたたかいクリスマスと、輝く新年を。', '今年もたくさんありがとう。メリークリスマス！', '今年いちばん明るい星をあなたに。'],
  createLink: 'リンクを作成',
  needFields: '名前とメッセージを入力してください',
  linkReady: 'リンクができました',
  linkHint: 'LINE などのチャットで送ってください。リンクにはあなたの言葉が入っていて、ツリーはギフトセットで飾られます。アップロードした写真はこの端末にだけ残ります。',
  copy: 'リンクをコピー',
  copied: 'コピーしました ✓',
  copyFail: '上のリンクを選択してコピーしてください',
  preview: '開いてみる',
  edit: '編集',
  cardYear: (y: number) => `Christmas · ${y}`,
  dear: (name: string) => `${name} へ`,
  signed: (name: string) => `${name} より`,
  envelopeFor: (name: string) => `${name} へ`,
  tapToOpen: 'タップして開ける',
  exploreTree: 'ツリーを見る',
  makeOwn: '自分も書く',
  gestures: {
    Closed_Fist: ['✊', 'グー', 'ツリーにする'],
    Open_Palm: ['🖐', 'パー', '散らす'],
    MoveX: ['↔️', '手を左右に動かす', 'ツリーを回転'],
    MoveY: ['↕️', '手を上下に動かす', '視点を上下に'],
    Pinch: ['🤏', '親指と人差し指をつまむ / 広げる', 'ズームアウト / ズームイン'],
    Pointing_Up: ['☝️', '人差し指を立てる', 'プレゼントを開ける'],
    Victory: ['✌️', 'ピース', 'ランダムに写真を表示'],
    Thumb_Up: ['👍', 'いいね', '次の写真 / もう一つ開ける'],
    Thumb_Down: ['👎', '親指を下に', 'ポップアップを閉じる'],
    ILoveYou: ['🤟', 'サプライズサイン', '花火のサプライズ'],
  },
};

const dict = { en, zh, ja };
export type Dict = typeof en;
export type GestureKey = keyof Dict['gestures'];

const STORAGE_KEY = 'christmas-tree-lang';

const readLang = (): Lang => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (LANGS as string[]).includes(v)) return v as Lang;
  } catch {
    /* 隐私模式等情况下拿不到 localStorage，用默认值 */
  }
  return 'en';
};

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang, persist?: boolean) => void }>({
  lang: 'en',
  t: dict.en,
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = { en: 'en', zh: 'zh-CN', ja: 'ja' }[lang];
    document.title = { en: 'Christmas Memory Tree', zh: '圣诞记忆树', ja: 'クリスマス・メモリーツリー' }[lang];
  }, [lang]);

  // persist=false：只切换这一次（例如打开别人用中文写的贺卡），不改掉访客自己记住的语言
  const setLang = (l: Lang, persist = true) => {
    setLangState(l);
    if (!persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* 忽略 */
    }
  };

  return <LangContext.Provider value={{ lang, t: dict[lang], setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** 礼品/照片在当前语言下的名字 */
export const photoName = (p: PhotoItem | undefined, lang: Lang) =>
  (lang === 'en' ? p?.nameEn ?? p?.name : lang === 'ja' ? p?.nameJa ?? p?.nameEn ?? p?.name : p?.name) ?? '';

export function LangToggle() {
  const { lang, setLang } = useLang();
  const labels: Record<Lang, [string, string]> = { en: ['EN', 'English'], zh: ['中', '中文'], ja: ['日', '日本語'] };
  return (
    <div className="lang-toggle" role="group" aria-label="Language / 语言 / 言語">
      {LANGS.map((l) => (
        <button
          key={l}
          className={lang === l ? 'is-active' : ''}
          aria-pressed={lang === l}
          aria-label={labels[l][1]}
          lang={l}
          onClick={() => setLang(l)}
        >
          {labels[l][0]}
        </button>
      ))}
    </div>
  );
}
