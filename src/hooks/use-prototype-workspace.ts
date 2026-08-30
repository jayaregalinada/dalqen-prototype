import { useMemo, useCallback, useRef } from 'react';
import type { DemoProject, DemoOrder, DemoState, SyncStatus } from './use-shared-demo-state';
import type { NewOrderInput } from './use-shared-demo-state';
import type { Screen, QueueMode, OrderRow, User, DashboardStats, PrototypeProps } from '../shared/types';
import { roleDefs, stages } from '../shared/constants';
import { formatDate, orderStatus, navigateTo } from '../shared/helpers';

type NavigationConfig = {
  user: User;
  pathname: string;
  search: string;
};

type SharedState = DemoState;

export function usePrototypeWorkspace(
  sharedState: SharedState,
  user: User,
  screen: Screen,
  queueMode: QueueMode,
  nav: NavigationConfig,
  updateState: (next: SharedState) => Promise<void>,
  syncStatus: SyncStatus,
  dialogOpeners: {
    openNewOrder: () => void;
    openRework: () => void;
    openUserSwitcher: () => void;
    openAddProject: (columns: string[]) => void;
  },
) {
  const canCreateOrder = user.role === 'owner';
  const roleDef = roleDefs.find((r) => r.key === user.role)!;

  // Owner sees every order; the rest only see orders where they're the assigned artist.
  // The selected order comes from the URL (?order=JO-0001). A param naming an unknown or
  // not-visible order "denies" the screen; a missing param keeps the newest visible order.
  const params = new URLSearchParams(nav.search);
  const orderParam = params.get('order');

  const visibleOrders = sharedState.orders.filter(
    (order) => user.role === 'owner' || order.assignedArtistId === user.id,
  );
  const selectedOrder = !orderParam
    ? visibleOrders[0]
    : (visibleOrders.find((o) => o.id === orderParam || o.ref === orderParam) ?? null);
  const orderAccessDenied = selectedOrder === null;
  const currentOrder = selectedOrder ?? undefined;
  // Progress lives on the order itself: whoever can see the order sees its full Line Up.
  const lineUpItems = currentOrder?.projects ?? [];
  const stage = currentOrder?.stage ?? 'Layout';
  const qcStatus = (currentOrder?.qcStatus ?? 'Pending') as 'Pending' | 'Passed' | 'Issue';
  const notice = sharedState.notice;
  // State writes can fire from delayed closures (e.g. the 1s-debounced Line Up draft save).
  // Always merge onto the LATEST state — a render-time snapshot would clobber newer writes.
  const sharedStateRef = useRef(sharedState);
  sharedStateRef.current = sharedState;
  const currentOrderRef = useRef(currentOrder);
  currentOrderRef.current = currentOrder;

  const href = useCallback(
    (target: Screen, mode?: QueueMode) => {
      const query = new URLSearchParams();
      query.set('screen', target);
      if (mode) query.set('mode', mode);
      if (target === 'order' && currentOrder) query.set('order', currentOrder.ref);
      query.set('user', user.id);
      return `${nav.pathname}?${query.toString()}`;
    },
    [nav.pathname, user.id, currentOrder],
  );

  // Links that point at a SPECIFIC order (rows, kanban cards, fresh creation)
  // — independent of whatever is currently selected.
  const orderHref = useCallback(
    (orderRef: string) => {
      const query = new URLSearchParams();
      query.set('screen', 'order');
      query.set('order', orderRef);
      query.set('user', user.id);
      return `${nav.pathname}?${query.toString()}`;
    },
    [nav.pathname, user.id],
  );

  const orderRows: OrderRow[] = useMemo(
    () =>
      visibleOrders.map((order) => ({
        ref: order.ref,
        title: order.title,
        customer: order.customer,
        due: formatDate(order.dueDate),
        stage: order.stage, // progress now lives on the order (the stage rail)
        status: orderStatus(order),
        priority: order.priority,
      })),
    [visibleOrders],
  );

  const today = new Date().toISOString().slice(0, 10);

  const stats: DashboardStats = useMemo(
    () => ({
      overdue: visibleOrders.filter((o) => o.dueDate && o.dueDate < today && orderStatus(o) !== 'Released').length,
      dueToday: visibleOrders.filter((o) => o.dueDate === today).length,
      waiting: visibleOrders.filter((o) => o.stage === 'Approval').length,
      qcIssues: visibleOrders.filter((o) => o.qcStatus === 'Issue').length,
      ready: visibleOrders.filter((o) => o.stage === 'For Release').length,
      activeOrders: visibleOrders.filter((o) => o.stage !== 'Completed').length,
      released: visibleOrders.filter((o) => o.stage === 'Completed').length,
    }),
    [visibleOrders, today],
  );

  // Order-level actions: progress is tracked per order, not per item.
  const updateCurrentOrder = useCallback(
    (changes: Partial<DemoOrder>, message: string) => {
      const target = currentOrderRef.current;
      if (!target) return;
      const state = sharedStateRef.current;
      void updateState({
        ...state,
        notice: message,
        orders: state.orders.map((order) =>
          order.id === target.id ? { ...order, ...changes } : order,
        ),
      });
    },
    [updateState],
  );

  const advanceStage = useCallback(() => {
    const current = stages.indexOf(stage);
    const next = stages[Math.min(current + 1, stages.length - 1)];
    updateCurrentOrder({ stage: next }, `Order advanced to ${next}. Queue and dashboards updated.`);
  }, [stage, updateCurrentOrder]);

  const passQc = useCallback(
    () => updateCurrentOrder({ qcStatus: 'Passed' }, 'QC passed. This order is ready for release.'),
    [updateCurrentOrder],
  );

  const confirmRework = useCallback(
    (targetStage: string, reason: string) => {
      updateCurrentOrder(
        { stage: targetStage, qcStatus: 'Issue' },
        `Rework recorded. Order returned to ${targetStage} and followers notified. Reason: ${reason}`,
      );
    },
    [updateCurrentOrder],
  );

  const setQueueMode = useCallback((mode: QueueMode) => navigateTo(href('orders', mode), true), [href]);

  const removeItem = useCallback(
    (orderId: string, projectId: string) => {
      const state = sharedStateRef.current;
      void updateState({
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, projects: order.projects.filter((p) => p.id !== projectId) }
            : order,
        ),
      });
    },
    [updateState],
  );

  const moveItemTo = useCallback(
    (orderId: string, projectId: string, toIndex: number) => {
      const state = sharedStateRef.current;
      void updateState({
        ...state,
        orders: state.orders.map((order) => {
          if (order.id !== orderId) return order;
          const idx = order.projects.findIndex((p) => p.id === projectId);
          if (idx < 0) return order;
          const projects = [...order.projects];
          const [moved] = projects.splice(idx, 1);
          projects.splice(Math.max(0, Math.min(toIndex, projects.length)), 0, moved);
          return { ...order, projects };
        }),
      });
    },
    [updateState],
  );

  const addProjectToOrder = useCallback(
    (draft: { name: string; custom: Record<string, string> }) => {
      const target = currentOrderRef.current;
      if (!target) return;
      const state = sharedStateRef.current;
      const project: DemoProject = {
        id: crypto.randomUUID(),
        name: draft.name,
        custom: draft.custom ?? {},
      };
      void updateState({
        ...state,
        notice: `Item "${draft.name}" added to ${target.ref}.`,
        orders: state.orders.map((order) =>
          order.id === target.id
            ? { ...order, projects: [...order.projects, project] }
            : order,
        ),
      });
    },
    [updateState],
  );

  const createOrder = useCallback(
    (input: NewOrderInput) => {
      const state = sharedStateRef.current;
      const nextNumber = state.orders.reduce(
        (highest, order) => Math.max(highest, Number(order.ref.match(/\d+/)?.[0] ?? 0)),
        0,
      ) + 1;
      const order: DemoOrder = {
        ...input,
        id: crypto.randomUUID(),
        ref: `JO-${String(nextNumber).padStart(4, '0')}`,
        createdAt: new Date().toISOString(),
        discussion: [],
        lineUpColumns: [],
        removedLineUpColumns: [],
        lineUpTemplateName: '',
        assignedArtistId: '',
        stage: 'Layout',
        qcStatus: 'Pending',
        designs: [],
        projects: input.projects.map((project) => ({
          id: crypto.randomUUID(),
          name: project.name,
          custom: project.custom ?? {},
        })),
      };
      void updateState({
        ...state,
        orders: [order, ...state.orders],
        notice: `${order.ref} created.`,
      });
      navigateTo(orderHref(order.ref));
    },
    [updateState, orderHref],
  );

  const selectUser = useCallback(
    (next: User) => {
      const query = new URLSearchParams(nav.search);
      query.set('user', next.id);
      navigateTo(`${nav.pathname}?${query.toString()}`, true);
    },
    [nav.pathname, nav.search],
  );

  const updateOrder = useCallback(
    (orderId: string, patch: Partial<DemoOrder>) => {
      const state = sharedStateRef.current;
      void updateState({
        ...state,
        orders: state.orders.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
      });
    },
    [updateState],
  );

  const saveLineUpTemplate = useCallback(
    (name: string, columns: string[], orderId?: string) => {
      // single write: saving a template and (optionally) selecting it on an order must not race
      const state = sharedStateRef.current;
      void updateState({
        ...state,
        lineUpTemplates: { ...state.lineUpTemplates, [name]: columns },
        orders: orderId
          ? state.orders.map((order) => (order.id === orderId ? { ...order, lineUpTemplateName: name, lineUpColumns: [], removedLineUpColumns: [] } : order))
          : state.orders,
      });
    },
    [updateState],
  );

  const props: PrototypeProps = {
    user,
    canCreateOrder,
    screen,
    queueMode,
    stage,
    qcStatus,
    notice,
    currentOrder,
    lineUpItems,
    orderRows,
    stats,
    href,
    setQueueMode,
    openNewOrder: dialogOpeners.openNewOrder,
    advanceStage,
    passQc,
    openRework: dialogOpeners.openRework,
    openUserSwitcher: dialogOpeners.openUserSwitcher,
    openAddProject: dialogOpeners.openAddProject,
    updateOrder,
    removeItem,
    moveItemTo,
    categories: sharedState.categories,
    orderTypes: sharedState.orderTypes,
    lineUpTemplates: sharedState.lineUpTemplates,
    saveLineUpTemplate,
    orderAccessDenied,
    syncStatus,
    orderHref,
  };

  return {
    canCreateOrder,
    currentOrder,
    stage,
    qcStatus,
    notice,
    orderRows,
    stats,
    href,
    props,
    confirmRework,
    createOrder,
    addProjectToOrder,
    selectUser,
    setQueueMode,
  };
}