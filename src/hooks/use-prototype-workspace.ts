import { useMemo, useCallback } from 'react';
import type { DemoProject, DemoOrder, DemoState, SyncStatus } from './use-shared-demo-state';
import type { NewOrderInput } from './use-shared-demo-state';
import type { Screen, QueueMode, OrderRow, ProjectRow, ProjectCard, User, DashboardStats, PrototypeProps } from '../shared/types';
import { roleDefs, stages } from '../shared/constants';
import { formatDate, orderStatus, projectTone, navigateTo } from '../shared/helpers';

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
    openAssignment: () => void;
    openRework: () => void;
    openUserSwitcher: () => void;
    openAddProject: (columns: string[]) => void;
  },
) {
  const canCreateOrder = user.role === 'owner';
  const roleDef = roleDefs.find((r) => r.key === user.role)!;

  const isVisibleToUser = useCallback(
    (project: DemoProject) =>
      user.role === 'owner' || (project.assignee === user.name && roleDef.stages.includes(project.stage)),
    [user.role, user.name, roleDef.stages],
  );

  // Owner sees every order, including freshly created ones with zero projects;
  // team members still only see orders where they're assigned to a project.
  // Selected order/project come from the URL (?order=JO-0001&project=…). A param that
  // names an unknown or not-visible order/project "denies" the screen; a missing param
  // keeps the legacy default of the newest visible order/project.
  const params = new URLSearchParams(nav.search);
  const orderParam = params.get('order');
  const projectParam = params.get('project');

  // Owner sees every order, including freshly created ones with zero projects;
  // team members also see orders where they're the assigned artist (they can join
  // the order's discussion) or assigned to one of the order's projects.
  const visibleOrders = sharedState.orders.filter(
    (order) =>
      user.role === 'owner' ||
      order.assignedArtistId === user.id ||
      order.projects.some(isVisibleToUser),
  );
  const selectedOrder = !orderParam
    ? visibleOrders[0]
    : (visibleOrders.find((o) => o.id === orderParam || o.ref === orderParam) ?? null);
  const orderAccessDenied = selectedOrder === null;
  const currentOrder = selectedOrder ?? undefined;
  const currentOrderProjects = currentOrder?.projects ?? [];
  const selectedProject = !projectParam
    ? (currentOrderProjects.find(isVisibleToUser) ?? currentOrderProjects[0])
    : (currentOrderProjects.find((p) => p.id === projectParam || p.name === projectParam) ?? null);
  const projectAccessDenied = selectedProject === null;
  const currentProject = selectedProject ?? undefined;
  const stage = currentProject?.stage ?? 'Layout';
  const qcStatus = (currentProject?.qcStatus ?? 'Pending') as 'Pending' | 'Passed' | 'Issue';
  const notice = sharedState.notice;

  const href = useCallback(
    (target: Screen, mode?: QueueMode) => {
      const query = new URLSearchParams();
      query.set('screen', target);
      if (mode) query.set('mode', mode);
      if ((target === 'order' || target === 'project') && currentOrder) query.set('order', currentOrder.ref);
      if (target === 'project' && currentProject) query.set('project', currentProject.name);
      query.set('user', user.id);
      return `${nav.pathname}?${query.toString()}`;
    },
    [nav.pathname, user.id, currentOrder, currentProject],
  );

  // Links that point at a SPECIFIC order/project (rows, kanban cards, fresh creation)
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
  const projectHref = useCallback(
    (orderRef: string, projectName: string) => {
      const query = new URLSearchParams();
      query.set('screen', 'project');
      query.set('order', orderRef);
      query.set('project', projectName);
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
        progress: `${order.projects.filter((p) => p.stage === 'Completed').length} / ${order.projects.length}`,
        status: orderStatus(order),
        priority: order.priority,
      })),
    [visibleOrders],
  );

  const projectRows: ProjectRow[] = useMemo(
    () =>
      visibleOrders.flatMap((order) =>
        order.projects.filter(isVisibleToUser).map((project) => ({
          project: `${project.name} \u00b7 ${project.quantity}`,
          projectName: project.name,
          order: order.ref,
          stage: project.stage,
          owner: project.assignee,
          dept: project.department,
          due: formatDate(order.dueDate),
          flag: project.qcStatus === 'Issue' ? 'Rework' : project.assignee === 'Unassigned' ? 'Unassigned' : 'On track',
        })),
      ),
    [visibleOrders, isVisibleToUser],
  );

  const projects: ProjectCard[] = useMemo(() => {
    // Owner and the order's assigned artist see every Line Up item; other team
    // members only see projects explicitly assigned to them.
    const canSeeAll = user.role === 'owner' || currentOrder?.assignedArtistId === user.id;
    const list = canSeeAll
      ? (currentOrder?.projects ?? [])
      : (currentOrder?.projects.filter(isVisibleToUser) ?? []);
    return list.map((project) => ({
      id: project.id,
      name: project.name,
      detail: `${project.quantity} ${project.type}`,
      type: project.type,
      quantity: project.quantity,
      route: project.route,
      custom: project.custom,
      stage: project.stage,
      owner: project.assignee,
      dept: project.department,
      due: formatDate(currentOrder?.dueDate ?? ''),
      paid: project.paid,
      tone: projectTone(project),
    }));
  }, [currentOrder, isVisibleToUser, user.role, user.id]);

  const today = new Date().toISOString().slice(0, 10);
  const visibleProjects = visibleOrders.flatMap((order) => order.projects.filter(isVisibleToUser));

  const stats: DashboardStats = useMemo(
    () => ({
      overdue: visibleOrders.filter((o) => o.dueDate && o.dueDate < today && orderStatus(o) !== 'Released').length,
      dueToday: visibleOrders.filter((o) => o.dueDate === today).length,
      waiting: visibleProjects.filter((p) => p.stage === 'Approval').length,
      qcIssues: visibleProjects.filter((p) => p.qcStatus === 'Issue').length,
      ready: visibleProjects.filter((p) => p.stage === 'For Release').length,
      activeProjects: visibleProjects.filter((p) => p.stage !== 'Completed').length,
      released: visibleProjects.filter((p) => p.stage === 'Completed').length,
    }),
    [visibleOrders, visibleProjects, today],
  );

  const updateCurrentProject = useCallback(
    (changes: Partial<DemoProject>, message: string) => {
      if (!currentOrder || !currentProject) return;
      void updateState({
        ...sharedState,
        notice: message,
        orders: sharedState.orders.map((order) =>
          order.id === currentOrder.id
            ? {
                ...order,
                projects: order.projects.map((project) =>
                  project.id === currentProject.id ? { ...project, ...changes } : project,
                ),
              }
            : order,
        ),
      });
    },
    [currentOrder, currentProject, sharedState, updateState],
  );

  const advanceStage = useCallback(() => {
    const current = stages.indexOf(stage);
    const next = stages[Math.min(current + 1, stages.length - 1)];
    updateCurrentProject({ stage: next }, `Project advanced to ${next}. Activity and queue ownership updated.`);
  }, [stage, updateCurrentProject]);

  const passQc = useCallback(
    () => updateCurrentProject({ qcStatus: 'Passed' }, 'QC passed. Release is now available.'),
    [updateCurrentProject],
  );

  const confirmAssignment = useCallback(
    (artist: string, department: string) => {
      updateCurrentProject({ assignee: artist, department }, `${artist} assigned to ${currentProject?.name ?? 'project'}.`);
    },
    [updateCurrentProject, currentProject],
  );

  const confirmRework = useCallback(
    (targetStage: string, reason: string) => {
      updateCurrentProject(
        { stage: targetStage, qcStatus: 'Issue', department: targetStage, assignee: 'Unassigned' },
        `Rework recorded. Project returned to ${targetStage} and followers notified. Reason: ${reason}`,
      );
    },
    [updateCurrentProject],
  );

  const setQueueMode = useCallback((mode: QueueMode) => navigateTo(href('orders', mode), true), [href]);

  const removeItem = useCallback(
    (orderId: string, projectId: string) => {
      void updateState({
        ...sharedState,
        orders: sharedState.orders.map((order) =>
          order.id === orderId
            ? { ...order, projects: order.projects.filter((p) => p.id !== projectId) }
            : order,
        ),
      });
    },
    [sharedState, updateState],
  );

  const moveItemTo = useCallback(
    (orderId: string, projectId: string, toIndex: number) => {
      void updateState({
        ...sharedState,
        orders: sharedState.orders.map((order) => {
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
    [sharedState, updateState],
  );

  const addProjectToOrder = useCallback(
    (draft: { name: string; custom: Record<string, string> }) => {
      if (!currentOrder) return;
      const qty = Number(draft.custom['Number']);
      const project = {
        id: crypto.randomUUID(),
        name: draft.name,
        type: 'Jersey Set',
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        route: 'Full Apparel',
        stage: 'Layout',
        assignee: 'Unassigned',
        department: 'Layout',
        paid: false,
        qcStatus: 'Pending' as const,
        custom: draft.custom ?? {},
      };
      void updateState({
        ...sharedState,
        notice: `Project "${draft.name}" added to ${currentOrder.ref}.`,
        orders: sharedState.orders.map((order) =>
          order.id === currentOrder.id
            ? { ...order, projects: [...order.projects, project] }
            : order,
        ),
      });
    },
    [currentOrder, sharedState, updateState],
  );

  const createOrder = useCallback(
    (input: NewOrderInput) => {
      const nextNumber = sharedState.orders.reduce(
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
        lineUpTemplateName: '',
        assignedArtistId: '',
        projects: input.projects.map((project) => ({
          ...project,
          id: crypto.randomUUID(),
          stage: 'Layout',
          assignee: 'Unassigned',
          department: 'Layout',
          paid: false,
          qcStatus: 'Pending' as const,
          custom: {},
        })),
      };
      void updateState({
        ...sharedState,
        orders: [order, ...sharedState.orders],
        notice: `${order.ref} created.`,
      });
      navigateTo(orderHref(order.ref));
    },
    [sharedState, updateState, orderHref],
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
      void updateState({
        ...sharedState,
        orders: sharedState.orders.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
      });
    },
    [sharedState, updateState],
  );

  const saveLineUpTemplate = useCallback(
    (name: string, columns: string[], orderId?: string) => {
      // single write: saving a template and (optionally) selecting it on an order must not race
      void updateState({
        ...sharedState,
        lineUpTemplates: { ...sharedState.lineUpTemplates, [name]: columns },
        orders: orderId
          ? sharedState.orders.map((order) => (order.id === orderId ? { ...order, lineUpTemplateName: name } : order))
          : sharedState.orders,
      });
    },
    [sharedState, updateState],
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
    currentProject,
    orderRows,
    projectRows,
    projects,
    stats,
    href,
    setQueueMode,
    openNewOrder: dialogOpeners.openNewOrder,
    advanceStage,
    passQc,
    openAssignment: dialogOpeners.openAssignment,
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
    projectAccessDenied,
    syncStatus,
    orderHref,
    projectHref,
  };

  return {
    canCreateOrder,
    currentOrder,
    currentProject,
    stage,
    qcStatus,
    notice,
    orderRows,
    projectRows,
    projects,
    stats,
    href,
    props,
    updateCurrentProject,
    confirmAssignment,
    confirmRework,
    createOrder,
    addProjectToOrder,
    selectUser,
    setQueueMode,
  };
}