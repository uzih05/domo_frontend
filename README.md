# DOMO - Collaborative Workspace Platform

캔버스 기반의 실시간 협업 워크스페이스. 태스크 보드, 파일 공유, 음성 채팅을 단일 인터페이스로 제공한다.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Architecture](#3-architecture)
4. [Key Patterns](#4-key-patterns)
5. [Convention](#5-convention)
6. [Quality Status](#6-quality-status)

---

## 1. Overview

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 22.15.0+ |
| Framework | Next.js (App Router) | 16.1.3 |
| Language | TypeScript (Strict) | 5.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Icons | Lucide React | 0.562.0 |
| Backend | FastAPI (Python) | 별도 저장소 |
| Real-time | WebSocket / WebRTC | - |

### Project Stats

| Metric | Value |
|--------|-------|
| TypeScript 파일 | 64개 |
| 총 코드 라인 | 16,498줄 |
| containers/ | 13개 |
| views/ | 28개 |
| models/ | 19개 |

---

## 2. Getting Started

### Prerequisites

```bash
node -v  # 22.15.0 이상
npm -v
```

### Installation

```bash
git clone <repository-url>
cd domo_front
npm install
```

### Environment Variables

`.env.local` 파일을 프로젝트 루트에 생성한다.

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://ws.example.com
NEXT_PUBLIC_USE_MOCK=true
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | FastAPI 백엔드 엔드포인트 |
| `NEXT_PUBLIC_WS_URL` | No | WebSocket 시그널링 서버 |
| `NEXT_PUBLIC_USE_MOCK` | No | Mock 데이터 사용 여부 |

### Commands

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm start        # 프로덕션 서버
npm run lint     # 린트 검사
npx tsc --noEmit # 타입 검사
```

---

## 3. Architecture

### 3.1 Layer Structure

```
app/                    Entry Point (Next.js App Router)
    |
containers/             Logic Layer
    |-- screens/        화면 단위 컨트롤러
    |-- hooks/          비즈니스 로직 Hooks
    |
views/                  UI Layer (Props Only)
    |
models/                 Data Layer
    |-- api/            API 통신
    |-- types/          타입 정의
    |-- constants/      상수
    |-- utils/          유틸리티
```

### 3.2 Directory Structure

```
src/
|-- app/
|   |-- page.tsx                메인 라우트
|   |-- layout.tsx              루트 레이아웃
|   |-- globals.css             전역 스타일
|
|-- containers/
|   |-- screens/
|   |   |-- BoardScreen.tsx         메인 보드 (944 lines)
|   |   |-- ProjectSelectScreen.tsx 프로젝트 선택 (837 lines)
|   |   |-- WorkspaceListScreen.tsx 워크스페이스 목록 (421 lines)
|   |   |-- LoginScreen.tsx         로그인
|   |   |-- SignupScreen.tsx        회원가입
|   |   |-- VerifyEmailScreen.tsx   이메일 인증
|   |
|   |-- hooks/
|       |-- common/
|       |   |-- usePendingSync.ts   Optimistic UI (694 lines)
|       |   |-- useVoiceChat.ts     WebRTC 음성채팅 (313 lines)
|       |-- board/
|           |-- useSortableGrid.ts  드래그앤드롭 (587 lines)
|
|-- views/
|   |-- board/
|   |   |-- BoardCanvas.tsx         메인 캔버스 (1993 lines)
|   |   |-- SortableGroup.tsx       그룹 컴포넌트 (321 lines)
|   |   |-- SyncStatusIndicator.tsx 동기화 상태
|   |-- task/
|   |   |-- TaskCard.tsx            태스크 카드 (534 lines)
|   |   |-- TaskDetailModal.tsx     태스크 상세 (609 lines)
|   |-- calendar/
|   |-- timeline/
|   |-- profile/
|   |-- dock/
|   |-- community/
|   |-- common/
|
|-- models/
    |-- api/
    |   |-- config.ts               API 설정
    |   |-- board.ts                보드 API (1155 lines)
    |   |-- workspace.ts            워크스페이스 API (568 lines)
    |   |-- auth.ts, user.ts, file.ts, post.ts, activity.ts, schedule.ts
    |   |-- mappers.ts              응답 변환 (328 lines)
    |   |-- mock-data.ts            Mock 데이터 (603 lines)
    |-- types/
    |   |-- index.ts                타입 정의 (433 lines)
    |-- constants/
    |   |-- grid.ts                 그리드 상수
    |-- utils/
        |-- groupLayout.ts          그룹 레이아웃 (350 lines)
        |-- canvas.ts, image.ts
```

### 3.3 Data Flow

```
app/page.tsx
    |
    |-- [인증 전] LoginScreen / SignupScreen
    |
    |-- [인증 후] WorkspaceListScreen --> getWorkspaces()
    |
    |-- [워크스페이스 선택] ProjectSelectScreen --> getProjects()
    |
    |-- [프로젝트 선택] BoardScreen
            |
            |-- loadProjectData()
            |       getTasks(), getConnections(), getColumns()
            |
            |-- BoardCanvas
                    |-- usePendingSync (Optimistic UI, Batch API)
                    |-- useSortableGrid (Drag & Drop)
```

---

## 4. Key Patterns

### 4.1 Optimistic UI with Entity Lock

서버 응답 전에 UI를 먼저 업데이트하고, 드래그 중인 엔티티는 서버 응답으로부터 보호한다.

구현 위치: `usePendingSync.ts`, `BoardCanvas.tsx`

```typescript
// 드래그 시작 시 Lock
lockEntity(cardId);
lockEntities(childCardIds);

// 드래그 종료 시 Flush 후 Unlock
await flushCardChanges();
unlockEntity(cardId);
```

핵심:
- `interactingEntitiesRef`로 드래그 중인 엔티티 ID 추적
- `isEntityLocked()` 체크로 롤백 방지
- `flush()` 완료 후 Lock 해제

### 4.2 Batch API for Multiple Updates

여러 엔티티를 단일 API 호출로 처리한다.

구현 위치: `usePendingSync.ts`

```typescript
queueBatchCardChange([
  { entityId: 1, payload: { x: 100, y: 200 }, snapshot: { ... } },
  { entityId: 2, payload: { x: 150, y: 250 }, snapshot: { ... } },
]);
```

효과:
- API 호출 N회 -> 1회
- 트랜잭션 일관성 보장

### 4.3 Ref Pattern for Stale Closure Prevention

고빈도 이벤트 핸들러에서 항상 최신 상태를 참조한다.

구현 위치: `BoardCanvas.tsx`

```typescript
const tasksRef = useRef(tasks);
useEffect(() => { tasksRef.current = tasks; }, [tasks]);

const handleMove = useCallback(() => {
  // tasksRef.current 사용 (항상 최신)
  onTasksUpdate(tasksRef.current.map(...));
}, [onTasksUpdate]); // tasks 의존성 제거
```

적용 대상: `tasksRef`, `connectionsRef`, `groupsRef`

### 4.4 Development-Only Logging

디버그 로그는 개발 환경에서만 출력한다.

```typescript
const isDev = process.env.NODE_ENV === 'development';
if (isDev) console.log('[Guard] Entity locked:', entityId);
```

---

## 5. Convention

### 5.1 Branch Strategy

```
main                 프로덕션 (직접 커밋 금지)
  |-- develop        개발 통합
        |-- feature/*    기능 개발
        |-- fix/*        버그 수정
        |-- refactor/*   리팩토링
        |-- hotfix/*     긴급 수정
```

### 5.2 Commit Message

Conventional Commits 형식을 따른다.

```bash
git commit -s -m "Type: Title" -m "Body"
```

| Type | Description |
|------|-------------|
| feat | 기능 추가 |
| fix | 버그 수정 |
| refactor | 리팩토링 |
| perf | 성능 개선 |
| style | 포맷팅 |
| docs | 문서 |
| test | 테스트 |
| chore | 빌드/설정 |

### 5.3 Import Order

```typescript
// 1. React/Next.js
import { useState, useCallback } from 'react';

// 2. External
import { Camera } from 'lucide-react';

// 3. Models
import { getTasks } from '@/src/models/api';
import type { Task } from '@/src/models/types';

// 4. Containers
import { usePendingSync } from '@/src/containers/hooks/common';

// 5. Views
import { TaskCard } from '@/src/views/task';
```

### 5.4 Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `BoardCanvas` |
| Hook | use + camelCase | `usePendingSync` |
| Function | camelCase | `handleDragEnd` |
| Constant | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Type | PascalCase | `Task` |

---

## 6. Quality Status

### 6.1 Current Status (2026-01-27)

| Check | Status |
|-------|--------|
| TypeScript Compilation | PASS |
| Git Conflict Markers | PASS |
| Import Path Integrity | PASS |
| Circular Dependencies | PASS |

### 6.2 Architecture Compliance

```
models/ --> views/      0개 (정상)
views/ --> containers/  4개 (hooks 사용)
containers/ --> models/ 18개 (API 호출)
```

### 6.3 Critical Patterns

| Pattern | Location | Status |
|---------|----------|--------|
| tasksRef | BoardCanvas.tsx | PASS |
| Entity Lock | BoardCanvas.tsx, usePendingSync.ts | PASS |
| Flush Before Unlock | BoardCanvas.tsx | PASS |
| Dev-only Logging | BoardCanvas.tsx, usePendingSync.ts | PASS |

---

## Appendix

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| N | 새 카드 생성 |
| C | 그룹 생성 (선택된 카드) |
| Delete | 선택된 카드 삭제 |
| Escape | 드래그 취소 |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | 태스크 조회 |
| POST | /tasks | 태스크 생성 |
| PUT | /tasks/{id} | 태스크 수정 |
| PUT | /tasks/batch | 일괄 수정 |
| DELETE | /tasks/{id} | 태스크 삭제 |

### Troubleshooting

모듈을 찾을 수 없음:
```bash
rm -rf node_modules package-lock.json && npm install
```

타입 에러:
```bash
npx tsc --noEmit
npm run lint -- --fix
```

환경 변수 미적용:
- `.env.local` 위치 확인 (프로젝트 루트)
- `NEXT_PUBLIC_` 접두사 확인
- 개발 서버 재시작

---

Last Updated: 2026-01-27