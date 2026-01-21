import type {
    Member,
    Workspace,
    Project,
    Task,
    Connection,
    EditingCard,
    User,
} from '../../types';

// ============================================
// 인증 관련 목업 데이터
// ============================================

export interface MockUser {
    id: number;     // 👈 [추가] id 필드 추가
    email: string;
    password: string;
    name: string;
    is_student_verified: boolean;
}

export const MOCK_USERS: MockUser[] = [
    {
        id: 1,       // 👈 [추가] id 값 1 부여
        email: 'student@jj.ac.kr',
        password: 'test1234',
        name: '김도모',
        is_student_verified: true,
    },
    {
        id: 2,
        email: 'test@jj.ac.kr',
        password: 'test1234',
        name: '이테스트',
        is_student_verified: true,
    },
];

// ============================================
// 사용자/멤버 관련 목업 데이터
// ============================================

export const MOCK_CURRENT_USER: User = {
    id: 1,
    email: 'student@jj.ac.kr',
    name: '김도모',
};

// ... (나머지 코드는 기존과 동일하게 유지) ...
export const MOCK_ONLINE_MEMBERS: User[] = [
    { id: 1, name: '김도모', email: 'student@jj.ac.kr' },
    { id: 2, name: '이협업', email: 'collab@jj.ac.kr' },
];

export const MOCK_MEMBERS: Member[] = [
    { id: 1, name: '김도모', email: 'student@jj.ac.kr', isOnline: true, role: 'PM' },
    { id: 2, name: '이협업', email: 'collab@jj.ac.kr', isOnline: true, role: 'Frontend' },
    { id: 3, name: '박개발', email: 'dev@jj.ac.kr', isOnline: false, role: 'Backend' },
    { id: 4, name: '최디자인', email: 'design@jj.ac.kr', isOnline: false, role: 'Designer' },
];

export const MOCK_WORKSPACES: Workspace[] = [
    {
        id: 1,
        name: '캡스톤디자인',
        description: '2024-2 캡스톤 프로젝트',
        owner_id: 1,
        projects: [
            {
                id: 1,
                name: 'Domo 협업 플랫폼',
                workspace: '캡스톤디자인',
                role: 'PM',
                progress: 65,
                memberCount: 4,
                lastActivity: '2분 전',
                color: '#FEF3C7',
            },
            {
                id: 2,
                name: 'API 문서 작성',
                workspace: '캡스톤디자인',
                role: 'Frontend',
                progress: 30,
                memberCount: 4,
                lastActivity: '1시간 전',
                color: '#DBEAFE',
            },
        ],
    },
    {
        id: 2,
        name: '소프트웨어공학',
        description: '팀 과제',
        owner_id: 2,
        projects: [
            {
                id: 3,
                name: '요구사항 분석',
                workspace: '소프트웨어공학',
                role: 'Researcher',
                progress: 100,
                memberCount: 3,
                lastActivity: '1일 전',
                color: '#FCE7F3',
            },
        ],
    },
];

export const MOCK_PROJECTS: Project[] = [
    {
        id: 1,
        name: 'Domo 협업 플랫폼',
        workspace: '캡스톤디자인',
        role: 'PM',
        progress: 65,
        memberCount: 4,
        lastActivity: '2분 전',
        color: '#FEF3C7',
    },
    {
        id: 2,
        name: 'API 문서 작성',
        workspace: '캡스톤디자인',
        role: 'Frontend',
        progress: 30,
        memberCount: 4,
        lastActivity: '1시간 전',
        color: '#DBEAFE',
    },
    {
        id: 3,
        name: '요구사항 분석',
        workspace: '소프트웨어공학',
        role: 'Researcher',
        progress: 100,
        memberCount: 3,
        lastActivity: '1일 전',
        color: '#FCE7F3',
    },
];

export const MOCK_TASKS: Task[] = [
    {
        id: 1,
        title: '기획서 작성',
        status: 'done',
        x: 100,
        y: 100,
        boardId: 1,
        assignees: [{ id: 1, name: '김도모', avatar: null }],
    },
    {
        id: 2,
        title: 'UI 디자인',
        status: 'in-progress',
        x: 350,
        y: 80,
        boardId: 1,
        assignees: [{ id: 2, name: '이협업', avatar: null }],
    },
    {
        id: 3,
        title: '백엔드 API',
        status: 'in-progress',
        x: 350,
        y: 220,
        boardId: 1,
        assignees: [{ id: 3, name: '박개발', avatar: null }],
    },
    {
        id: 4,
        title: '프론트엔드 개발',
        status: 'todo',
        x: 600,
        y: 150,
        boardId: 1,
        assignees: [
            { id: 1, name: '김도모', avatar: null },
            { id: 2, name: '이협업', avatar: null },
        ],
    },
    {
        id: 5,
        title: '테스트',
        status: 'todo',
        x: 850,
        y: 150,
        boardId: 1,
        assignees: [],
    },
    {
        id: 6,
        title: '프로젝트 시작',
        status: 'todo',
        x: 100,
        y: 300,
        boardId: 1,
        description: 'DOMO 협업 플랫폼에 오신 것을 환영합니다!',
        assignees: [],
    },
];

export const MOCK_NODES = MOCK_TASKS;

export const MOCK_CONNECTIONS: Connection[] = [
    { id: 1, from: 1, to: 2, boardId: 1 },
    { id: 2, from: 1, to: 3, boardId: 1 },
    { id: 3, from: 2, to: 4, boardId: 1 },
    { id: 4, from: 3, to: 4, boardId: 1 },
    { id: 5, from: 4, to: 5, boardId: 1 },
];

export const MOCK_TODAY_TASKS: Task[] = [
    {
        id: 101,
        title: 'UI 디자인 완료',
        status: 'todo',
        x: 0,
        y: 0,
        boardId: 1,
    },
    {
        id: 102,
        title: 'API 연동 테스트',
        status: 'todo',
        x: 0,
        y: 0,
        boardId: 1,
    },
];

export const MOCK_EDITING_CARDS: EditingCard[] = [
    { id: 2, title: 'UI 디자인', user: '이협업' },
];