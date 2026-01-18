"use client";

import React from 'react';
import type { Node, Assignee } from '@/types';

interface NodeCardProps {
  node: Node;
  isSelected: boolean;
  isConnecting: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: number) => void;
  onClick: () => void;
}

// 상태별 색상
function getStatusColor(status: string): string {
  switch (status) {
    case 'done': return '#22c55e';
    case 'in-progress': return '#f59e0b';
    default: return 'var(--text-tertiary)';
  }
}

// 상태 라벨
function getStatusLabel(status: string): string {
  switch (status) {
    case 'done': return '완료';
    case 'in-progress': return '진행중';
    default: return '예정';
  }
}

// 이름 기반 색상 생성
function getInitialColor(name: string): string {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function NodeCard({
  node,
  isSelected,
  isConnecting,
  onMouseDown,
  onClick,
}: NodeCardProps) {
  return (
    <div
      className={`absolute w-[220px] rounded-lg border-2 cursor-move select-none transition-shadow ${
        isSelected ? 'shadow-lg' : ''
      } ${isConnecting ? 'cursor-pointer' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        backgroundColor: 'var(--bg-primary)',
        borderColor: isSelected
          ? 'var(--text-primary)'
          : 'var(--border-primary)',
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={onClick}
    >
      {/* 상태 인디케이터 */}
      <div
        className="h-1.5 rounded-t-md"
        style={{ backgroundColor: getStatusColor(node.status) }}
      />

      <div className="p-3">
        {/* 제목 */}
        <h3
          className="font-medium text-sm mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {node.title}
        </h3>

        {/* 담당자 아바타 */}
        {node.assignees.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex -space-x-2">
              {node.assignees.slice(0, 3).map((assignee: Assignee, idx: number) => (
                <div
                  key={assignee.id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 relative"
                  style={{
                    backgroundColor: getInitialColor(assignee.name),
                    borderColor: 'var(--bg-primary)',
                    color: 'white',
                    zIndex: 3 - idx,
                  }}
                  title={assignee.name}
                >
                  {assignee.name.charAt(0)}
                </div>
              ))}
              {node.assignees.length > 3 && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  +{node.assignees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 메타 */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: getStatusColor(node.status),
            }}
          >
            {getStatusLabel(node.status)}
          </span>

          {/* 파일 첨부 버튼 */}
          <button
            className="p-1 rounded transition-colors hover:bg-[var(--bg-secondary)]"
            title="파일 첨부"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
      </div>

      {/* 연결 포인트 - 오른쪽 */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-secondary)',
        }}
      />
      {/* 연결 포인트 - 왼쪽 */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-secondary)',
        }}
      />
    </div>
  );
}

// 유틸 함수들도 export
export { getStatusColor, getStatusLabel, getInitialColor };
