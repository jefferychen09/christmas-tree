import { useEffect, useRef } from 'react';

/** 按 Esc 关闭弹窗 */
export function useEscape(onEscape: () => void) {
  const latest = useRef(onEscape);
  latest.current = onEscape;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latest.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
