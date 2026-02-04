// src/models/api/chat.ts

import { apiFetch, API_CONFIG, mockDelay } from './config';

export interface ChatUser {
    id: number;
    name: string;
    nickname?: string | null;
    email: string;
    profile_image?: string | null;
}

export interface ChatMessage {
    id: number;
    project_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user?: ChatUser | null;
}

/**
 * 채팅 메시지 목록 조회 (입장 시 이전 메시지 로드)
 */
export async function getChatMessages(
    projectId: number,
    limit: number = 50,
    afterId: number = 0
): Promise<ChatMessage[]> {
    if (API_CONFIG.USE_MOCK) {
        await mockDelay();
        return [];
    }

    const params = new URLSearchParams({ limit: String(limit) });
    if (afterId > 0) params.set('after_id', String(afterId));

    return apiFetch<ChatMessage[]>(`/projects/${projectId}/chat?${params}`);
}
