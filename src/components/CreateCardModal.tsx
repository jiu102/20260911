import React, { useState } from 'react';
import { X, Plus, Link2 } from 'lucide-react';
import { BoardColumn, User, RFI, CardPriority } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface CreateCardModalProps {
  initialColumnId?: string;
  columns: BoardColumn[];
  users: User[];
  rfis: RFI[];
  onClose: () => void;
  onSubmit: (data: {
    columnId: string;
    title: string;
    description: string;
    priority: CardPriority;
    startDate?: string;
    dueDate: string;
    progress?: number;
    cardType?: any;
    assigneeIds: string[];
    tags: string[];
    linkedRfiId?: string;
  }) => void;
}

export const CreateCardModal: React.FC<CreateCardModalProps> = ({
  initialColumnId,
  columns,
  users,
  rfis,
  onClose,
  onSubmit,
}) => {
  const [columnId, setColumnId] = useState(initialColumnId || columns[0]?.id || 'col-todo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CardPriority>('medium');
  const [cardType, setCardType] = useState<'task' | 'milestone' | 'phase'>('task');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [progress, setProgress] = useState<number>(0);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(['工程']);
  const [newTagInput, setNewTagInput] = useState('');
  const [linkedRfiId, setLinkedRfiId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      columnId,
      title: title.trim(),
      description: description.trim(),
      priority,
      cardType,
      startDate,
      dueDate,
      progress: Number(progress),
      assigneeIds,
      tags,
      linkedRfiId: linkedRfiId || undefined,
    });
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const clean = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setNewTagInput('');
    }
  };

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono text-[#111111]"
      onClick={onClose}
    >
      <div
        id="create-card-dialog"
        className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-2xl hard-shadow overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#111111] bg-[#E5E5E0] shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#111111] text-white text-[10px] font-bold px-1.5 py-0.5 uppercase">
              DISPATCH ENTRY
            </span>
            <h3 className="font-serif font-black text-[#111111] text-sm sm:text-base uppercase tracking-wider">
              新增工作套件公文 (NEW WORK PACKAGE)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#111111] bg-white hover:bg-[#CC0000] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
          {/* Column selector */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              投放專欄 (TARGET COLUMN)
            </label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              套件標題 (WORK PACKAGE TITLE) *
            </label>
            <input
              type="text"
              id="input-new-card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：B2 機房冰水幹管穿梁施工圖覆核"
              className="w-full font-serif font-bold text-sm px-2.5 py-1.5 border border-[#111111] bg-white focus:outline-none placeholder:text-[#A3A3A3]"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              工事規格說明 (支援 CTRL+V 貼上工程照片)
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="請詳述施工要點、規範或現場交辦事項..."
              minHeight="110px"
            />
          </div>

          {/* Work Package Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
                套件類型 (CLASSIFICATION)
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
              >
                <option value="task">常規工程任務 (Task)</option>
                <option value="milestone">◆ 重大工程里程碑 (Milestone)</option>
                <option value="phase">階段性工作包 (Phase)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
                優先順位 (PRIORITY)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CardPriority)}
                className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
              >
                <option value="urgent">緊急 (Urgent)</option>
                <option value="high">高 (High)</option>
                <option value="medium">中等 (Medium)</option>
                <option value="low">低 (Low)</option>
              </select>
            </div>
          </div>

          {/* Schedule Dates & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white border border-[#111111]">
            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
                起算日期 (START)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 border border-[#111111] bg-[#F9F9F7] font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
                預定到期 (DUE)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2 py-1 border border-[#111111] bg-[#F9F9F7] font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
                起始進度 ({progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#111111] mt-2"
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              指派工程人員 (ASSIGNEES)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-1.5 bg-white border border-[#111111]">
              {users.map((u) => {
                const checked = assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={`p-1.5 text-left text-xs flex items-center gap-2 border transition-colors ${
                      checked
                        ? 'bg-[#111111] text-[#F9F9F7] border-[#111111] font-bold'
                        : 'bg-[#F9F9F7] border-[#111111] text-[#111111] hover:bg-[#E5E5E0]'
                    }`}
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-4 h-4 object-cover grayscale border border-[#111111]"
                      referrerPolicy="no-referrer"
                    />
                    <span className="truncate">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link RFI */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-[#CC0000]" />
              綁定工程疑義案卷 (RFI LINK)
            </label>
            <select
              value={linkedRfiId}
              onChange={(e) => setLinkedRfiId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
            >
              <option value="">[ 無綁定 RFI ]</option>
              {rfis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rfiNumber} - {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              工種標籤 (TAGS - ENTER 新增)
            </label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="bg-white text-[#111111] px-1.5 py-0.5 border border-[#111111] flex items-center gap-1 font-mono text-[10px]"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((tag) => tag !== t))}
                    className="hover:text-[#CC0000] font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="輸入如: 結構、消防、BIM..."
              className="w-full px-2.5 py-1 border border-[#111111] bg-white text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t-2 border-[#111111]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#111111] bg-white hover:bg-[#E5E5E0] text-xs font-bold uppercase"
            >
              取消
            </button>
            <button
              type="submit"
              id="btn-confirm-create-card"
              className="px-5 py-1.5 bg-[#111111] hover:bg-[#CC0000] text-white border border-[#111111] text-xs font-bold uppercase tracking-wider transition-colors hard-shadow-sm"
            >
              確認發布套件
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
