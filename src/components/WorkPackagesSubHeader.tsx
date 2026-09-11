import React from 'react';
import {
  Kanban as KanbanIcon,
  BarChart3,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Diamond,
  FileText,
} from 'lucide-react';
import { Project, KanbanCard, RFI } from '../types';

interface WorkPackagesSubHeaderProps {
  activeProject: Project;
  cards: KanbanCard[];
  rfis: RFI[];
  currentPmView: 'kanban' | 'gantt';
  onViewChange: (view: 'kanban' | 'gantt') => void;
  onOpenCreateCard: () => void;
}

export const WorkPackagesSubHeader: React.FC<WorkPackagesSubHeaderProps> = ({
  activeProject,
  cards,
  rfis,
  currentPmView,
  onViewChange,
  onOpenCreateCard,
}) => {
  const inProgressCards = cards.filter((c) => c.columnId === 'col-in-progress').length;
  const doneCards = cards.filter((c) => c.columnId === 'col-done').length;
  const milestones = cards.filter((c) => c.cardType === 'milestone').length;
  const scheduleDelayRfis = rfis.filter((r) => r.scheduleImpact && r.status !== 'closed').length;

  return (
    <div className="bg-[#F9F9F7] border-b-2 border-[#111111] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 font-mono text-xs">
      {/* Editorial Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="bg-[#111111] text-[#F9F9F7] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          SEC. B
        </span>
        <span className="text-[#525252] uppercase tracking-wider">PROJECT REGISTRY</span>
        <span className="text-[#111111] font-bold">/</span>
        <span className="font-serif font-bold text-sm text-[#111111] truncate max-w-[180px] sm:max-w-[280px]">
          {activeProject.name}
        </span>
        <span className="text-[#111111] font-bold">/</span>
        <span className="font-mono text-[#111111] font-bold uppercase tracking-wider bg-[#E5E5E0] px-1.5 py-0.5 border border-[#111111]">
          WORK PACKAGES
        </span>
      </div>

      {/* Center: Sharp Newspaper Switcher (Kanban vs Gantt) */}
      <div className="flex items-center border-2 border-[#111111] bg-[#F9F9F7] divide-x-2 divide-[#111111]">
        <button
          type="button"
          id="btn-switch-to-kanban"
          onClick={() => onViewChange('kanban')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold uppercase tracking-wider transition-colors duration-150 ${
            currentPmView === 'kanban'
              ? 'bg-[#111111] text-[#F9F9F7]'
              : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
          }`}
        >
          <KanbanIcon className="w-3.5 h-3.5" />
          <span>[ 專案看板 · KANBAN ]</span>
        </button>

        <button
          type="button"
          id="btn-switch-to-gantt"
          onClick={() => onViewChange('gantt')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold uppercase tracking-wider transition-colors duration-150 ${
            currentPmView === 'gantt'
              ? 'bg-[#111111] text-[#F9F9F7]'
              : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>[ 甘特時程 · GANTT ]</span>
        </button>
      </div>

      {/* Right Stats & Quick Dispatch */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#525252]">
          <span className="flex items-center gap-1 border border-[#111111] px-2 py-0.5 bg-[#F9F9F7]">
            <span className="w-2 h-2 bg-[#111111]" />
            進行中：<strong className="text-[#111111]">{inProgressCards}</strong>
          </span>
          <span className="flex items-center gap-1 border border-[#111111] px-2 py-0.5 bg-[#F9F9F7]">
            <CheckCircle2 className="w-3 h-3 text-[#111111]" />
            已完成：<strong className="text-[#111111]">{doneCards}</strong>
          </span>
          {milestones > 0 && (
            <span className="flex items-center gap-1 border border-[#111111] px-2 py-0.5 bg-[#E5E5E0]">
              <Diamond className="w-3 h-3 text-[#111111] fill-[#111111]" />
              里程碑：<strong className="text-[#111111]">{milestones}</strong>
            </span>
          )}
          {scheduleDelayRfis > 0 && (
            <span className="flex items-center gap-1 text-white font-bold bg-[#CC0000] px-2 py-0.5 border border-[#111111]">
              <AlertTriangle className="w-3 h-3" />
              工期警示：{scheduleDelayRfis} 件
            </span>
          )}
        </div>

        <button
          type="button"
          id="btn-sub-create-card"
          onClick={onOpenCreateCard}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] border border-[#111111] text-xs font-bold uppercase tracking-wider transition-colors hard-shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>建立工事套件</span>
        </button>
      </div>
    </div>
  );
};
