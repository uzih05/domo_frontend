'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// 타입 정의
// ============================================

export type ChangeType = 'card-position' | 'group-position' | 'connection';

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'success' | 'error';
// idle: 변경 없음
// pending: 변경 있음, debounce 대기 중
// syncing: 실제 API 호출 중
// success: 저장 완료
// error: 저장 실패

export interface PendingChange<T = unknown, S = unknown> {
  id: string;
  type: ChangeType;
  entityId: number;
  payload: T;
  snapshot: S;           // 롤백용 이전 상태
  timestamp: number;
  retryCount: number;
}

export interface SyncError {
  changeId: string;
  entityId: number;
  type: ChangeType;
  error: Error;
  canRetry: boolean;
}

export interface UsePendingSyncOptions<T = unknown, S = unknown> {
  debounceMs?: number;           // 디바운스 대기 시간 (기본 500ms)
  maxRetries?: number;           // 최대 재시도 횟수 (기본 3회)
  retryDelayMs?: number;         // 재시도 간격 (기본 1000ms)
  onSyncStart?: () => void;
  onSyncSuccess?: (changeIds: string[]) => void;
  onSyncError?: (errors: SyncError[]) => void;
  // 롤백 콜백: 실패 시 호출됨. 
  // 주의: 이 콜백은 ref로 관리되어 항상 최신 함수가 호출됨
  onRollback?: (change: PendingChange<T, S>) => void;
}

export interface UsePendingSyncReturn<T = unknown, S = unknown> {
  // 상태
  pendingCount: number;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastError: SyncError | null;
  pendingChanges: PendingChange<T, S>[];

  // 메서드
  queueChange: (
    type: ChangeType,
    entityId: number,
    payload: T,
    snapshot: S,
    apiCall: (payload: T) => Promise<void>
  ) => void;
  flush: () => Promise<void>;
  clearError: () => void;
  retryFailed: () => void;

  // 유틸리티
  hasPendingChanges: boolean;
  getChangeForEntity: (entityId: number, type: ChangeType) => PendingChange<T, S> | undefined;
}

// ============================================
// 유틸리티
// ============================================

function generateChangeId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================
// 메인 훅
// ============================================

export function usePendingSync<T = unknown, S = unknown>(
  options: UsePendingSyncOptions = {}
): UsePendingSyncReturn<T, S> {
  const {
    debounceMs = 500,
    maxRetries = 3,
    retryDelayMs = 1000,
    onSyncStart,
    onSyncSuccess,
    onSyncError,
    onRollback,
  } = options;

  // 상태
  const [pendingChanges, setPendingChanges] = useState<PendingChange<T, S>[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastError, setLastError] = useState<SyncError | null>(null);

  // Refs (클로저 문제 방지)
  const pendingChangesRef = useRef<PendingChange<T, S>[]>([]);
  const apiCallsRef = useRef<Map<string, (payload: T) => Promise<void>>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // 콜백 refs (항상 최신 함수 참조)
  const onSyncStartRef = useRef(onSyncStart);
  const onSyncSuccessRef = useRef(onSyncSuccess);
  const onSyncErrorRef = useRef(onSyncError);
  const onRollbackRef = useRef(onRollback);

  // 콜백 refs 업데이트
  useEffect(() => {
    onSyncStartRef.current = onSyncStart;
    onSyncSuccessRef.current = onSyncSuccess;
    onSyncErrorRef.current = onSyncError;
    onRollbackRef.current = onRollback;
  }, [onSyncStart, onSyncSuccess, onSyncError, onRollback]);

  // pendingChanges 동기화
  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  // ============================================
  // 동기화 실행
  // ============================================

  const executeSync = useCallback(async () => {
    const changes = [...pendingChangesRef.current];
    if (changes.length === 0 || isSyncingRef.current) return;

    console.log('[Optimistic] executeSync 시작, 변경 수:', changes.length);

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncStatus('syncing');
    onSyncStartRef.current?.();

    const successIds: string[] = [];
    const errors: SyncError[] = [];
    const updatedChanges: PendingChange<T, S>[] = [];

    // 각 변경 사항 처리
    for (const change of changes) {
      const apiCall = apiCallsRef.current.get(change.id);
      if (!apiCall) {
        // API 콜이 없으면 성공으로 처리
        console.warn('[Optimistic] API 콜 없음, 스킵:', change.id);
        successIds.push(change.id);
        continue;
      }

      try {
        console.log('[Optimistic] API 호출 중:', change.id, change.type);
        await apiCall(change.payload);
        console.log('[Optimistic] API 성공:', change.id);
        successIds.push(change.id);
        // 성공한 API 콜 제거
        apiCallsRef.current.delete(change.id);
      } catch (err) {
        console.error('[Optimistic] API 실패:', change.id, err);
        const error = err instanceof Error ? err : new Error(String(err));
        const canRetry = change.retryCount < maxRetries;

        if (canRetry) {
          // 재시도 횟수 증가 후 큐에 유지
          updatedChanges.push({
            ...change,
            retryCount: change.retryCount + 1,
          });
        } else {
          // 최대 재시도 초과 - 에러 보고 및 롤백
          errors.push({
            changeId: change.id,
            entityId: change.entityId,
            type: change.type,
            error,
            canRetry: false,
          });

          // 롤백 콜백 호출 (ref를 통해 최신 함수 호출)
          onRollbackRef.current?.(change);

          // API 콜 제거
          apiCallsRef.current.delete(change.id);
        }
      }
    }

    // 상태 업데이트
    setPendingChanges(updatedChanges);
    pendingChangesRef.current = updatedChanges;

    isSyncingRef.current = false;
    setIsSyncing(false);

    if (errors.length > 0) {
      setSyncStatus('error');
      setLastError(errors[0]);
      onSyncErrorRef.current?.(errors);
    } else if (successIds.length > 0) {
      setSyncStatus('success');
      setLastError(null);
      onSyncSuccessRef.current?.(successIds);

      // 성공 상태 2초 후 idle로 전환
      setTimeout(() => {
        setSyncStatus(prev => (prev === 'success' ? 'idle' : prev));
      }, 2000);
    }

    // 재시도할 변경 사항이 있으면 다시 스케줄링
    if (updatedChanges.length > 0) {
      setTimeout(() => {
        executeSync();
      }, retryDelayMs);
    }
  }, [maxRetries, retryDelayMs]);

  // ============================================
  // 디바운스된 동기화 스케줄링
  // ============================================

  const scheduleSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      executeSync();
    }, debounceMs);
  }, [debounceMs, executeSync]);

  // ============================================
  // 변경 사항 큐에 추가
  // ============================================

  const queueChange = useCallback((
    type: ChangeType,
    entityId: number,
    payload: T,
    snapshot: S,
    apiCall: (payload: T) => Promise<void>
  ) => {
    setPendingChanges(prev => {
      // 같은 엔티티의 기존 변경이 있으면 병합 (마지막 값으로 덮어쓰기)
      const existingIndex = prev.findIndex(
        c => c.entityId === entityId && c.type === type
      );

      const changeId = existingIndex >= 0
        ? prev[existingIndex].id
        : generateChangeId();

      // API 콜 저장/업데이트
      apiCallsRef.current.set(changeId, apiCall);

      const newChange: PendingChange<T, S> = {
        id: changeId,
        type,
        entityId,
        payload,
        snapshot: existingIndex >= 0 ? prev[existingIndex].snapshot : snapshot, // 최초 스냅샷 유지
        timestamp: Date.now(),
        retryCount: 0,
      };

      if (existingIndex >= 0) {
        // 기존 변경 업데이트
        const updated = [...prev];
        updated[existingIndex] = newChange;
        return updated;
      } else {
        // 새 변경 추가
        return [...prev, newChange];
      }
    });

    // pending 상태로 설정 (debounce 대기 중)
    setSyncStatus('pending');

    // 동기화 스케줄링
    scheduleSync();
  }, [scheduleSync]);

  // ============================================
  // 즉시 동기화 강제
  // ============================================

  const flush = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await executeSync();
  }, [executeSync]);

  // ============================================
  // 에러 관련
  // ============================================

  const clearError = useCallback(() => {
    setLastError(null);
    setSyncStatus('idle');
  }, []);

  const retryFailed = useCallback(() => {
    // 실패한 변경들의 재시도 횟수 리셋
    setPendingChanges(prev =>
      prev.map(c => ({ ...c, retryCount: 0 }))
    );
    setLastError(null);
    scheduleSync();
  }, [scheduleSync]);

  // ============================================
  // 유틸리티
  // ============================================

  const getChangeForEntity = useCallback((
    entityId: number,
    type: ChangeType
  ): PendingChange<T, S> | undefined => {
    return pendingChangesRef.current.find(
      c => c.entityId === entityId && c.type === type
    );
  }, []);

  // ============================================
  // 페이지 이탈 경고
  // ============================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 실제 저장 중이거나 대기 중인 변경이 있을 때
      if (isSyncingRef.current || pendingChangesRef.current.length > 0) {
        e.preventDefault();
        // 저장 중일 때와 대기 중일 때 메시지 구분
        // (참고: 대부분의 브라우저는 커스텀 메시지를 무시하고 기본 메시지 표시)
        const message = isSyncingRef.current
          ? '저장 중입니다. 잠시만 기다려주세요.'
          : '저장되지 않은 변경 사항이 있습니다. 페이지를 떠나시겠습니까?';
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ============================================
  // 클린업
  // ============================================

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ============================================
  // 반환
  // ============================================

  return {
    // 상태
    pendingCount: pendingChanges.length,
    isSyncing,
    syncStatus,
    lastError,
    pendingChanges,

    // 메서드
    queueChange,
    flush,
    clearError,
    retryFailed,

    // 유틸리티
    hasPendingChanges: pendingChanges.length > 0,
    getChangeForEntity,
  };
}

export default usePendingSync;
