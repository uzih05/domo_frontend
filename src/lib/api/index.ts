// API 설정
export { API_CONFIG, apiFetch, mockDelay } from './config';

// 인증 API
export {
  login,
  signup,
  verify,
  logout,
  getCurrentUser,
} from './auth';

// 워크스페이스/프로젝트 API
export {
  getWorkspaces,
  getWorkspace,
  getMyProjects,
  getProjects,
  getProject,
  getOnlineMembers,
  getProjectMembers,
} from './workspace';

// 보드/태스크 API
export {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getConnections,
  createConnection,
  deleteConnection,
  getBoardMembers,
  getEditingCards,
  startEditingCard,
  stopEditingCard,
  // 하위 호환용
  getNodes,
  createNode,
  updateNode,
  deleteNode,
} from './board';

// 목업 데이터 (개발용)
export * from './mock-data';