/** 手机、平板等触屏设备（没有鼠标悬停、主要靠手指操作） */
export const IS_TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;
