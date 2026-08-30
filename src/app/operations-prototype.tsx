import { useMemo, useReducer, useState } from 'react';
import type { NewOrderInput } from '../hooks/use-shared-demo-state';
import type { Screen, QueueMode, User } from '../shared/types';
import { users } from '../shared/constants';
import { usePrototypeSearch } from '../hooks/use-prototype-search';
import { useSharedDemoState } from '../hooks/use-shared-demo-state';
import { usePrototypeWorkspace } from '../hooks/use-prototype-workspace';
import { SharedDemoControls } from '../ui/shared-demo-controls';
import { NewJobOrderDialog } from '../dialogs/new-job-order-dialog';
import { ReworkDialog } from '../dialogs/rework-dialog';
import { UserSwitcherDialog } from '../dialogs/user-switcher-dialog';
import { DispatchBoard } from '../dispatch/dispatch-board';
import { AddProjectDialog } from '../dialogs/add-project-dialog';
import { ConfirmActionDialog } from '../ui/confirm-action-dialog';
import '../globals.css';

type DialogState = {
  reworkOpen: boolean;
  userSwitcherOpen: boolean;
  newOrderOpen: boolean;
  addProjectOpen: boolean;
  resetWorkspaceOpen: boolean;
};

type DialogAction =
  | { type: 'OPEN'; dialog: keyof DialogState }
  | { type: 'CLOSE'; dialog: keyof DialogState };

function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, [action.dialog]: true };
    case 'CLOSE':
      return { ...state, [action.dialog]: false };
    default:
      return state;
  }
}

const initialDialogs: DialogState = {
  reworkOpen: false,
  userSwitcherOpen: false,
  newOrderOpen: false,
  addProjectOpen: false,
  resetWorkspaceOpen: false,
};

export function OperationsPrototype() {
  const search = usePrototypeSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const pathname = window.location.pathname;
  const rawScreen = params.get('screen');
  const rawMode = params.get('mode');
  const screen: Screen = rawScreen === 'orders' || rawScreen === 'order' ? rawScreen : 'dashboard';
  const queueMode: QueueMode = rawMode === 'kanban' ? 'kanban' : 'orders';
  const rawUser = params.get('user');
  const user: User = users.find((u) => u.id === rawUser) ?? users[0];
  const { state: sharedState, syncStatus, updateState, resetState } = useSharedDemoState();
  const [dialogs, dispatchDialog] = useReducer(dialogReducer, initialDialogs);
  const [addProjectColumns, setAddProjectColumns] = useState<string[]>([]);

  const openDialog = (dialog: keyof DialogState) => () => dispatchDialog({ type: 'OPEN', dialog });
  const closeDialog = (dialog: keyof DialogState) => () => dispatchDialog({ type: 'CLOSE', dialog });
  const openAddProject = (columns: string[]) => { setAddProjectColumns(columns); openDialog('addProjectOpen')(); };

  const nav = { user, pathname, search };
  const dialogOpeners = {
    openNewOrder: openDialog('newOrderOpen'),
    openRework: openDialog('reworkOpen'),
    openUserSwitcher: openDialog('userSwitcherOpen'),
    openAddProject,
  };

  const workspace = usePrototypeWorkspace(sharedState, user, screen, queueMode, nav, updateState, syncStatus, dialogOpeners);

  const handleCreateOrder = (input: NewOrderInput) => {
    workspace.createOrder(input);
    closeDialog('newOrderOpen')();
  };

  const handleRework = (targetStage: string, reason: string) => {
    workspace.confirmRework(targetStage, reason);
    closeDialog('reworkOpen')();
  };

  const handleAddCategory = (name: string) => {
    if (sharedState.categories.includes(name)) return;
    void updateState({ ...sharedState, categories: [...sharedState.categories, name], orderTypes: { ...sharedState.orderTypes, [name]: [] } });
  };

  const handleAddOrderType = (category: string, name: string) => {
    const list = sharedState.orderTypes[category] ?? [];
    if (list.includes(name)) return;
    void updateState({ ...sharedState, orderTypes: { ...sharedState.orderTypes, [category]: [...list, name] } });
  };

  const handleAddProject = (draft: { name: string; custom: Record<string, string> }) => {
    workspace.addProjectToOrder(draft);
    closeDialog('addProjectOpen')();
  };

  return (
    <>
      <DispatchBoard {...workspace.props} />
      <SharedDemoControls
        status={syncStatus}
        canReset={workspace.canCreateOrder}
        onReset={openDialog('resetWorkspaceOpen')}
      />
      <ConfirmActionDialog
        open={dialogs.resetWorkspaceOpen}
        title="Reset shared workspace?"
        description="Delete every job order and return the shared workspace to a first-time state. This cannot be undone."
        confirmLabel="Reset workspace"
        variant="destructive"
        onOpenChange={(open) => dispatchDialog({ type: open ? 'OPEN' : 'CLOSE', dialog: 'resetWorkspaceOpen' })}
        onConfirm={() => { void resetState(); }}
      />
      {dialogs.newOrderOpen && <NewJobOrderDialog close={closeDialog('newOrderOpen')} create={handleCreateOrder} categories={sharedState.categories} orderTypes={sharedState.orderTypes} addCategory={handleAddCategory} addOrderType={handleAddOrderType} />}
      {dialogs.reworkOpen && <ReworkDialog currentStage={workspace.stage} close={closeDialog('reworkOpen')} confirm={handleRework} />}
      {dialogs.userSwitcherOpen && (
        <UserSwitcherDialog user={user} close={closeDialog('userSwitcherOpen')} select={workspace.selectUser} />
      )}
      {dialogs.addProjectOpen && (
        <AddProjectDialog columns={addProjectColumns} close={closeDialog('addProjectOpen')} addProject={handleAddProject} />
      )}
    </>
  );
}