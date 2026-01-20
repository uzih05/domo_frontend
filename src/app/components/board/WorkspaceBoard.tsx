'use client';

import React, { useState, useEffect } from 'react';
import { Project, Task, Connection, Board, Group, ViewMode } from '@/src/types';
import { BoardCanvas } from './BoardCanvas';
import { CalendarView, TimelineView, SettingsView } from './Views';
import { TaskDetailModal } from '../ui/TaskDetailModal';
import { Mascot } from '../ui/Mascot';

// API 함수들 import
import {
    getTasks,
    getConnections,
    createTask,
    updateTask,
    createConnection,
    deleteConnection,
} from '@/src/lib/api';

import {
    Trello, Calendar as CalendarIcon, StretchHorizontal, Settings,
    ChevronLeft, ChevronRight, ArrowLeft, Loader2
} from 'lucide-react';

interface WorkspaceBoardProps {
    project: Project;
    onBack: () => void;
}

export const WorkspaceBoard: React.FC<WorkspaceBoardProps> = ({ project, onBack }) => {
    // 데이터 상태
    const [tasks, setTasks] = useState<Task[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI 상태
    const [boards, setBoards] = useState<Board[]>([{ id: 1, title: '메인 보드' }]);
    const [activeBoardId, setActiveBoardId] = useState<number>(1);
    const [groups, setGroups] = useState<Group[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // 프로젝트 데이터 로딩
    useEffect(() => {
        const loadProjectData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 태스크와 연결선 동시 로딩
                const [tasksData, connectionsData] = await Promise.all([
                    getTasks(project.id),
                    getConnections(project.id),
                ]);

                // boardId가 없는 태스크에 기본값 설정
                const tasksWithBoard = tasksData.map(t => ({
                    ...t,
                    boardId: t.boardId || activeBoardId,
                }));

                setTasks(tasksWithBoard);
                setConnections(connectionsData);
            } catch (err) {
                console.error('Failed to load project data:', err);
                setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProjectData();
    }, [project.id, activeBoardId]);

    // 보드별 태스크 업데이트 (로컬 상태 + API 호출)
    const handleBoardTasksUpdate = async (boardTasks: Task[]) => {
        // 먼저 로컬 상태 업데이트 (빠른 UI 반응)
        setTasks(prev => {
            const other = prev.filter(t => t.boardId !== activeBoardId);
            return [...other, ...boardTasks];
        });

        // 변경된 태스크들 API 호출 (위치 변경 등)
        // 참고: 실제로는 변경된 것만 추적해서 호출하는 게 좋음
        // 여기서는 간단하게 처리
    };

    // 태스크 생성
    const handleTaskCreate = async (taskData: Partial<Task>): Promise<Task> => {
        try {
            // 기본 컬럼 ID (실제로는 프로젝트의 첫 번째 컬럼 ID를 가져와야 함)
            const columnId = taskData.column_id || 1;

            const newTask = await createTask(columnId, {
                ...taskData,
                boardId: activeBoardId,
            });

            setTasks(prev => [...prev, newTask]);
            return newTask;
        } catch (err) {
            console.error('Failed to create task:', err);
            throw err;
        }
    };

    // 태스크 업데이트
    const handleTaskUpdate = async (updatedTask: Task) => {
        try {
            // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(updatedTask);

            // API 호출
            await updateTask(updatedTask.id, updatedTask);
        } catch (err) {
            console.error('Failed to update task:', err);
            // 실패 시 롤백 로직 필요 (선택사항)
        }
    };

    // 연결선 생성
    const handleConnectionCreate = async (from: number, to: number) => {
        try {
            const newConnection = await createConnection(project.id, {
                from,
                to,
                boardId: activeBoardId,
                style: 'solid',
                shape: 'bezier',
            });

            setConnections(prev => [...prev, newConnection]);
        } catch (err) {
            console.error('Failed to create connection:', err);
        }
    };

    // 연결선 삭제
    const handleConnectionDelete = async (id: number) => {
        try {
            await deleteConnection(project.id, id);
            setConnections(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Failed to delete connection:', err);
        }
    };

    // 연결선 업데이트 (로컬만 - 백엔드에 API 없음)
    const handleConnectionUpdate = (id: number, updates: Partial<Connection>) => {
        setConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    // 로딩 화면
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">프로젝트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 에러 화면
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            {/* Background Ambiance */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/5 dark:bg-blue-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-400/5 dark:bg-purple-900/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Floating Sidebar */}
            <div className={`relative z-20 py-4 pl-4 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${sidebarOpen ? 'w-72' : 'w-20'}`}>
                <div className="glass-panel h-full rounded-[2rem] flex flex-col border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-3 font-bold text-xl text-gray-900 dark:text-white ${!sidebarOpen && 'hidden'} transition-opacity duration-200`}>
                                <Mascot size={32} />
                                <span className="tracking-tight">DOMO</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors ${!sidebarOpen && 'mx-auto'}`}
                            >
                                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                            </button>
                        </div>

                        {sidebarOpen && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors px-1 group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                <span>Back to Projects</span>
                            </button>
                        )}
                    </div>

                    {sidebarOpen && (
                        <div className="px-6 pb-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Project</div>
                            <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm">
                                <div className="font-bold text-lg truncate mb-1" title={project.name}>{project.name}</div>
                                <div className="text-xs text-gray-500 font-medium">{project.workspace}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-4 space-y-1">
                        <button onClick={() => setViewMode('board')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${viewMode === 'board' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <Trello size={20} strokeWidth={viewMode === 'board' ? 2.5 : 2} />
                            {sidebarOpen && <span className="font-medium">Board</span>}
                        </button>
                        <button onClick={() => setViewMode('calendar')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${viewMode === 'calendar' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <CalendarIcon size={20} strokeWidth={viewMode === 'calendar' ? 2.5 : 2} />
                            {sidebarOpen && <span className="font-medium">Calendar</span>}
                        </button>
                        <button onClick={() => setViewMode('timeline')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${viewMode === 'timeline' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <StretchHorizontal size={20} strokeWidth={viewMode === 'timeline' ? 2.5 : 2} />
                            {sidebarOpen && <span className="font-medium">Timeline</span>}
                        </button>
                    </div>

                    <div className="p-4 mt-auto">
                        <button onClick={() => setViewMode('settings')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${viewMode === 'settings' ? 'bg-gray-200 dark:bg-white/10 font-bold text-gray-900 dark:text-white' : ''}`}>
                            <Settings size={20} />
                            {sidebarOpen && <span>Settings</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden z-10 p-4">
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/20 dark:border-white/5 shadow-inner h-full overflow-hidden relative">
                    {viewMode === 'board' && (
                        <BoardCanvas
                            tasks={tasks.filter(t => t.boardId === activeBoardId)}
                            connections={connections.filter(c => c.boardId === activeBoardId)}
                            onTasksUpdate={handleBoardTasksUpdate}
                            onTaskSelect={setSelectedTask}
                            onConnectionCreate={handleConnectionCreate}
                            onConnectionDelete={handleConnectionDelete}
                            onConnectionUpdate={handleConnectionUpdate}
                            boards={boards}
                            activeBoardId={activeBoardId}
                            onSwitchBoard={setActiveBoardId}
                            onAddBoard={(name) => {
                                const newId = Date.now();
                                setBoards([...boards, { id: newId, title: name }]);
                                setActiveBoardId(newId);
                            }}
                            onRenameBoard={(id, name) => setBoards(boards.map(b => b.id === id ? { ...b, title: name } : b))}
                            snapToGrid={snapToGrid}
                            groups={groups.filter(g => g.boardId === activeBoardId)}
                            onGroupsUpdate={(updatedGroups) => {
                                setGroups(prev => {
                                    const otherGroups = prev.filter(g => g.boardId !== activeBoardId);
                                    return [...otherGroups, ...updatedGroups];
                                });
                            }}
                            onToggleGrid={() => setSnapToGrid(!snapToGrid)}
                            onToggleTheme={() => document.documentElement.classList.toggle('dark')}
                        />
                    )}
                    {viewMode === 'calendar' && <CalendarView tasks={tasks} onTaskSelect={setSelectedTask} />}
                    {viewMode === 'timeline' && <TimelineView tasks={tasks} onTaskSelect={setSelectedTask} />}
                    {viewMode === 'settings' && <SettingsView />}
                </div>
            </div>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                    currentUser="User"
                />
            )}
        </div>
    );
}

export default WorkspaceBoard;