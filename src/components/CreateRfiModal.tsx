import React, { useState } from 'react';
import {
  X,
  FileQuestion,
  AlertTriangle,
  Calendar,
  UserCheck,
  Link2,
} from 'lucide-react';
import { User, KanbanCard, RfiStatus } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface CreateRfiModalProps {
  rfiNumberPreview: string;
  users: User[];
  cards: KanbanCard[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    question: string;
    assignedReviewerId: string;
    scheduleImpact: boolean;
    scheduleDelayDays?: number;
    costImpact: boolean;
    costImpactAmount?: number;
    dueDate: string;
    status: RfiStatus;
    linkedCardId?: string;
  }) => void;
}

export const CreateRfiModal: React.FC<CreateRfiModalProps> = ({
  rfiNumberPreview,
  users,
  cards,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const defaultReviewer = users.find((u) => u.role === 'client_reviewer') || users[1];
  const [assignedReviewerId, setAssignedReviewerId] = useState(defaultReviewer?.id || users[0]?.id);
  const [scheduleImpact, setScheduleImpact] = useState(false);
  const [scheduleDelayDays, setScheduleDelayDays] = useState<number>(3);
  const [costImpact, setCostImpact] = useState(false);
  const [costImpactAmount, setCostImpactAmount] = useState<number>(50000);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<RfiStatus>('submitted');
  const [linkedCardId, setLinkedCardId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) return;

    onSubmit({
      title: title.trim(),
      question: question.trim(),
      assignedReviewerId,
      scheduleImpact,
      scheduleDelayDays: scheduleImpact ? Number(scheduleDelayDays) : undefined,
      costImpact,
      costImpactAmount: costImpact ? Number(costImpactAmount) : undefined,
      dueDate,
      status,
      linkedCardId: linkedCardId || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono text-[#111111]"
      onClick={onClose}
    >
      <div
        id="create-rfi-dialog"
        className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-2xl hard-shadow overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#111111] bg-[#E5E5E0] shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#CC0000] text-white text-[10px] font-bold px-1.5 py-0.5 uppercase">
              RFI DISPATCH
            </span>
            <div>
              <h3 className="font-serif font-black text-[#111111] text-sm sm:text-base uppercase tracking-wider">
                提報專案資訊疑義需求書 (OFFICIAL RFI FILING)
              </h3>
              <p className="text-[10px] text-[#737373] font-mono">
                公文字號預編：<span className="font-bold text-[#111111]">{rfiNumberPreview}</span>
              </p>
            </div>
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
          {/* Title */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              疑義主旨 (SUBJECT / ISSUE TITLE) *
            </label>
            <input
              type="text"
              id="input-rfi-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：地下室冰水幹管穿大梁鋼筋淨距不足釋疑"
              className="w-full font-serif font-bold text-sm px-2.5 py-1.5 border border-[#111111] bg-white focus:outline-none placeholder:text-[#A3A3A3]"
              required
              autoFocus
            />
          </div>

          {/* Question with rich text and clipboard screenshot paste */}
          <div>
            <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
              現場疑義詳述與技術提問 (支援 CTRL+V 貼上剪貼簿現場照) *
            </label>
            <RichTextEditor
              value={question}
              onChange={setQuestion}
              placeholder="請詳細敘述工程圖面衝突、規範疑點或現場施工干涉..."
              minHeight="120px"
            />
          </div>

          {/* Reviewer & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#111111]" />
                指定覆核技師 (ASSIGNED REVIEWER) *
              </label>
              <select
                value={assignedReviewerId}
                onChange={(e) => setAssignedReviewerId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} - {u.title} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#111111]" />
                法定覆核期限 (REPLY DEADLINE)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Impact Analysis */}
          <div className="p-3 bg-white border-2 border-[#111111] hard-shadow-sm space-y-2">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#111111] pb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#CC0000]" />
              工程風險與工期/成本衝擊審查 (IMPACT AUDIT)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Schedule Impact */}
              <div className="p-2 bg-[#F9F9F7] border border-[#111111] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#111111]">是否影響工期路徑？</span>
                  <input
                    type="checkbox"
                    id="input-schedule-impact"
                    checked={scheduleImpact}
                    onChange={(e) => setScheduleImpact(e.target.checked)}
                    className="w-4 h-4 accent-[#111111]"
                  />
                </div>
                {scheduleImpact && (
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-[#CC0000] mb-0.5">
                      預估關鍵路徑延誤天數 (DAYS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={scheduleDelayDays}
                      onChange={(e) => setScheduleDelayDays(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-[#CC0000] bg-white font-mono font-bold text-xs text-[#CC0000] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Cost Impact */}
              <div className="p-2 bg-[#F9F9F7] border border-[#111111] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-[#111111]">是否衍生追加款項？</span>
                  <input
                    type="checkbox"
                    id="input-cost-impact"
                    checked={costImpact}
                    onChange={(e) => setCostImpact(e.target.checked)}
                    className="w-4 h-4 accent-[#111111]"
                  />
                </div>
                {costImpact && (
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-[#111111] mb-0.5">
                      預估追加工程款 (NT$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={costImpactAmount}
                      onChange={(e) => setCostImpactAmount(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-[#111111] bg-white font-mono font-bold text-xs text-[#111111] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Initial Status & Link Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1">
                分派狀態 (INITIAL STATUS)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RfiStatus)}
                className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none"
              >
                <option value="submitted">已呈交審核 (Submitted)</option>
                <option value="pending_answer">答覆催辦中 (Pending Answer)</option>
                <option value="draft">保留為工程草稿 (Draft)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#111111] uppercase text-[10px] mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-[#111111]" />
                連結工作套件 (WORK PACKAGE LINK)
              </label>
              <select
                value={linkedCardId}
                onChange={(e) => setLinkedCardId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#111111] bg-white font-mono text-xs focus:outline-none truncate"
              >
                <option value="">[ 無連動套件 ]</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
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
              id="btn-confirm-create-rfi"
              className="px-5 py-1.5 bg-[#111111] hover:bg-[#CC0000] text-white border border-[#111111] text-xs font-bold uppercase tracking-wider transition-colors hard-shadow-sm"
            >
              簽發呈送 RFI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
