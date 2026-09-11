import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Paperclip,
  MessageSquare,
  Link2,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Filter,
  Flame,
} from 'lucide-react';
import {
  BoardColumn,
  KanbanCard,
  User,
  RFI,
  CardPriority,
  Attachment,
  CardComment,
} from '../types';

interface KanbanBoardProps {
  columns: BoardColumn[];
  cards: KanbanCard[];
  users: User[];
  rfis: RFI[];
  attachments: Attachment[];
  comments: CardComment[];
  currentUser: User;
  onMoveCard: (cardId: string, targetColumnId: string, targetIndex?: number) => void;
  onOpenCardDetail: (card: KanbanCard) => void;
  onAddCard: (columnId: string) => void;
  onAddColumn: (title: string, color: string) => void;
  onUpdateColumn: (columnId: string, title: string, color: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onOpenRfiDetail: (rfi: RFI) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  cards,
  users,
  rfis,
  attachments,
  comments,
  currentUser,
  onMoveCard,
  onOpenCardDetail,
  onAddCard,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onOpenRfiDetail,
}) => {
  // Drag and Drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  // Column edit / create state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState('#111111');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [editColColor, setEditColColor] = useState('');

  // Filtering
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');

  // Permission check: PM and Admin can manage columns
  const canManageColumns = currentUser.role === 'admin' || currentUser.role === 'pm';

  // Extract all unique tags
  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags || [])));

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCardId(cardId);
  };

  const handleDragOverColumn = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragOverCard = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverColumnId(null);
    setDragOverCardId(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!cardId) return;

    let targetIndex: number | undefined;
    if (dragOverCardId && dragOverCardId !== cardId) {
      const colCards = cards
        .filter((c) => c.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position);
      const overIndex = colCards.findIndex((c) => c.id === dragOverCardId);
      if (overIndex !== -1) {
        targetIndex = overIndex;
      }
    }

    onMoveCard(cardId, targetColumnId, targetIndex);
    handleDragEnd();
  };

  const getPriorityBadge = (priority: CardPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="bg-[#CC0000] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111] flex items-center gap-1">
            <Flame className="w-2.5 h-2.5" />
            URGENT · 緊急
          </span>
        );
      case 'high':
        return (
          <span className="bg-[#111111] text-[#F9F9F7] text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            HIGH · 高度
          </span>
        );
      case 'medium':
        return (
          <span className="bg-[#E5E5E0] text-[#111111] text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            MED · 常規
          </span>
        );
      case 'low':
        return (
          <span className="bg-transparent text-[#737373] text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#737373]">
            LOW · 次要
          </span>
        );
    }
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle.trim(), newColColor);
    setNewColTitle('');
    setIsAddingColumn(false);
  };

  const handleSaveEditColumn = (colId: string) => {
    if (!editColTitle.trim()) return;
    onUpdateColumn(colId, editColTitle.trim(), editColColor);
    setEditingColId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden bg-[#F9F9F7] font-mono">
      {/* 1. Filter & Gazette Dispatch Toolbar */}
      <div className="bg-[#F9F9F7] border-b-2 border-[#111111] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search box with classic underline */}
          <div className="flex items-center gap-1.5 bg-white border border-[#111111] px-2 py-1">
            <Search className="w-3.5 h-3.5 text-[#111111]" />
            <input
              type="text"
              id="kanban-search-input"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="檢索任務、工項或標籤..."
              className="bg-transparent text-[#111111] placeholder:text-[#A3A3A3] focus:outline-none w-48 sm:w-60 font-mono text-xs"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-white border border-[#111111] px-2 py-1">
            <span className="text-[10px] text-[#737373] uppercase font-bold">PRIORITY:</span>
            <select
              id="kanban-priority-filter"
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-transparent text-[#111111] font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部等級 (ALL)</option>
              <option value="urgent">緊急 (Urgent)</option>
              <option value="high">高 (High)</option>
              <option value="medium">中 (Medium)</option>
              <option value="low">低 (Low)</option>
            </select>
          </div>

          {/* Tag filter */}
          <div className="flex items-center gap-1 bg-white border border-[#111111] px-2 py-1">
            <span className="text-[10px] text-[#737373] uppercase font-bold">TAG:</span>
            <select
              id="kanban-tag-filter"
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-transparent text-[#111111] font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部工種標籤</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>

          {(searchFilter || selectedTagFilter !== 'ALL' || selectedPriorityFilter !== 'ALL') && (
            <button
              type="button"
              id="kanban-clear-filter"
              onClick={() => {
                setSearchFilter('');
                setSelectedTagFilter('ALL');
                setSelectedPriorityFilter('ALL');
              }}
              className="text-[#111111] hover:text-[#CC0000] underline font-bold text-xs"
            >
              [重設檢索]
            </button>
          )}
        </div>

        {/* Add Column (PM / Admin) */}
        {canManageColumns && (
          <button
            type="button"
            id="btn-add-column-toggle"
            onClick={() => setIsAddingColumn(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#111111] hover:text-[#F9F9F7] text-[#111111] border border-[#111111] text-xs font-bold uppercase tracking-wider transition-colors duration-150 hard-shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            新增版面專欄 (COLUMN)
          </button>
        )}
      </div>

      {/* 2. Newspaper Columns Scroll Area */}
      <div className="flex-1 overflow-x-auto p-4 sm:p-6">
        <div className="flex items-start gap-4 h-full min-w-max pb-4">
          {columns.map((column, colIdx) => {
            const columnCards = cards
              .filter((c) => {
                if (c.columnId !== column.id) return false;
                if (
                  searchFilter &&
                  !c.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
                  !c.description.toLowerCase().includes(searchFilter.toLowerCase()) &&
                  !c.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()))
                ) {
                  return false;
                }
                if (selectedPriorityFilter !== 'ALL' && c.priority !== selectedPriorityFilter) {
                  return false;
                }
                if (selectedTagFilter !== 'ALL' && !c.tags.includes(selectedTagFilter)) {
                  return false;
                }
                return true;
              })
              .sort((a, b) => a.position - b.position);

            const isColumnTarget = dragOverColumnId === column.id;

            return (
              <div
                key={column.id}
                id={`column-${column.id}`}
                onDragOver={(e) => handleDragOverColumn(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`w-80 shrink-0 flex flex-col max-h-full bg-[#F9F9F7] border-2 border-[#111111] transition-all duration-150 ${
                  isColumnTarget ? 'bg-[#F0F0EE] hard-shadow' : 'hard-shadow-sm'
                }`}
              >
                {/* Column Header (Newspaper Column Label) */}
                <div className="p-2.5 bg-[#F9F9F7] border-b-2 border-[#111111] flex items-center justify-between">
                  {editingColId === column.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editColTitle}
                        onChange={(e) => setEditColTitle(e.target.value)}
                        className="text-xs font-mono font-bold px-2 py-1 bg-white border border-[#111111] flex-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditColumn(column.id)}
                        className="p-1 text-[#111111] hover:bg-[#111111] hover:text-white border border-[#111111]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingColId(null)}
                        className="p-1 text-[#111111] hover:bg-[#E5E5E0] border border-[#111111]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-[#111111] text-[#F9F9F7] px-1.5 py-0.2 font-bold">
                          COL.{colIdx + 1}
                        </span>
                        <h3 className="font-serif font-black text-sm uppercase tracking-wider text-[#111111] truncate max-w-[130px]">
                          {column.title}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-[#111111] border border-[#111111] px-1 bg-[#E5E5E0]">
                          {columnCards.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          id={`btn-add-card-to-col-${column.id}`}
                          onClick={() => onAddCard(column.id)}
                          title="在此欄新增工作套件"
                          className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {canManageColumns && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingColId(column.id);
                                setEditColTitle(column.title);
                                setEditColColor(column.color || '#111111');
                              }}
                              title="編輯欄位標題"
                              className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {columns.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `確定要刪除版面欄位「${column.title}」？內部工項將轉移。`
                                    )
                                  ) {
                                    onDeleteColumn(column.id);
                                  }
                                }}
                                title="刪除此欄"
                                className="p-1 border border-[#111111] bg-white hover:bg-[#CC0000] hover:text-white transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Cards List (Article Clippings) */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-[#F9F9F7]">
                  {columnCards.map((card) => {
                    const cardAttachments = attachments.filter(
                      (a) => a.entityType === 'card' && a.entityId === card.id
                    );
                    const cardComments = comments.filter((c) => c.cardId === card.id);
                    const linkedRfi = card.linkedRfiId
                      ? rfis.find((r) => r.id === card.linkedRfiId)
                      : undefined;
                    const cardAssignees = users.filter((u) => card.assigneeIds.includes(u.id));

                    const isOverdue =
                      card.dueDate &&
                      new Date(card.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
                      column.id !== 'col-done';

                    const isBeingDragged = draggedCardId === card.id;

                    return (
                      <div
                        key={card.id}
                        id={`kanban-card-${card.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverCard(e, card.id)}
                        onClick={() => onOpenCardDetail(card)}
                        className={`p-3 bg-[#F9F9F7] border border-[#111111] hard-shadow-hover cursor-grab active:cursor-grabbing ${
                          isBeingDragged ? 'opacity-30 border-dashed border-[#CC0000]' : ''
                        }`}
                      >
                        {/* Header: Priority Badge & RFI Link */}
                        <div className="flex items-center justify-between gap-1.5 mb-2 pb-1 border-b border-[#E5E5E0]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getPriorityBadge(card.priority)}
                            {card.cardType === 'milestone' && (
                              <span className="bg-[#111111] text-[#F9F9F7] text-[9px] font-mono px-1 py-0.5 border border-[#111111]">
                                ◆ 里程碑
                              </span>
                            )}
                          </div>

                          {linkedRfi && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRfiDetail(linkedRfi);
                              }}
                              title={`關聯工程疑義單: ${linkedRfi.rfiNumber}`}
                              className="bg-[#111111] text-white hover:bg-[#CC0000] text-[9px] font-mono font-bold px-1.5 py-0.5 flex items-center gap-1 transition-colors"
                            >
                              <Link2 className="w-2.5 h-2.5" />
                              {linkedRfi.rfiNumber}
                            </button>
                          )}
                        </div>

                        {/* News Headline (Card Title) */}
                        <h4 className="font-serif font-bold text-sm text-[#111111] leading-tight line-clamp-2 mb-1.5 hover:underline decoration-2 decoration-[#CC0000]">
                          {card.title}
                        </h4>

                        {/* Article Lead Excerpt (Description) */}
                        {card.description && (
                          <p className="font-body text-[11px] text-[#525252] line-clamp-2 leading-relaxed mb-2">
                            {card.description.replace(/!\[.*?\]\(.*?\)/g, '[工程照]')}
                          </p>
                        )}

                        {/* Tags */}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {card.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono bg-white text-[#111111] border border-[#111111] px-1 py-0.2"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: Metadata & Assignees */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#111111] text-[10px] font-mono">
                          <div className="flex items-center gap-2 text-[#525252]">
                            {card.dueDate && (
                              <span
                                className={`flex items-center gap-1 font-bold ${
                                  isOverdue
                                    ? 'text-white bg-[#CC0000] px-1 py-0.2'
                                    : 'text-[#111111]'
                                }`}
                                title={`預計到期: ${card.dueDate}`}
                              >
                                <Calendar className="w-3 h-3" />
                                {card.dueDate}
                              </span>
                            )}

                            {cardAttachments.length > 0 && (
                              <span
                                className="flex items-center gap-0.5 text-[#111111]"
                                title={`${cardAttachments.length} 份文件`}
                              >
                                <Paperclip className="w-3 h-3" />
                                {cardAttachments.length}
                              </span>
                            )}

                            {cardComments.length > 0 && (
                              <span
                                className="flex items-center gap-0.5 text-[#111111]"
                                title={`${cardComments.length} 則答覆`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                {cardComments.length}
                              </span>
                            )}
                          </div>

                          {/* Grayscale Assignee Portraits */}
                          <div className="flex items-center -space-x-1">
                            {cardAssignees.map((user) => (
                              <img
                                key={user.id}
                                src={user.avatarUrl}
                                alt={user.name}
                                title={`${user.name} (${user.title})`}
                                className="w-5 h-5 object-cover grayscale border border-[#111111]"
                                referrerPolicy="no-referrer"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnCards.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-[#111111] text-[#737373] text-xs font-mono">
                      [ 本欄尚無工項紀錄 ]
                    </div>
                  )}
                </div>

                {/* Column Footer Add Card */}
                <div className="p-2 border-t-2 border-[#111111] bg-[#F9F9F7]">
                  <button
                    type="button"
                    id={`btn-col-bottom-add-${column.id}`}
                    onClick={() => onAddCard(column.id)}
                    className="w-full py-1.5 px-3 border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F9F9F7] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    新增套件 (ADD WORK PACKAGE)
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Column Box */}
          {isAddingColumn && (
            <div className="w-80 shrink-0 bg-[#F9F9F7] border-2 border-[#111111] hard-shadow p-4 text-[#111111]">
              <div className="flex items-center justify-between border-b border-[#111111] pb-1.5 mb-3">
                <h4 className="font-serif font-bold text-sm uppercase tracking-wider">
                  NEWSPAPER COLUMN SETUP
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(false)}
                  className="p-0.5 hover:bg-[#CC0000] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleCreateColumn} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#737373] uppercase mb-1">
                    專欄名稱 (COLUMN TITLE)
                  </label>
                  <input
                    type="text"
                    id="input-new-col-title"
                    value={newColTitle}
                    onChange={(e) => setNewColTitle(e.target.value)}
                    placeholder="例：監造抽驗、鋼構安裝..."
                    className="w-full px-2.5 py-1.5 border border-[#111111] bg-white text-[#111111] focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#111111]">
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="px-3 py-1 text-xs border border-[#111111] bg-transparent hover:bg-[#E5E5E0]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-add-col"
                    className="px-3 py-1 text-xs font-bold text-white bg-[#111111] hover:bg-[#CC0000] border border-[#111111]"
                  >
                    確認建立
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
