import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export type DemoProject = {
  id: string;
  name: string;
  custom: Record<string, string>; // Line Up template/order column values for this item
};

export type DemoComment = {
  id: string;
  author: string;
  html: string; // sanitized rich text (Overview-style editor output)
  createdAt: string;
};

export type DemoDesign = {
  id: string;
  name: string;
  url: string; // data URL or bucket path for preview
  size: number; // file size in bytes (dedup guard)
  uploadedBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason: string | null;
  viewedBy: string | null; // admin who last opened the preview
  viewedAt: string | null;
  downloadedBy: string | null; // admin who last downloaded the file
  downloadedAt: string | null;
};
export type DemoSizeFile = {
  id: string;
  name: string;
  url: string; // data URL or bucket path for preview
  size: number; // file size in bytes (dedup guard)
  uploadedBy: string;
  createdAt: string;
};

export type OrderDesignState = 'none' | 'pending' | 'approved' | 'rejected';
/** Derived order-level design state from per-design statuses — never stored. */
export function orderDesignState(order: Pick<DemoOrder, 'designs'>): OrderDesignState {
  const designs = order.designs ?? [];
  if (designs.length === 0) return 'none';
  if (designs.some((d) => d.status === 'approved')) return 'approved';
  if (designs.some((d) => d.status === 'rejected')) return 'rejected';
  return 'pending';
}

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
  stage: string; // order-level progress stage (progress lives on the order, not on items)
  qcStatus: 'Pending' | 'Passed' | 'Issue';
  projects: DemoProject[];
  lineUpTemplateName: string; // which saved template this order's Line Up uses
  lineUpColumns: string[]; // per-order columns added on top of the chosen template
  removedLineUpColumns: string[]; // template columns the order deviates from (hidden for this order only)
  designs: DemoDesign[]; // versioned uploads for Approval gate
  sizings: DemoSizeFile[]; // artist uploads for the Sizing stage (one file per Line Up item expected)
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
  Blank: [],
};
export const defaultOrderTypes: Record<string, string[]> = {
  Apparel: ['Jersey Set', 'Jersey Upper', 'Polo', 'T-shirt'],
  Print: ['Print Only / DTF', 'Print & Press', 'Silkscreen', 'Sublimation'],
  Tarpaulin: ['Tarpaulin'],
  Custom: ['Custom item'],
};

export type NewOrderInput = Omit<DemoOrder, 'id' | 'ref' | 'createdAt' | 'projects' | 'lineUpColumns' | 'removedLineUpColumns' | 'lineUpTemplateName' | 'discussion' | 'assignedArtistId' | 'stage' | 'qcStatus' | 'designs' | 'sizings'> & {
  projects: Array<{ name: string; custom: Record<string, string> }>;
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
  'Layout', 'Approval', 'Document', 'Sizing', 'Printing',
  'Heatpress', 'Sewing', 'QC', 'For Release', 'Completed',
]);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

// Design files uploaded in offline demo mode are inline data URLs. Full-resolution
// PNGs routinely exceed 500KB of base64 — a 500k cap silently lopped off ~75% of
// uploaded images (the DB stored the truncated prefix, so the loss was permanent).
// Cap at a bound that fits real designs AND the PostgREST request-body limit; the
// upload path rejects anything larger instead of truncating.
export const DESIGN_URL_MAX_CHARS = 30_000_000;

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
  return {
    id: safeText(project.id, 80) || crypto.randomUUID(),
    name,
    custom: plainStringRecord(project.custom),
  };
}

function normalizeDesigns(value: unknown, legacy?: { status?: string; reason?: unknown }): DemoDesign[] {
  if (!Array.isArray(value)) return [];
  const designs = value
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const design = d as Partial<DemoDesign>;
      const url = safeText(design.url, DESIGN_URL_MAX_CHARS);
      if (!url) return null;
      return {
        id: safeText(design.id, 80) || crypto.randomUUID(),
        name: safeText(design.name, 120) || 'design',
        url,
        size: Number.isFinite(design.size) ? Math.max(0, Math.floor(Number(design.size))) : 0,
        uploadedBy: safeText(design.uploadedBy, 60) || 'unknown',
        createdAt: safeText(design.createdAt, 40) || new Date().toISOString(),
        status: design.status === 'approved' || design.status === 'rejected' ? design.status : 'pending',
        rejectReason: safeText(design.rejectReason, 400) || null,
        viewedBy: safeText(design.viewedBy, 60) || null,
        viewedAt: safeText(design.viewedAt, 40) || null,
        downloadedBy: safeText(design.downloadedBy, 60) || null,
        downloadedAt: safeText(design.downloadedAt, 40) || null,
      };
    })
    .filter((d): d is DemoDesign => d !== null);
  // One-time migration from the pre-per-design order-level flags: apply them to
  // the newest design when no design carries a decision yet. The order-level
  // fields are dropped from the persisted state on the next save.
  if ((legacy?.status === 'approved' || legacy?.status === 'rejected') && designs.length > 0 && designs.every((d) => d.status === 'pending')) {
    const target = designs[designs.length - 1];
    target.status = legacy.status;
    if (legacy.status === 'rejected') target.rejectReason = safeText(legacy.reason, 400) || null;
  }
  return designs;
}
function normalizeSizings(value: unknown): DemoSizeFile[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const size = d as Partial<DemoSizeFile>;
      const url = safeText(size.url, DESIGN_URL_MAX_CHARS);
      if (!url) return null;
      return {
        id: safeText(size.id, 80) || crypto.randomUUID(),
        name: safeText(size.name, 120) || 'sizing',
        url,
        size: Number.isFinite(size.size) ? Math.max(0, Math.floor(Number(size.size))) : 0,
        uploadedBy: safeText(size.uploadedBy, 60) || 'unknown',
        createdAt: safeText(size.createdAt, 40) || new Date().toISOString(),
      };
    })
    .filter((d): d is DemoSizeFile => d !== null);
}

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
    stage: (() => {
      // progress lives on the order: prefer an explicit order-level stage, else derive
      // from the most-advanced legacy item so pre-migration orders keep their progress
      const rawStage = safeText(order.stage, 60);
      // pre-rename rows may still persist the legacy label; normalize it
      const explicit = rawStage === 'Working Doc' ? 'Document' : rawStage;
      if (allowedStages.has(explicit)) return explicit;
      const legacy = Array.isArray(order.projects)
        ? order.projects
            .map((p) => {
              const s = p && typeof p === 'object' ? safeText((p as { stage?: unknown }).stage) : '';
              return s === 'Working Doc' ? 'Document' : s;
            })
            .filter((s) => allowedStages.has(s))
            .sort((a, b) => [...allowedStages].indexOf(a) - [...allowedStages].indexOf(b))
        : [];
      return legacy[legacy.length - 1] ?? 'Layout';
    })(),
    qcStatus: order.qcStatus === 'Passed' || order.qcStatus === 'Issue' ? order.qcStatus : 'Pending',
    lineUpTemplateName: safeText(order.lineUpTemplateName, 40),
    lineUpColumns: uniqNames(order.lineUpColumns).slice(0, 8),
    removedLineUpColumns: uniqNames(order.removedLineUpColumns).slice(0, 8),
    designs: normalizeDesigns(
      (order as unknown as { designs?: unknown }).designs,
      {
        status: safeText((order as unknown as { designStatus?: unknown }).designStatus, 20),
        reason: (order as unknown as { designRejectionReason?: unknown }).designRejectionReason,
      },
    ),
    sizings: normalizeSizings((order as unknown as { sizings?: unknown }).sizings),
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
          // Realtime UPDATE payloads for this table carry only {id, updated_at}
          // (the big jsonb column is omitted). Applying normalizeState(undefined)
          // here reset every open browser to the empty workspace — "Order not found".
          // Only apply payloads that provably carry order data.
          const next = payload.new;
          if (next && typeof next === 'object' && 'state' in next) {
            const s = next.state;
            if (s && typeof s === 'object' && Array.isArray(s.orders)) {
              setState(normalizeState(s));
            }
          }
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
