import { useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cx, navigateTo } from '../shared/helpers';
import { variants } from '../shared/constants';
import { usePrototypeSearch } from '../hooks/use-prototype-search';
import type { Variant } from '../shared/types';
import styles from '../prototype.module.css';
export function PrototypeSwitcher({ current }: { current: Variant }) {
  const search = usePrototypeSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const index = variants.findIndex((item) => item.key === current);
  const move = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    const query = new URLSearchParams(params.toString());
    query.set('variant', next.key);
    navigateTo(window.location.pathname + '?' + query.toString(), true);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
  const meta = variants[index];
  return (
    <div className={styles.switcher} aria-label="Prototype variant switcher">
      <button type="button" onClick={() => move(-1)} aria-label="Previous prototype variant"><ArrowLeft size={16} strokeWidth={1.7} /></button>
      <div><strong>{meta.key} — {meta.name}</strong><span>{meta.note}</span></div>
      <button type="button" onClick={() => move(1)} aria-label="Next prototype variant"><ArrowRight size={16} strokeWidth={1.7} /></button>
    </div>
  );
}
