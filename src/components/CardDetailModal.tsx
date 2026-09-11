import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Tag,
  Users,
  Paperclip,
  Trash2,
  Send,
  AtSign,
  Link2,
  ExternalLink,
} from 'lucide-react';
import {
  KanbanCard,
  BoardColumn,
  User,
  RFI,
  CardPriority,
  Attachment,
  CardComment,
  ActivityLog,
} from '../types';
import { RichTextEditor } from './RichTextEditor';
import { AttachmentDropzone } from './AttachmentDropzone';

interface CardDetailModalProps {
  card: KanbanCard | null;
  columns: BoardColumn[];
  users: User[];
  rfis: RFI[];
  attachments: Attachment[];
  comments: CardComment[];
  activities: ActivityLog[];
  currentUser: User;
  onClose: () => void;
  onUpdateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
  onDeleteCard: (cardId: string) => void;
  onUploadAttachment: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => void;
  onAddComment: (content: string) => void;
  onOpenRfiDetail: (rfi: RFI) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  columns,
  users,
  rfis,
  attachments,
  comments,
  activities,
  currentUser,
  onClose,
  onUpdateCard,
  onDeleteCard,
  onUploadAttachment,
  onDeleteAttachment,
  onAddComment,
  onOpenRfiDetail,
}) => {
  if (!card) return null;

  // Local state
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState<CardPriority>(card.priority);
  const [cardType, setCardType] = useState<'task' | 'milestone' | 'phase' | 'rfi_action'>(
    card.cardType || 'task'
  );
  const [columnId, setColumnId] = useState(card.columnId);
  const [startDate, setStartDate] = useState(card.startDate || card.createdAt.split('T')[0]);
  const [dueDate, setDueDate] = useState(card.dueDate);
  const [progress, setProgress] = useState<number>(card.progress ?? 0);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(card.assigneeIds || []);
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [linkedRfiId, setLinkedRfiId] = useState<string>(card.linkedRfiId || '');

  // Tabs for right side
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  // Comment input & @Mention popup
  const [commentText, setCommentText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
    setPriority(card.priority);
    setCardType(card.cardType || 'task');
    setColumnId(card.columnId);
    setStartDate(card.startDate || card.createdAt.split('T')[0]);
    setDueDate(card.dueDate);
    setProgress(card.progress ?? 0);
    setAssigneeIds(card.assigneeIds || []);
    setTags(card.tags || []);
    setLinkedRfiId(card.linkedRfiId || '');
  }, [card.id]);

  const handleSaveBasic = () => {
    onUpdateCard(card.id, {
      title,
      description,
      priority,
      cardType,
      columnId,
      startDate,
      dueDate,
      progress,
      assigneeIds,
      tags,
      linkedRfiId: linkedRfiId || undefined,
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const clean = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        const next = [...tags, clean];
        setTags(next);
        onUpdateCard(card.id, { tags: next });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const next = tags.filter((t) => t !== tagToRemove);
    setTags(next);
    onUpdateCard(card.id, { tags: next });
  };

  const toggleAssignee = (userId: string) => {
    const next = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    setAssigneeIds(next);
    onUpdateCard(card.id, { assigneeIds: next });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText('');
    setShowMentionMenu(false);
  };

  const insertMention = (user: User) => {
    setCommentText((prev) => `${prev}@${user.name} `);
    setShowMentionMenu(false);
  };

  const linkedRfi = linkedRfiId ? rfis.find((r) => r.id === linkedRfiId) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono text-[#111111]"
      onClick={onClose}
    >
      <div
        id="card-detail-dialog"
        className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-4xl hard-shadow overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Masthead */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#111111] bg-[#E5E5E0] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-[#111111] text-white px-2 py-0.5 border border-[#111111]">
              TASK-{card.id.slice(-4)}
            </span>
            <span className="text-[#737373]">/</span>
            <select
              id="card-column-select"
              value={columnId}
              onChange={(e) => {
                setColumnId(e.target.value);
                onUpdateCard(card.id, { columnId: e.target.value });
              }}
              className="text-xs font-mono font-bold bg-white border border-[#111111] px-2 py-0.5 text-[#111111] focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-delete-card"
              onClick={() => {
                if (confirm(`確定要作廢並刪除此工事套件「${card.title}」？此操作不可逆。`)) {
                  onDeleteCard(card.id);
                  onClose();
                }
              }}
              className="p-1 border border-[#111111] bg-white hover:bg-[#CC0000] hover:text-white transition-colors"
              title="作廢刪除套件"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-close-card-modal"
              onClick={onClose}
              className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Title, Description, Attachments */}
          <div className="lg:col-span-7 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">
                套件主題 (WORK PACKAGE SUBJECT)
              </label>
              <input
                type="text"
                id="input-card-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveBasic}
                className="w-full font-serif font-black text-lg sm:text-xl text-[#111111] px-3 py-1.5 border-2 border-[#111111] bg-white focus:outline-none"
                placeholder="請輸入套件標題..."
              />
            </div>

            {/* Description with Rich Text & Clipboard paste */}
            <div>
              <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">
                工事指示與圖說規格 (DESCRIPTION &amp; DISPATCH)
              </label>
              <RichTextEditor
                value={description}
                onChange={(val) => {
                  setDescription(val);
                }}
                minHeight="140px"
              />
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  id="btn-save-description"
                  onClick={handleSaveBasic}
                  className="text-xs font-bold text-[#111111] hover:text-[#CC0000] underline font-mono"
                >
                  [ 儲存說明更動 ]
                </button>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="pt-2 border-t-2 border-[#111111]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  工程附件圖冊檔案 ({attachments.length})
                </label>
              </div>
              <AttachmentDropzone
                attachments={attachments}
                users={users}
                onUpload={onUploadAttachment}
                onDelete={onDeleteAttachment}
              />
            </div>
          </div>

          {/* Right Column (5 cols): Metadata, Linked RFI, Comments, Activity */}
          <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l-2 border-[#111111] lg:pl-5">
            {/* Priority & Dates & Gantt Progress */}
            <div className="space-y-2.5 bg-white p-3 border-2 border-[#111111] hard-shadow-sm">
              {/* Type */}
              <div>
                <label className="block text-[10px] font-bold text-[#737373] uppercase mb-0.5">
                  類型 (CLASSIFICATION)
                </label>
                <select
                  id="card-type-select"
                  value={cardType}
                  onChange={(e) => {
                    const ct = e.target.value as any;
                    setCardType(ct);
                    onUpdateCard(card.id, { cardType: ct });
                  }}
                  className="w-full text-xs font-mono font-bold px-2 py-1 bg-[#F9F9F7] border border-[#111111] text-[#111111] focus:outline-none"
                >
                  <option value="task">常規任務 (Task)</option>
                  <option value="milestone">◆ 重大里程碑 (Milestone)</option>
                  <option value="phase">階段工作包 (Phase)</option>
                  <option value="rfi_action">RFI 關聯行動 (RFI Action)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#737373] uppercase mb-0.5">
                  優先等級 (PRIORITY)
                </label>
                <select
                  id="card-priority-select"
                  value={priority}
                  onChange={(e) => {
                    const p = e.target.value as CardPriority;
                    setPriority(p);
                    onUpdateCard(card.id, { priority: p });
                  }}
                  className="w-full text-xs font-mono font-bold px-2 py-1 bg-[#F9F9F7] border border-[#111111] text-[#111111] focus:outline-none"
                >
                  <option value="urgent">緊急 (Urgent)</option>
                  <option value="high">高 (High)</option>
                  <option value="medium">中等 (Medium)</option>
                  <option value="low">低 (Low)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#737373] uppercase mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#111111]" />
                    起算 (START)
                  </label>
                  <input
                    type="date"
                    id="card-start-date-input"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      onUpdateCard(card.id, { startDate: e.target.value });
                    }}
                    className="w-full text-xs px-2 py-1 bg-[#F9F9F7] border border-[#111111] text-[#111111] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#737373] uppercase mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#111111]" />
                    到期 (DUE)
                  </label>
                  <input
                    type="date"
                    id="card-due-date-input"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      onUpdateCard(card.id, { dueDate: e.target.value });
                    }}
                    className="w-full text-xs px-2 py-1 bg-[#F9F9F7] border border-[#111111] text-[#111111] focus:outline-none"
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-[#111111] mb-0.5">
                  <span>甘特進度 (PROGRESS)</span>
                  <span className="font-mono text-[#CC0000]">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProgress(val);
                    onUpdateCard(card.id, { progress: val });
                  }}
                  className="w-full accent-[#111111]"
                />
              </div>

              {/* Linked RFI */}
              <div>
                <label className="block text-[10px] font-bold text-[#111111] uppercase mb-0.5 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-[#CC0000]" />
                  連動工程疑義 (RFI LINK)
                </label>
                <select
                  id="card-linked-rfi-select"
                  value={linkedRfiId}
                  onChange={(e) => {
                    setLinkedRfiId(e.target.value);
                    onUpdateCard(card.id, { linkedRfiId: e.target.value || undefined });
                  }}
                  className="w-full text-xs px-2 py-1 bg-[#F9F9F7] border border-[#111111] text-[#111111] focus:outline-none truncate"
                >
                  <option value="">[ 無連動 RFI ]</option>
                  {rfis.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rfiNumber} - {r.title.slice(0, 24)}
                    </option>
                  ))}
                </select>

                {linkedRfi && (
                  <div className="mt-1.5 p-2 bg-[#F9F9F7] border border-[#111111] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111]">{linkedRfi.rfiNumber}</span>
                      <span className="text-[9px] bg-[#111111] text-white px-1 py-0.2 uppercase font-mono">
                        {linkedRfi.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#525252] line-clamp-1 mt-0.5 font-body">
                      {linkedRfi.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRfiDetail(linkedRfi);
                      }}
                      className="mt-1 text-[10px] text-[#CC0000] hover:underline font-bold flex items-center gap-0.5"
                    >
                      查閱 RFI 卷宗 <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-[10px] font-bold text-[#737373] uppercase mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-[#111111]" />
                責任工程人員 (ASSIGNEES)
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isAssigned = assigneeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      id={`assignee-toggle-${u.id}`}
                      onClick={() => toggleAssignee(u.id)}
                      className={`w-full text-left px-2 py-1 text-xs flex items-center justify-between border transition-colors ${
                        isAssigned
                          ? 'bg-[#111111] border-[#111111] text-[#F9F9F7] font-bold'
                          : 'bg-white border-[#111111] text-[#111111] hover:bg-[#E5E5E0]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-4 h-4 object-cover grayscale border border-[#111111]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="truncate">{u.name}</span>
                      </div>
                      <span className="text-[9px] uppercase font-mono">
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[10px] font-bold text-[#737373] uppercase mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#111111]" />
                標籤標註 (TAGS)
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-white text-[#111111] text-[10px] px-1.5 py-0.5 border border-[#111111]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[#CC0000] font-bold"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="input-card-tag"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="輸入標籤如: 結構、消防、BIM..."
                className="w-full text-xs px-2 py-1 border border-[#111111] bg-white focus:outline-none"
              />
            </div>

            {/* Comments & Activity Log Tabs */}
            <div className="pt-2 border-t-2 border-[#111111]">
              <div className="flex items-center gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border border-[#111111] transition-colors ${
                    activeTab === 'comments'
                      ? 'bg-[#111111] text-[#F9F9F7]'
                      : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                  }`}
                >
                  電報討論 [{comments.length}]
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border border-[#111111] transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-[#111111] text-[#F9F9F7]'
                      : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                  }`}
                >
                  歷程日誌 [{activities.length}]
                </button>
              </div>

              {activeTab === 'comments' && (
                <div className="space-y-2">
                  {/* Comment List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-[#737373] italic py-2 font-mono">
                        [ 尚無公報留言紀錄 ]
                      </p>
                    ) : (
                      comments.map((cmt) => {
                        const author = users.find((u) => u.id === cmt.authorId);
                        return (
                          <div
                            key={cmt.id}
                            className="p-2 bg-white border border-[#111111] text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                                <img
                                  src={author?.avatarUrl}
                                  alt={author?.name}
                                  className="w-4 h-4 object-cover grayscale border border-[#111111]"
                                  referrerPolicy="no-referrer"
                                />
                                <span>{author?.name || '團隊成員'}</span>
                              </div>
                              <span className="text-[9px] text-[#737373] font-mono">
                                {new Date(cmt.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="font-body text-[#111111] text-xs whitespace-pre-wrap leading-relaxed">
                              {cmt.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Comment Input with @mention */}
                  <form onSubmit={handleCommentSubmit} className="relative">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          id="input-card-comment"
                          value={commentText}
                          onChange={(e) => {
                            setCommentText(e.target.value);
                            if (e.target.value.endsWith('@')) {
                              setShowMentionMenu(true);
                            }
                          }}
                          placeholder="輸入電報，支援 @ 提及成員..."
                          className="w-full px-2.5 py-1 text-xs bg-white border border-[#111111] pr-7 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMentionMenu(!showMentionMenu)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#111111] hover:text-[#CC0000]"
                          title="提及成員"
                        >
                          <AtSign className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        id="btn-submit-comment"
                        className="p-1.5 bg-[#111111] hover:bg-[#CC0000] text-white border border-[#111111] transition-colors"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>

                    {/* @Mention Dropdown */}
                    {showMentionMenu && (
                      <div className="absolute left-0 bottom-full mb-1 w-56 bg-white border-2 border-[#111111] hard-shadow p-1 z-30 font-mono">
                        <div className="px-2 py-1 text-[9px] font-bold text-[#737373] uppercase border-b border-[#111111]">
                          提及成員 (@MENTION)
                        </div>
                        <div className="space-y-0.5 max-h-32 overflow-y-auto">
                          {users.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => insertMention(u)}
                              className="w-full text-left px-2 py-1 hover:bg-[#E5E5E0] text-xs flex items-center gap-2"
                            >
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-4 h-4 object-cover grayscale border border-[#111111]"
                                referrerPolicy="no-referrer"
                              />
                              <span className="truncate text-xs font-bold text-[#111111]">
                                {u.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {activities.length === 0 ? (
                    <p className="text-xs text-[#737373] italic py-2">
                      [ 目前無任何更動歷程 ]
                    </p>
                  ) : (
                    activities.map((act) => {
                      const actor = users.find((u) => u.id === act.userId);
                      return (
                        <div key={act.id} className="text-xs p-1.5 bg-white border border-[#111111]">
                          <div className="flex items-center justify-between text-[#737373] text-[9px]">
                            <span className="font-bold text-[#111111]">
                              {actor?.name || '系統'}
                            </span>
                            <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[#111111] text-[11px] mt-0.5 font-body">
                            {act.details}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
