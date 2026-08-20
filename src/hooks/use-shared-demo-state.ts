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
};

export type DemoOrder = {
  id: string;
  ref: string;
  customer: string;
  title: string;
  dueDate: string;
  priority: 'Normal' | 'Urgent';
  notes: string;
  createdAt: string;
  projects: DemoProject[];
};

export type DemoState = {
  version: 2;
  orders: DemoOrder[];
  notice: string;
};

export type NewOrderInput = Omit<DemoOrder, 'id' | 'ref' | 'createdAt' | 'projects'> & {
  projects: Array<Pick<DemoProject, 'name' | 'type' | 'quantity' | 'route'>>;
};

export type SyncStatus = 'connecting' | 'live' | 'saving' | 'error' | 'unconfigured';

export const defaultDemoState: DemoState = {
  version: 2,
  orders: [],
  notice: '',
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
  };
}

function normalizeOrder(value: unknown): DemoOrder | null {
  if (!value || typeof value !== 'object') return null;
  const order = value as Partial<DemoOrder>;
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
    notes: safeText(order.notes, 1000),
    createdAt: safeText(order.createdAt, 40) || new Date().toISOString(),
    projects: Array.isArray(order.projects) ? order.projects.map(normalizeProject).filter((item): item is DemoProject => item !== null) : [],
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
    notice: safeText(candidate.notice, 500),
  };
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
