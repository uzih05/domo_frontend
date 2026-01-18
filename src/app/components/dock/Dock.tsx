"use client";

import React from 'react';
import { DockButton } from './DockButton';
import type { Member, EditingCard } from '@/types';

interface DockProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  editingCards: EditingCard[];
  members: Member[];
  showMembers: boolean;
  setShowMembers: (show: boolean) => void;
}

export function Dock({
  activeMenu,
  onMenuChange,
  editingCards,
  members,
  showMembers,
  setShowMembers,
}: DockProps) {
  const onlineCount = members.filter(m => m.isOnline).length;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 rounded-2xl shadow-lg border"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {/* 왼쪽 메뉴 */}
      <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--border-primary)' }}>
        <DockButton
          icon="📋"
          label="대시보드"
          isActive={activeMenu === 'dashboard'}
          onClick={() => onMenuChange('dashboard')}
        />
        <DockButton
          icon="📁"
          label="파일"
          isActive={activeMenu === 'files'}
          onClick={() => onMenuChange('files')}
        />
        <DockButton
          icon="👤"
          label="마이페이지"
          isActive={activeMenu === 'mypage'}
          onClick={() => onMenuChange('mypage')}
        />
      </div>

      {/* 온라인 멤버 */}
      <div
        className="relative px-3"
        onMouseEnter={() => setShowMembers(true)}
        onMouseLeave={() => setShowMembers(false)}
      >
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {onlineCount}명 온라인
            </span>
          </span>
        </button>

        {/* 멤버 목록 팝업 */}
        {showMembers && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl shadow-lg border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
              팀 멤버
            </p>
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ borderColor: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {member.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 수정중인 카드 */}
      {editingCards.length > 0 && (
        <div className="flex items-center gap-1 pl-3 border-l" style={{ borderColor: 'var(--border-primary)' }}>
          {editingCards.map(card => (
            <div
              key={card.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span style={{ color: 'var(--text-secondary)' }}>
                {card.user}
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}>
                {card.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
