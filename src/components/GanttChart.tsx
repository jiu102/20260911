import React, { useState, useRef, useMemo } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Clock,
  Link2,
  Diamond,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { KanbanCard, BoardColumn, User, CardPriority, RFI } from '../types';

interface GanttChartProps {
  cards: KanbanCard[];
  columns: BoardColumn[];
  users: User[];
  rfis: RFI[];
  currentUser: User;
  onOpenCardDetail: (card: KanbanCard) => void;
  onOpenCreateCard: () => void;
  onUpdateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

export const GanttChart: React.FC<GanttChartProps> = ({
  cards,
  columns,
  users,
  rfis,
  currentUser,
  onOpenCardDetail,
  onOpenCreateCard,
  onUpdateCard,
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumnId, setFilterColumnId] = useState<string>('ALL');
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('ALL');
  const [tableWidth, setTableWidth] = useState<number>(440); // left pane width
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  // Column width per day based on zoom
  const dayWidth = zoomLevel === 'day' ? 38 : zoomLevel === 'week' ? 20 : 8;

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filterColumnId !== 'ALL' && card.columnId !== filterColumnId) return false;
      if (filterAssigneeId !== 'ALL' && !card.assigneeIds.includes(filterAssigneeId)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchTags = card.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchTags) return false;
      }
      return true;
    });
  }, [cards, filterColumnId, filterAssigneeId, searchQuery]);

  // Determine timeline boundary
  const { timelineStart, timelineEnd, totalDays, daysList } = useMemo(() => {
    let minTime = new Date('2026-08-18').getTime();
    let maxTime = new Date('2026-10-15').getTime();

    cards.forEach((c) => {
      if (c.startDate) {
        const t = new Date(c.startDate).getTime();
        if (!isNaN(t) && t < minTime) minTime = t - 7 * 86400000;
      }
      if (c.dueDate) {
        const t = new Date(c.dueDate).getTime();
        if (!isNaN(t) && t > maxTime) maxTime = t + 14 * 86400000;
      }
    });

    const start = new Date(minTime);
    start.setHours(0, 0, 0, 0);
    const end = new Date(maxTime);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    const list: Date[] = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      list.push(d);
    }

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: diffDays,
      daysList: list,
    };
  }, [cards]);

  // Sync horizontal scrolling between timeline header and timeline body
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Scroll to Today marker
  const scrollToToday = () => {
    if (!timelineScrollRef.current) return;
    const today = new Date('2026-09-10'); // matching demo context time
    const diff = Math.floor((today.getTime() - timelineStart.getTime()) / 86400000);
    const targetScroll = Math.max(0, diff * dayWidth - 200);
    timelineScrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  // Group days into months for the top header row
  const monthGroups = useMemo(() => {
    const groups: { label: string; daysCount: number }[] = [];
    let currentLabel = '';
    let count = 0;

    daysList.forEach((d) => {
      const label = `${d.getFullYear()}年 ${d.getMonth() + 1}月`;
      if (label !== currentLabel) {
        if (currentLabel) {
          groups.push({ label: currentLabel, daysCount: count });
        }
        currentLabel = label;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentLabel) {
      groups.push({ label: currentLabel, daysCount: count });
    }
    return groups;
  }, [daysList]);

  // Compute position and width for a card
  const getCardBarLayout = (card: KanbanCard) => {
    const createdDate = card.startDate ? new Date(card.startDate) : new Date(card.createdAt);
    const dueDate = card.dueDate ? new Date(card.dueDate) : new Date(createdDate.getTime() + 5 * 86400000);

    const startDiffDays = Math.max(
      0,
      Math.floor((createdDate.getTime() - timelineStart.getTime()) / 86400000)
    );
    const durationDays = Math.max(
      1,
      Math.ceil((dueDate.getTime() - createdDate.getTime()) / 86400000)
    );

    const left = startDiffDays * dayWidth;
    const width = durationDays * dayWidth;

    return {
      left,
      width,
      isMilestone: card.cardType === 'milestone',
    };
  };

  // Calculate Dependency SVG lines
  const dependencyLines = useMemo(() => {
    const lines: { path: string; isHighlighted: boolean }[] = [];

    filteredCards.forEach((card, fromIdx) => {
      if (card.dependsOn && card.dependsOn.length > 0) {
        card.dependsOn.forEach((targetCardId) => {
          const targetIdx = filteredCards.findIndex((c) => c.id === targetCardId);
          if (targetIdx !== -1) {
            const fromLayout = getCardBarLayout(filteredCards[targetIdx]);
            const toLayout = getCardBarLayout(card);

            const x1 = fromLayout.left + fromLayout.width;
            const y1 = targetIdx * 44 + 22;

            const x2 = toLayout.left;
            const y2 = fromIdx * 44 + 22;

            const midX = x1 + 14;
            const path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

            const isHighlighted =
              hoveredCardId === card.id || hoveredCardId === targetCardId;

            lines.push({ path, isHighlighted });
          }
        });
      }
    });

    return lines;
  }, [filteredCards, timelineStart, dayWidth, hoveredCardId]);

  const today = new Date('2026-09-10');
  today.setHours(0, 0, 0, 0);
  const todayOffset = Math.floor((today.getTime() - timelineStart.getTime()) / 86400000) * dayWidth;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden bg-[#F9F9F7] font-mono select-none">
      {/* 1. Control Toolbar in Newsprint Editorial Style */}
      <div className="bg-[#F9F9F7] border-b-2 border-[#111111] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search box */}
          <div className="flex items-center gap-1.5 bg-white border border-[#111111] px-2 py-1">
            <Search className="w-3.5 h-3.5 text-[#111111]" />
            <input
              type="text"
              id="input-gantt-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋甘特任務、里程碑..."
              className="bg-transparent text-[#111111] placeholder:text-[#A3A3A3] focus:outline-none w-44 lg:w-56 font-mono text-xs"
            />
          </div>

          {/* Column/Status filter */}
          <div className="flex items-center gap-1 bg-white border border-[#111111] px-2 py-1">
            <span className="text-[10px] text-[#737373] uppercase font-bold">STATUS:</span>
            <select
              id="select-gantt-column-filter"
              value={filterColumnId}
              onChange={(e) => setFilterColumnId(e.target.value)}
              className="bg-transparent text-[#111111] font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部狀態 (ALL)</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee filter */}
          <div className="hidden lg:flex items-center gap-1 bg-white border border-[#111111] px-2 py-1">
            <span className="text-[10px] text-[#737373] uppercase font-bold">ASSIGNEE:</span>
            <select
              id="select-gantt-assignee-filter"
              value={filterAssigneeId}
              onChange={(e) => setFilterAssigneeId(e.target.value)}
              className="bg-transparent text-[#111111] font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">全體人員</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Zoom & Today Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sharp Zoom switcher */}
          <div className="flex items-center border border-[#111111] bg-white divide-x divide-[#111111] text-xs">
            <button
              type="button"
              id="btn-zoom-day"
              onClick={() => setZoomLevel('day')}
              className={`px-2.5 py-1 font-bold uppercase tracking-wider transition-colors ${
                zoomLevel === 'day'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              日 (DAY)
            </button>
            <button
              type="button"
              id="btn-zoom-week"
              onClick={() => setZoomLevel('week')}
              className={`px-2.5 py-1 font-bold uppercase tracking-wider transition-colors ${
                zoomLevel === 'week'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              週 (WK)
            </button>
            <button
              type="button"
              id="btn-zoom-month"
              onClick={() => setZoomLevel('month')}
              className={`px-2.5 py-1 font-bold uppercase tracking-wider transition-colors ${
                zoomLevel === 'month'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              月 (MO)
            </button>
          </div>

          {/* Today button */}
          <button
            type="button"
            id="btn-gantt-today"
            onClick={scrollToToday}
            className="px-2.5 py-1 bg-white border border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 hard-shadow-sm"
          >
            <Clock className="w-3 h-3 text-[#CC0000]" />
            今日定位
          </button>

          {/* Add Work Package Button */}
          <button
            type="button"
            id="btn-gantt-create-task"
            onClick={onOpenCreateCard}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] text-xs font-bold uppercase tracking-wider border border-[#111111] transition-colors hard-shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>建立套件</span>
          </button>
        </div>
      </div>

      {/* 2. Main Split Body: Left Work Packages Table + Right Timeline Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Newspaper Table */}
        <div
          style={{ width: `${tableWidth}px` }}
          className="border-r-2 border-[#111111] bg-[#F9F9F7] flex flex-col shrink-0 overflow-hidden"
        >
          {/* Table Header */}
          <div className="h-14 bg-[#E5E5E0] border-b-2 border-[#111111] flex items-center px-3 text-xs font-bold text-[#111111] uppercase tracking-wider shrink-0 font-mono">
            <div className="w-10 text-center text-[#737373]">#</div>
            <div className="flex-1 px-2">工項與工事套件 (PACKAGE)</div>
            <div className="w-20 text-center">狀態</div>
            <div className="w-14 text-center">負責</div>
            <div className="w-14 text-right pr-2">進度</div>
          </div>

          {/* Table Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#111111]">
            {filteredCards.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#737373] font-mono">
                [ 查無符合條件之工作套件 ]
              </div>
            ) : (
              filteredCards.map((card, idx) => {
                const column = columns.find((c) => c.id === card.columnId);
                const firstAssignee = users.find((u) => u.id === card.assigneeIds[0]);
                const progress = card.progress ?? (card.columnId === 'col-done' ? 100 : 0);

                return (
                  <div
                    key={card.id}
                    id={`gantt-row-${card.id}`}
                    onClick={() => onOpenCardDetail(card)}
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className={`h-[44px] flex items-center px-3 text-xs cursor-pointer transition-colors duration-150 ${
                      hoveredCardId === card.id
                        ? 'bg-[#E5E5E0]'
                        : idx % 2 === 0
                        ? 'bg-[#F9F9F7]'
                        : 'bg-[#F0F0EE]'
                    }`}
                  >
                    {/* Index / ID */}
                    <div className="w-10 text-center font-mono text-[11px] text-[#737373]">
                      #{idx + 1}
                    </div>

                    {/* Title & Type Icon */}
                    <div className="flex-1 px-2 min-w-0 flex items-center gap-1.5 font-serif font-bold text-[#111111]">
                      {card.cardType === 'milestone' ? (
                        <Diamond className="w-3.5 h-3.5 text-[#111111] fill-[#111111] shrink-0" />
                      ) : card.linkedRfiId ? (
                        <Link2 className="w-3.5 h-3.5 text-[#CC0000] shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 bg-[#111111] shrink-0" />
                      )}
                      <span className="truncate" title={card.title}>
                        {card.title}
                      </span>
                    </div>

                    {/* Column Badge */}
                    <div className="w-20 text-center shrink-0">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 border border-[#111111] bg-white text-[#111111]">
                        {column?.title.split(' ')[0] || '處理中'}
                      </span>
                    </div>

                    {/* Assignee Avatar */}
                    <div className="w-14 flex justify-center shrink-0">
                      {firstAssignee ? (
                        <img
                          src={firstAssignee.avatarUrl}
                          alt={firstAssignee.name}
                          title={firstAssignee.name}
                          className="w-5 h-5 object-cover grayscale border border-[#111111]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] text-[#737373] font-mono">--</span>
                      )}
                    </div>

                    {/* Progress % */}
                    <div className="w-14 text-right pr-2 shrink-0 font-mono font-bold text-[#111111]">
                      {progress}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Interactive Timeline Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F9F9F7]">
          {/* Header Row: Month / Days */}
          <div
            ref={headerScrollRef}
            className="h-14 bg-[#E5E5E0] border-b-2 border-[#111111] overflow-x-hidden shrink-0"
          >
            {/* Top Row: Months */}
            <div className="h-7 flex border-b border-[#111111]">
              {monthGroups.map((group, idx) => (
                <div
                  key={idx}
                  style={{ width: `${group.daysCount * dayWidth}px` }}
                  className="px-2 font-mono font-bold text-xs text-[#111111] border-r border-[#111111] flex items-center shrink-0 bg-[#E5E5E0]"
                >
                  {group.label}
                </div>
              ))}
            </div>

            {/* Bottom Row: Days / Dates */}
            <div className="h-7 flex">
              {daysList.map((d, idx) => {
                const dayOfWeek = d.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isTodayDate = d.getTime() === today.getTime();

                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`h-full text-[10px] font-mono flex items-center justify-center border-r border-[#E5E5E0] shrink-0 ${
                      isTodayDate
                        ? 'bg-[#CC0000] text-white font-bold'
                        : isWeekend
                        ? 'bg-[#E5E5E0] text-[#737373]'
                        : 'text-[#111111]'
                    }`}
                  >
                    {zoomLevel === 'day' ? (
                      <span>{d.getDate()}</span>
                    ) : zoomLevel === 'week' ? (
                      d.getDate() % 7 === 1 ? (
                        <span>W{Math.ceil(d.getDate() / 7)}</span>
                      ) : (
                        ''
                      )
                    ) : (
                      ''
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Grid & Work Package Bars */}
          <div
            ref={timelineScrollRef}
            onScroll={handleTimelineScroll}
            className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#F9F9F7]"
          >
            {/* Background Grid Columns */}
            <div
              className="absolute top-0 bottom-0 flex pointer-events-none"
              style={{ width: `${totalDays * dayWidth}px`, height: '100%' }}
            >
              {daysList.map((d, idx) => {
                const dayOfWeek = d.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`h-full border-r border-[#E5E5E0] shrink-0 ${
                      isWeekend ? 'bg-[#F0F0EE]' : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Red Vertical Today Line */}
            <div
              style={{ left: `${todayOffset}px` }}
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
            >
              <div className="w-0.5 h-full bg-[#CC0000]" />
              <div className="sticky top-0 -ml-6 bg-[#CC0000] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[#111111]">
                TODAY 9/10
              </div>
            </div>

            {/* SVG Overlay for Dependency Connection Lines */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-15"
              style={{
                width: `${totalDays * dayWidth}px`,
                height: `${filteredCards.length * 44}px`,
              }}
            >
              <defs>
                <marker
                  id="gantt-arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#111111" />
                </marker>
                <marker
                  id="gantt-arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#CC0000" />
                </marker>
              </defs>

              {dependencyLines.map((line, idx) => (
                <path
                  key={idx}
                  d={line.path}
                  fill="none"
                  stroke={line.isHighlighted ? '#CC0000' : '#111111'}
                  strokeWidth={line.isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={line.isHighlighted ? 'none' : '3,3'}
                  markerEnd={
                    line.isHighlighted ? 'url(#gantt-arrow-active)' : 'url(#gantt-arrow)'
                  }
                />
              ))}
            </svg>

            {/* Rows & Gantt Bars */}
            <div
              style={{ width: `${totalDays * dayWidth}px` }}
              className="relative z-10 divide-y divide-[#111111]"
            >
              {filteredCards.map((card) => {
                const layout = getCardBarLayout(card);
                const progress = card.progress ?? (card.columnId === 'col-done' ? 100 : 0);
                const isHovered = hoveredCardId === card.id;
                const isUrgent = card.priority === 'urgent';
                const isDone = card.columnId === 'col-done';

                return (
                  <div
                    key={card.id}
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                    className={`h-[44px] relative flex items-center ${
                      isHovered ? 'bg-[#E5E5E0]' : ''
                    }`}
                  >
                    {/* Gantt Bar or Milestone marker */}
                    {layout.isMilestone ? (
                      // Milestone Diamond Shape
                      <div
                        style={{ left: `${layout.left}px` }}
                        onClick={() => onOpenCardDetail(card)}
                        title={`里程碑：${card.title}\n預定日：${card.dueDate}`}
                        className="absolute cursor-pointer group z-10 flex items-center gap-2"
                      >
                        <div className="w-4 h-4 bg-[#111111] border-2 border-[#111111] rotate-45 group-hover:scale-125 transition-transform" />
                        <span className="text-[10px] font-mono font-bold text-[#111111] bg-white border border-[#111111] px-1 py-0.5 whitespace-nowrap">
                          {card.title}
                        </span>
                      </div>
                    ) : (
                      // Regular Task Bar
                      <div
                        style={{
                          left: `${layout.left}px`,
                          width: `${Math.max(28, layout.width)}px`,
                        }}
                        onClick={() => onOpenCardDetail(card)}
                        title={`${card.title}\n起訖：${card.startDate || card.createdAt.split('T')[0]} ~ ${card.dueDate}\n進度：${progress}%\n點擊可查閱規格`}
                        className={`absolute h-6 border-2 cursor-pointer group z-10 overflow-hidden flex items-center transition-all ${
                          isUrgent
                            ? 'border-[#CC0000] bg-white text-[#CC0000]'
                            : isDone
                            ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                            : 'border-[#111111] bg-white text-[#111111]'
                        } ${isHovered ? 'hard-shadow' : ''}`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          style={{ width: `${progress}%` }}
                          className={`absolute left-0 top-0 bottom-0 ${
                            isUrgent
                              ? 'bg-[#CC0000] opacity-25'
                              : isDone
                              ? 'bg-[#111111]'
                              : 'bg-[#111111] opacity-20'
                          }`}
                        />

                        {/* Bar Label */}
                        <div className="relative px-2 flex items-center justify-between w-full text-[10px] font-mono font-bold whitespace-nowrap overflow-hidden">
                          <span className="truncate">{card.title}</span>
                          {layout.width > 60 && (
                            <span className="opacity-90 ml-1">{progress}%</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Newspaper Legend Status Bar */}
      <div className="h-8 bg-[#E5E5E0] border-t-2 border-[#111111] px-4 flex items-center justify-between text-xs font-mono text-[#111111] shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-white border border-[#111111]" />
            常態任務 (STANDARD)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#111111] rotate-45 inline-block" />
            重大里程碑 (MILESTONE)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#CC0000]" />
            緊急重要項目 (URGENT)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#111111]" />
            已結案/驗收 (DONE)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#737373]">
          <span>✦ 點選任務條即可開啟工程規格與時程詳細公報 ✦</span>
        </div>
      </div>
    </div>
  );
};
