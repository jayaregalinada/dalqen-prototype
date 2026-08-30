import type { DemoOrder, DemoProject } from '../shared/types';
export function formatDate(value: string) {
  if (!value) return 'No due date';
  const date = new Date(value + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const key = date.toDateString();
  if (key === today.toDateString()) return 'Today';
  if (key === tomorrow.toDateString()) return 'Tomorrow';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}
export function orderStatus(order: DemoOrder) {
  if (order.qcStatus === 'Issue') return 'QC issue';
  if (order.stage === 'Completed') return 'Released';
  if (order.stage === 'For Release') return 'Ready for release';
  if (order.stage === 'Approval') return 'Waiting approval';
  return 'In production';
}
export function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}
export const navigationEvent = 'dalqen:prototype-navigation';
export function navigateTo(href: string, replace = false) {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', href);
  window.dispatchEvent(new Event(navigationEvent));
  window.scrollTo({ top: 0, behavior: 'instant' });
}
