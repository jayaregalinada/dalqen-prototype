import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export type DemoProject = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  route: string;
  stage: string;
  assignee: string;
  department: string;
  paid: boolean;
  qcStatus: 'Pending' | 'Passed' | 'Issue';
  custom: Record<string, string>; // Line Up template/order column values for this item
};

export type DemoComment = {
  id: string;
  author: string;
  html: string; // sanitized rich text (Overview-style editor output)
  createdAt: string;
};

export type DemoOrder = {
  id: string;
  ref: string;
  customer: string;
  title: string;
  dueDate: string;
  priority: 'Normal' | 'Urgent';
  contact: string;
  category: string;
  orderType: string;
  overview: string; // sanitized HTML from the overview editor
  createdAt: string;
  discussion: DemoComment[]; // Jira-style comment thread
  assignedArtistId: string; // "" = none; the artist who can see this order and join its discussion
  projects: DemoProject[];
  lineUpTemplateName: string; // which saved template this order's Line Up uses
  lineUpColumns: string[]; // per-order columns added on top of the chosen template
};

export type DemoState = {
  version: 2;
  orders: DemoOrder[];
  notice: string;
  categories: string[];
  orderTypes: Record<string, string[]>;
  lineUpTemplates: Record<string, string[]>; // saved Line Up table templates
};

export const defaultCategories = ['Apparel', 'Print', 'Tarpaulin', 'Custom'];
export const defaultLineUpTemplates: Record<string, string[]> = {
  Jersey: ['Jersey Name', 'Number', 'Upper', 'Lower', 'Warmer', 'Label'],
  Blank: ['Description'],
};
export const defaultOrderTypes: Record<string, string[]> = {
  Apparel: ['Jersey Set', 'Jersey Upper', 'Polo', 'T-shirt'],
  Print: ['Print Only / DTF', 'Print & Press', 'Silkscreen', 'Sublimation'],
  Tarpaulin: ['Tarpaulin'],
  Custom: ['Custom item'],
};

export type NewOrderInput = Omit<DemoOrder, 'id' | 'ref' | 'createdAt' | 'projects' | 'lineUpColumns' | 'lineUpTemplateName' | 'discussion' | 'assignedArtistId'> & {
  projects: Array<Pick<DemoProject, 'name' | 'type' | 'quantity' | 'route'>>;
};

export type SyncStatus = 'connecting' | 'live' | 'saving' | 'error' | 'unconfigured';

export const defaultDemoState: DemoState = {
  version: 2,
  orders: [],
  notice: '',
  categories: defaultCategories,
  orderTypes: defaultOrderTypes,
  lineUpTemplates: defaultLineUpTemplates,
};

const allowedStages = new Set([
  'Layout', 'Approval', 'Working Doc', 'Sizing', 'Printing',
  'Heatpress', 'Sewing', 'QC', 'For Release', 'Completed',
]);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

function safeText(value: unknown, max = 160): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// ponytail: block-list sanitizer (enough for a demo); swap in DOMPurify if anyone adversarial ever uses this
function sanitizeOverview(value: unknown): string {
  const html = typeof value === 'string' ? value.slice(0, 400_000) : '';
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, link, meta').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name) || (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:'))) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function normalizeProject(value: unknown): DemoProject | null {
  if (!value || typeof value !== 'object') return null;
  const project = value as Partial<DemoProject>;
  const name = safeText(project.name);
  if (!name) return null;
  const stage = safeText(project.stage);
  return {
    id: safeText(project.id, 80) || crypto.randomUUID(),
    name,
    type: safeText(project.type) || 'Custom item',
    quantity: Number.isFinite(project.quantity) ? Math.max(1, Math.min(99999, Number(project.quantity))) : 1,
    route: safeText(project.route) || 'Full Apparel',
    stage: allowedStages.has(stage) ? stage : 'Layout',
    assignee: safeText(project.assignee) || 'Unassigned',
    department: safeText(project.department) || 'Layout',
    paid: project.paid === true,
    qcStatus: project.qcStatus === 'Passed' || project.qcStatus === 'Issue' ? project.qcStatus : 'Pending',
    custom: plainStringRecord(project.custom),
  };
}

// Jira-style discussion comments: sanitized rich text bodies, author + timestamp.
function normalizeDiscussion(value: unknown): DemoComment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => {
      if (!c || typeof c !== 'object') return null;
      const comment = c as Partial<DemoComment>;
      const html = sanitizeOverview(comment.html);
      if (!html) return null;
      return {
        id: safeText(comment.id, 80) || crypto.randomUUID(),
        author: safeText(comment.author, 60) || 'Anonymous',
        html,
        createdAt: safeText(comment.createdAt, 40) || new Date().toISOString(),
      };
    })
    .filter((c): c is DemoComment => c !== null);
}

function normalizeOrder(value: unknown): DemoOrder | null {
  if (!value || typeof value !== 'object') return null;
  const order = value as Partial<DemoOrder> & { notes?: unknown };
  const title = safeText(order.title);
  const customer = safeText(order.customer);
  if (!title || !customer) return null;
  return {
    id: safeText(order.id, 80) || crypto.randomUUID(),
    ref: safeText(order.ref, 30) || 'JO-0001',
    customer,
    title,
    dueDate: safeText(order.dueDate, 20),
    priority: order.priority === 'Urgent' ? 'Urgent' : 'Normal',
    contact: safeText(order.contact, 300),
    category: safeText(order.category) || 'Custom',
    orderType: safeText(order.orderType) || 'Custom item',
    overview: sanitizeOverview(order.overview ?? order.notes), // notes: pre-overview orders
    createdAt: safeText(order.createdAt, 40) || new Date().toISOString(),
    discussion: normalizeDiscussion(order.discussion),
    assignedArtistId: safeText(order.assignedArtistId, 80),
    projects: Array.isArray(order.projects) ? order.projects.map(normalizeProject).filter((item): item is DemoProject => item !== null) : [],
    lineUpTemplateName: safeText(order.lineUpTemplateName, 40),
    lineUpColumns: uniqNames(order.lineUpColumns).slice(0, 8),
  };
}

function normalizeState(value: unknown): DemoState {
  if (!value || typeof value !== 'object') return defaultDemoState;
  const candidate = value as Partial<DemoState>;
  return {
    version: 2,
    orders: Array.isArray(candidate.orders)
      ? candidate.orders.slice(0, 100).map(normalizeOrder).filter((item): item is DemoOrder => item !== null)
      : [],
    lineUpTemplates: (() => {
      const saved = candidate.lineUpTemplates && typeof candidate.lineUpTemplates === 'object'
        ? candidate.lineUpTemplates as Record<string, unknown>
        : {};
      const out: Record<string, string[]> = {};
      for (const [name, cols] of Object.entries(saved)) {
        const key = name.trim().slice(0, 40);
        const list = uniqNames(cols).slice(0, 12);
        if (key && list.length) out[key] = list;
      }
      return { ...defaultLineUpTemplates, ...out };
    })(),
    notice: safeText(candidate.notice, 500),
    categories: [...new Set([...defaultCategories, ...uniqNames(candidate.categories)])],
    orderTypes: (() => {
      const saved = candidate.orderTypes && typeof candidate.orderTypes === 'object' ? candidate.orderTypes as Record<string, unknown> : {};
      const merged: Record<string, string[]> = {};
      for (const key of new Set([...Object.keys(defaultOrderTypes), ...Object.keys(saved)])) {
        merged[key] = [...new Set([...(defaultOrderTypes[key] ?? []), ...uniqNames(saved[key])])];
      }
      return merged;
    })(),
  };
}

function uniqNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim().slice(0, 40));
}

function plainStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== '')
      .slice(0, 16)
      .map(([key, val]) => [key.trim().slice(0, 40), val.trim().slice(0, 200)]),
  );
}

export function useSharedDemoState() {
  const [state, setState] = useState<DemoState>(defaultDemoState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabase ? 'connecting' : 'unconfigured');

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from('prototype_demo_state')
        .select('state')
        .eq('id', 'global')
        .single();
      if (!active) return;
      if (error) {
        console.error('Could not load shared prototype state', error);
        setSyncStatus('error');
        return;
      }
      setState(normalizeState(data.state));
    };
    void load();

    const channel = supabase
      .channel('prototype-demo-global')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prototype_demo_state', filter: 'id=eq.global' },
        (payload) => {
          setState(normalizeState((payload.new as { state?: unknown }).state));
          setSyncStatus('live');
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSyncStatus('live');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('error');
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const updateState = useCallback(async (next: DemoState) => {
    const normalized = normalizeState(next);
    setState(normalized);
    if (!supabase) return;
    setSyncStatus('saving');
    const { error } = await supabase
      .from('prototype_demo_state')
      .update({ state: normalized, updated_at: new Date().toISOString() })
      .eq('id', 'global');
    if (error) {
      console.error('Could not save shared prototype state', error);
      setSyncStatus('error');
      return;
    }
    setSyncStatus('live');
  }, []);

  const resetState = useCallback(() => updateState(defaultDemoState), [updateState]);
  return { state, syncStatus, updateState, resetState };
}
