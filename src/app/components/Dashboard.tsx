"use client";

import React, { useState, useEffect } from 'react';

// ============================================
// API 설정
// ============================================
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    USE_MOCK: true,
};

// 목업 데이터
const MOCK_DATA = {
    user: {
        id: 1,
        email: 'student@jj.ac.kr',
        name: '김도모',
    },
    workspaces: [
        {
            id: 1,
            name: '캡스톤디자인',
            description: '2024-2 캡스톤 프로젝트',
            owner_id: 1,
            projects: [
                { id: 1, name: 'Domo 협업 플랫폼', progress: 65, memberCount: 4, lastActivity: '2분 전' },
                { id: 2, name: 'API 문서 작성', progress: 30, memberCount: 4, lastActivity: '1시간 전' },
            ],
        },
        {
            id: 2,
            name: '소프트웨어공학',
            description: '팀 과제',
            owner_id: 2,
            projects: [
                { id: 3, name: '요구사항 분석', progress: 100, memberCount: 3, lastActivity: '1일 전' },
            ],
        },
    ],
    onlineMembers: [
        { id: 1, name: '김도모', email: 'student@jj.ac.kr' },
        { id: 2, name: '이협업', email: 'collab@jj.ac.kr' },
    ],
    todayTasks: [
        { id: 1, title: 'UI 디자인 완료', project: 'Domo 협업 플랫폼', dueTime: '오후 6시' },
        { id: 2, title: 'API 연동 테스트', project: 'Domo 협업 플랫폼', dueTime: '오후 11시' },
    ],
};

const api = {
    getWorkspaces: async () => {
        if (API_CONFIG.USE_MOCK) {
            await new Promise(r => setTimeout(r, 300));
            return MOCK_DATA.workspaces;
        }
        const res = await fetch(`${API_CONFIG.BASE_URL}/workspaces`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('워크스페이스 조회 실패');
        return res.json();
    },

    getProjects: async (workspaceId: number) => {
        if (API_CONFIG.USE_MOCK) {
            await new Promise(r => setTimeout(r, 200));
            const ws = MOCK_DATA.workspaces.find(w => w.id === workspaceId);
            return ws?.projects || [];
        }
        const res = await fetch(`${API_CONFIG.BASE_URL}/workspaces/${workspaceId}/projects`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('프로젝트 조회 실패');
        return res.json();
    },

    getOnlineMembers: async (workspaceId: number) => {
        if (API_CONFIG.USE_MOCK) {
            await new Promise(r => setTimeout(r, 200));
            return MOCK_DATA.onlineMembers;
        }
        const res = await fetch(`${API_CONFIG.BASE_URL}/workspaces/${workspaceId}/online-members`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('온라인 멤버 조회 실패');
        return res.json();
    },

    logout: async () => {
        if (API_CONFIG.USE_MOCK) {
            await new Promise(r => setTimeout(r, 200));
            return { message: '로그아웃 되었습니다.' };
        }
        const res = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        return res.json();
    },
};

// ============================================
// 타입
// ============================================
interface Project {
    id: number;
    name: string;
    progress: number;
    memberCount: number;
    lastActivity: string;
}

interface Workspace {
    id: number;
    name: string;
    description?: string;
    owner_id: number;
    projects: Project[];
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Task {
    id: number;
    title: string;
    project: string;
    dueTime: string;
}

// ============================================
// 컴포넌트
// ============================================
interface DashboardProps {
    user: { email: string; name: string };
    onLogout?: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [onlineMembers, setOnlineMembers] = useState<User[]>([]);
    const [todayTasks] = useState<Task[]>(MOCK_DATA.todayTasks);
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            loadOnlineMembers(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

    const loadWorkspaces = async () => {
        try {
            const data = await api.getWorkspaces();
            setWorkspaces(data);
            if (data.length > 0) {
                setSelectedWorkspace(data[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadOnlineMembers = async (workspaceId: number) => {
        try {
            const data = await api.getOnlineMembers(workspaceId);
            setOnlineMembers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        await api.logout();
        onLogout?.();
    };

    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* Header */}
            <header
                className="h-14 border-b flex items-center justify-between px-6"
                style={{ borderColor: 'var(--border-primary)' }}
            >
                <div className="flex items-center gap-6">
                    <h1
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Domo
                    </h1>

                    {/* 워크스페이스 선택 */}
                    <select
                        value={selectedWorkspace?.id || ''}
                        onChange={(e) => {
                            const ws = workspaces.find(w => w.id === Number(e.target.value));
                            setSelectedWorkspace(ws || null);
                        }}
                        className="h-8 px-3 text-sm rounded-md border outline-none"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        {workspaces.map(ws => (
                            <option key={ws.id} value={ws.id}>{ws.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    {/* 다크모드 토글 */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                        {isDark ? (
                            <svg className="w-4 h-4" fill="none" stroke="var(--text-secondary)" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="5"/>
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="var(--text-secondary)" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                            </svg>
                        )}
                    </button>

                    {/* 유저 메뉴 */}
                    <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user.name}
            </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar - 퀵 인사이트 */}
                <aside
                    className="w-64 border-r p-4 min-h-[calc(100vh-56px)]"
                    style={{ borderColor: 'var(--border-primary)' }}
                >
                    {/* 오늘 마감 */}
                    <div className="mb-6">
                        <h3
                            className="text-xs font-medium mb-3 uppercase tracking-wider"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            오늘 마감
                        </h3>
                        {todayTasks.length > 0 ? (
                            <div className="space-y-2">
                                {todayTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="p-3 rounded-lg"
                                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                                    >
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {task.title}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                            {task.project} · {task.dueTime}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                오늘 마감인 작업이 없습니다
                            </p>
                        )}
                    </div>

                    {/* 온라인 멤버 */}
                    <div>
                        <h3
                            className="text-xs font-medium mb-3 uppercase tracking-wider"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            온라인 ({onlineMembers.length})
                        </h3>
                        <div className="space-y-2">
                            {onlineMembers.map(member => (
                                <div key={member.id} className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: '#22c55e' }}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {member.name}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    <div className="max-w-4xl">
                        {/* 헤더 */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2
                                    className="text-xl font-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {selectedWorkspace?.name || '워크스페이스'}
                                </h2>
                                {selectedWorkspace?.description && (
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        {selectedWorkspace.description}
                                    </p>
                                )}
                            </div>
                            <button
                                className="h-9 px-4 text-sm font-medium rounded-lg transition-colors"
                                style={{
                                    backgroundColor: 'var(--accent)',
                                    color: 'var(--bg-primary)',
                                }}
                            >
                                + 새 프로젝트
                            </button>
                        </div>

                        {/* 프로젝트 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedWorkspace?.projects.map(project => (
                                <div
                                    key={project.id}
                                    className="p-4 rounded-lg border cursor-pointer transition-colors hover:border-[var(--border-secondary)]"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-primary)',
                                    }}
                                >
                                    <h3
                                        className="font-medium mb-3"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {project.name}
                                    </h3>

                                    {/* 진행률 바 */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span style={{ color: 'var(--text-tertiary)' }}>진행률</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{project.progress}%</span>
                                        </div>
                                        <div
                                            className="h-1.5 rounded-full overflow-hidden"
                                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                        >
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${project.progress}%`,
                                                    backgroundColor: project.progress === 100 ? '#22c55e' : 'var(--text-primary)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* 메타 정보 */}
                                    <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      👥 {project.memberCount}명
                    </span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>
                      {project.lastActivity}
                    </span>
                                    </div>
                                </div>
                            ))}

                            {/* 새 프로젝트 카드 */}
                            <div
                                className="p-4 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors hover:border-[var(--border-secondary)]"
                                style={{
                                    borderColor: 'var(--border-primary)',
                                    minHeight: '140px',
                                }}
                            >
                <span
                    className="text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                  + 새 프로젝트
                </span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}