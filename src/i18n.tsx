import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PhotoItem } from './gifts';

export type Lang = 'en' | 'zh';

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

const dict = { en, zh };
export type Dict = typeof en;
export type GestureKey = keyof Dict['gestures'];

const STORAGE_KEY = 'christmas-tree-lang';

const readLang = (): Lang => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'zh') return v;
  } catch {
    /* 隐私模式等情况下拿不到 localStorage，用默认值 */
  }
  return 'en';
};

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: 'en',
  t: dict.en,
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh' ? '圣诞记忆树' : 'Christmas Memory Tree';
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
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
export const photoName = (p: PhotoItem | undefined, lang: Lang) => (lang === 'en' ? p?.nameEn ?? p?.name : p?.name) ?? '';

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language / 语言">
      <button className={lang === 'en' ? 'is-active' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
        EN
      </button>
      <button className={lang === 'zh' ? 'is-active' : ''} aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>
        中
      </button>
    </div>
  );
}
