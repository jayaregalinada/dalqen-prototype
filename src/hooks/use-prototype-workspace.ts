import { useMemo, useCallback } from 'react';
import type { DemoProject, DemoOrder } from './use-shared-demo-state';
import type { NewOrderInput } from './use-shared-demo-state';
import type { Screen, QueueMode, OrderRow, ProjectRow, ProjectCard, User, DashboardStats, PrototypeProps } from '../shared/types';
import { roleDefs, stages } from '../shared/constants';
import { formatDate, orderStatus, projectTone, navigateTo } from '../shared/helpers';

type NavigationConfig = {
  user: User;
  variant: string;
  pathname: string;
  search: string;
};

type SharedState = {
  version: 2;
  orders: DemoOrder[];
  notice: string;
};

export function usePrototypeWorkspace(
  sharedState: SharedState,
  user: User,
  screen: Screen,
  queueMode: QueueMode,
  nav: NavigationConfig,
  updateState: (next: SharedState) => Promise<void>,
  dialogOpeners: {
    openNewOrder: () => void;
    openAssignment: () => void;
    openRework: () => void;
    openUserSwitcher: () => void;
    openAddProject: () => void;
  },
) {
  const canCreateOrder = user.role === 'owner';
  const roleDef = roleDefs.find((r) => r.key === user.role)!;

  const isVisibleToUser = useCallback(
    (project: DemoProject) =>
      user.role === 'owner' || (project.assignee === user.name && roleDef.stages.includes(project.stage)),
    [user.role, user.name, roleDef.stages],
  );

  const visibleOrders = sharedState.orders.filter((order) => order.projects.some(isVisibleToUser));
  const currentOrder = visibleOrders[0];
  const currentProject = currentOrder?.projects.find(isVisibleToUser) ?? currentOrder?.projects[0];
  const stage = currentProject?.stage ?? 'Layout';
  const qcStatus = (currentProject?.qcStatus ?? 'Pending') as 'Pending' | 'Passed' | 'Issue';
  const notice = sharedState.notice;

  const href = useCallback(
    (target: Screen, mode?: QueueMode) => {
      const query = new URLSearchParams();
      query.set('variant', nav.variant);
      query.set('screen', target);
      if (mode) query.set('mode', mode);
      query.set('user', user.id);
      return `${nav.pathname}?${query.toString()}`;
    },
    [nav.pathname, nav.variant, user.id],
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

  const projects: ProjectCard[] = useMemo(
    () =>
      (currentOrder?.projects.filter(isVisibleToUser) ?? []).map((project) => ({
        name: project.name,
        detail: `${project.quantity} ${project.type}`,
        stage: project.stage,
        owner: project.assignee,
        dept: project.department,
        due: formatDate(currentOrder?.dueDate ?? ''),
        paid: project.paid,
        tone: projectTone(project),
      })),
    [currentOrder, isVisibleToUser],
  );

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

  const addProjectToOrder = useCallback(
    (draft: { name: string; type: string; quantity: number; route: string }) => {
      if (!currentOrder) return;
      const project = {
        id: crypto.randomUUID(),
        name: draft.name,
        type: draft.type,
        quantity: draft.quantity,
        route: draft.route,
        stage: 'Layout',
        assignee: 'Unassigned',
        department: 'Layout',
        paid: false,
        qcStatus: 'Pending' as const,
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
        projects: input.projects.map((project) => ({
          ...project,
          id: crypto.randomUUID(),
          stage: 'Layout',
          assignee: 'Unassigned',
          department: 'Layout',
          paid: false,
          qcStatus: 'Pending' as const,
        })),
      };
      void updateState({
        version: 2,
        orders: [order, ...sharedState.orders],
        notice: `${order.ref} created with ${order.projects.length} projects.`,
      });
      navigateTo(href('order'));
    },
    [sharedState, updateState, href],
  );

  const selectUser = useCallback(
    (next: User) => {
      const query = new URLSearchParams(nav.search);
      query.set('user', next.id);
      navigateTo(`${nav.pathname}?${query.toString()}`, true);
    },
    [nav.pathname, nav.search],
  );

  const props: PrototypeProps = {
    user,
    canCreateOrder,
    variant: nav.variant as any,
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