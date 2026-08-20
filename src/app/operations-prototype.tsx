import { useMemo, useReducer } from 'react';
import type { NewOrderInput } from '../hooks/use-shared-demo-state';
import type { Screen, Variant, QueueMode, User } from '../shared/types';
import { users } from '../shared/constants';
import { usePrototypeSearch } from '../hooks/use-prototype-search';
import { useSharedDemoState } from '../hooks/use-shared-demo-state';
import { usePrototypeWorkspace } from '../hooks/use-prototype-workspace';
import { PrototypeSwitcher } from '../ui/prototype-switcher';
import { SharedDemoControls } from '../ui/shared-demo-controls';
import { NewJobOrderDialog } from '../dialogs/new-job-order-dialog';
import { AssignArtistDialog } from '../dialogs/assign-artist-dialog';
import { ReworkDialog } from '../dialogs/rework-dialog';
import { UserSwitcherDialog } from '../dialogs/user-switcher-dialog';
import { DispatchBoard } from '../dispatch/dispatch-board';
import { OpsConsole } from '../console/ops-console';
import { JobJacket } from '../jacket/job-jacket';
import '../globals.css';

type DialogState = {
  reworkOpen: boolean;
  assignmentOpen: boolean;
  userSwitcherOpen: boolean;
  newOrderOpen: boolean;
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
  assignmentOpen: false,
  userSwitcherOpen: false,
  newOrderOpen: false,
};

export function OperationsPrototype() {
  const search = usePrototypeSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const pathname = window.location.pathname;
  const rawVariant = params.get('variant');
  const rawScreen = params.get('screen');
  const rawMode = params.get('mode');
  const variant: Variant = rawVariant === 'B' || rawVariant === 'C' ? rawVariant : 'A';
  const screen: Screen = rawScreen === 'orders' || rawScreen === 'order' || rawScreen === 'project' ? rawScreen : 'dashboard';
  const queueMode: QueueMode = rawMode === 'projects' ? 'projects' : 'orders';
  const rawUser = params.get('user');
  const user: User = users.find((u) => u.id === rawUser) ?? users[0];
  const { state: sharedState, syncStatus, updateState, resetState } = useSharedDemoState();
  const [dialogs, dispatchDialog] = useReducer(dialogReducer, initialDialogs);

  const openDialog = (dialog: keyof DialogState) => () => dispatchDialog({ type: 'OPEN', dialog });
  const closeDialog = (dialog: keyof DialogState) => () => dispatchDialog({ type: 'CLOSE', dialog });

  const nav = { user, variant, pathname, search };
  const dialogOpeners = {
    openNewOrder: openDialog('newOrderOpen'),
    openAssignment: openDialog('assignmentOpen'),
    openRework: openDialog('reworkOpen'),
    openUserSwitcher: openDialog('userSwitcherOpen'),
  };

  const workspace = usePrototypeWorkspace(sharedState, user, screen, queueMode, nav, updateState, dialogOpeners);

  const handleCreateOrder = (input: NewOrderInput) => {
    workspace.createOrder(input);
    closeDialog('newOrderOpen')();
  };

  const handleAssignment = (artist: string, department: string) => {
    workspace.confirmAssignment(artist, department);
    closeDialog('assignmentOpen')();
  };

  const handleRework = () => {
    workspace.confirmRework();
    closeDialog('reworkOpen')();
  };

  return (
    <>
      {variant === 'A' && <DispatchBoard {...workspace.props} />}
      {variant === 'B' && <OpsConsole {...workspace.props} />}
      {variant === 'C' && <JobJacket {...workspace.props} />}
      <PrototypeSwitcher current={variant} />
      <SharedDemoControls
        status={syncStatus}
        canReset={workspace.canCreateOrder}
        onReset={() => {
          if (window.confirm('Delete every job order and return the shared workspace to a first-time state?')) {
            void resetState();
          }
        }}
      />
      {dialogs.newOrderOpen && <NewJobOrderDialog close={closeDialog('newOrderOpen')} create={handleCreateOrder} />}
      {dialogs.assignmentOpen && workspace.currentProject && (
        <AssignArtistDialog
          project={workspace.currentProject}
          close={closeDialog('assignmentOpen')}
          assign={handleAssignment}
        />
      )}
      {dialogs.reworkOpen && <ReworkDialog close={closeDialog('reworkOpen')} confirm={handleRework} />}
      {dialogs.userSwitcherOpen && (
        <UserSwitcherDialog user={user} close={closeDialog('userSwitcherOpen')} select={workspace.selectUser} />
      )}
    </>
  );
}