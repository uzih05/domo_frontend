import type { Task, Connection, Member, EditingCard } from '../../types';
import { API_CONFIG, apiFetch, mockDelay } from './config';
import {
  MOCK_TASKS,
  MOCK_CONNECTIONS,
  MOCK_MEMBERS,
  MOCK_EDITING_CARDS,
} from './mock-data';

// ============================================
// 태스크(카드) API
// ============================================

/**
 * 프로젝트의 태스크 목록 조회
 */
export async function getTasks(projectId: number): Promise<Task[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(300);
    return MOCK_TASKS.filter(t => t.boardId === projectId || projectId === 1);
  }

  // 실제 API: 프로젝트의 보드 데이터 조회 후 카드 추출
  const response = await apiFetch<{ column: unknown; cards: Task[] }[]>(
      `/projects/${projectId}/board`
  );
  return response.flatMap(col => col.cards);
}

/**
 * 태스크 생성
 */
export async function createTask(
    columnId: number,
    task: Omit<Task, 'id'>
): Promise<Task> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return {
      ...task,
      id: Date.now(),
    };
  }

  return apiFetch<Task>(`/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify({
      title: task.title,
      content: task.content || task.description,
      x: task.x,
      y: task.y,
      assignee_ids: task.assignees?.map(a => a.id) || [],
    }),
  });
}

/**
 * 태스크 수정
 */
export async function updateTask(
    taskId: number,
    updates: Partial<Task>
): Promise<Task> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    const task = MOCK_TASKS.find(t => t.id === taskId);
    if (!task) {
      throw new Error('태스크를 찾을 수 없습니다.');
    }
    return { ...task, ...updates };
  }

  return apiFetch<Task>(`/cards/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: updates.title,
      content: updates.content || updates.description,
      x: updates.x,
      y: updates.y,
      column_id: updates.column_id,
      assignee_ids: updates.assignees?.map(a => a.id),
    }),
  });
}

/**
 * 태스크 삭제
 */
export async function deleteTask(taskId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  await apiFetch<void>(`/cards/${taskId}`, {
    method: 'DELETE',
  });
}

// ============================================
// 연결선 API
// ============================================

/**
 * 프로젝트의 연결선 목록 조회
 */
export async function getConnections(projectId: number): Promise<Connection[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return MOCK_CONNECTIONS.filter(c => c.boardId === projectId || projectId === 1);
  }

  return apiFetch<Connection[]>(`/projects/${projectId}/connections`);
}

/**
 * 연결선 생성
 */
export async function createConnection(
    projectId: number,
    connection: Omit<Connection, 'id'>
): Promise<Connection> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return {
      ...connection,
      id: Date.now(),
    };
  }

  return apiFetch<Connection>(`/projects/${projectId}/connections`, {
    method: 'POST',
    body: JSON.stringify(connection),
  });
}

/**
 * 연결선 삭제
 */
export async function deleteConnection(
    projectId: number,
    connectionId: number
): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return;
  }

  const conn = MOCK_CONNECTIONS.find(c => c.id === connectionId);
  if (conn) {
    await apiFetch<void>(`/projects/${projectId}/connections`, {
      method: 'DELETE',
      body: JSON.stringify({ from: conn.from, to: conn.to }),
    });
  }
}

// ============================================
// 팀 멤버 API (보드용)
// ============================================

/**
 * 프로젝트 팀 멤버 조회 (온/오프라인 상태 포함)
 */
export async function getBoardMembers(projectId: number): Promise<Member[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(200);
    return MOCK_MEMBERS;
  }

  return apiFetch<Member[]>(`/projects/${projectId}/members`);
}

// ============================================
// 실시간 편집 상태 API
// ============================================

/**
 * 현재 수정 중인 카드 목록 조회
 */
export async function getEditingCards(projectId: number): Promise<EditingCard[]> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(100);
    return MOCK_EDITING_CARDS;
  }

  return apiFetch<EditingCard[]>(`/projects/${projectId}/editing-cards`);
}

/**
 * 카드 편집 시작 알림
 */
export async function startEditingCard(cardId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(100);
    return;
  }

  await apiFetch<void>(`/cards/${cardId}/editing`, {
    method: 'POST',
  });
}

/**
 * 카드 편집 종료 알림
 */
export async function stopEditingCard(cardId: number): Promise<void> {
  if (API_CONFIG.USE_MOCK) {
    await mockDelay(100);
    return;
  }

  await apiFetch<void>(`/cards/${cardId}/editing`, {
    method: 'DELETE',
  });
}

// ============================================
// 하위 호환용 (기존 코드에서 사용하던 함수명)
// ============================================

export const getNodes = getTasks;
export const createNode = createTask;
export const updateNode = updateTask;
export const deleteNode = deleteTask;