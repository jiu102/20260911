import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Paperclip,
  Mail,
  ArrowRight,
  ShieldCheck,
  Check,
  Send,
  Kanban,
  Edit3,
} from 'lucide-react';
import { RFI, User, KanbanCard, Attachment, ActivityLog, RfiStatus } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { AttachmentDropzone } from './AttachmentDropzone';

interface RFIDetailModalProps {
  rfi: RFI | null;
  users: User[];
  cards: KanbanCard[];
  attachments: Attachment[];
  activities: ActivityLog[];
  currentUser: User;
  onClose: () => void;
  onUpdateRfi: (rfiId: string, updates: Partial<RFI>) => void;
  onRespondRfi: (
    rfiId: string,
    responseText: string,
    decision: 'approved' | 'rejected' | 'clarification'
  ) => void;
  onCloseRfi: (rfiId: string) => void;
  onConvertRfiToCard: (rfiId: string) => void;
  onUploadAttachment: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => void;
  onOpenCardDetail: (card: KanbanCard) => void;
  onSimulateEmail: (toEmail: string, subject: string, snippet: string) => void;
}

export const RFIDetailModal: React.FC<RFIDetailModalProps> = ({
  rfi,
  users,
  cards,
  attachments,
  activities,
  currentUser,
  onClose,
  onUpdateRfi,
  onRespondRfi,
  onCloseRfi,
  onConvertRfiToCard,
  onUploadAttachment,
  onDeleteAttachment,
  onOpenCardDetail,
  onSimulateEmail,
}) => {
  if (!rfi) return null;

  // Form states for official response
  const [responseText, setResponseText] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'clarification'>('approved');
  const [emailSentAlert, setEmailSentAlert] = useState(false);

  // Edit question state
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(rfi.question);

  // Status transitions
  const canRespond =
    currentUser.role === 'client_reviewer' ||
    currentUser.role === 'pm' ||
    currentUser.role === 'admin' ||
    currentUser.id === rfi.assignedReviewerId;

  const canClose = currentUser.role === 'pm' || currentUser.role === 'admin';

  const raiser = users.find((u) => u.id === rfi.raisedById);
  const reviewer = users.find((u) => u.id === rfi.assignedReviewerId);
  const linkedCard = rfi.linkedCardId ? cards.find((c) => c.id === rfi.linkedCardId) : null;

  const handleOfficialRespondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    onRespondRfi(rfi.id, responseText.trim(), decision);
    setResponseText('');
  };

  const handleSendEmailNotification = () => {
    if (reviewer) {
      onSimulateEmail(
        reviewer.email,
        `【重要工程疑義審核通知】${rfi.rfiNumber} - ${rfi.title}`,
        rfi.question.slice(0, 80)
      );
      setEmailSentAlert(true);
      setTimeout(() => setEmailSentAlert(false), 3000);
    }
  };

  const getStatusBadge = (status: RfiStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="border border-[#111111] bg-white text-[#111111] text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
            草稿 (DRAFT)
          </span>
        );
      case 'submitted':
        return (
          <span className="border border-[#111111] bg-[#111111] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
            已呈報 (SUBMITTED)
          </span>
        );
      case 'pending_answer':
        return (
          <span className="border border-[#111111] bg-[#CC0000] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-white" /> 審核催辦中
          </span>
        );
      case 'answered':
        return (
          <span className="border border-[#111111] bg-[#111111] text-[#F9F9F7] text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-white" /> 已覆核答覆
          </span>
        );
      case 'closed':
        return (
          <span className="border border-[#111111] bg-white text-[#111111] text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#111111]" /> 已結案 (CLOSED)
          </span>
        );
      case 'rejected':
        return (
          <span className="border border-[#CC0000] bg-[#CC0000] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3 text-white" /> 已退回修正
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono text-[#111111]"
      onClick={onClose}
    >
      <div
        id="rfi-detail-dialog"
        className="bg-[#F9F9F7] border-4 border-[#111111] w-full max-w-4xl hard-shadow overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Masthead */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#111111] bg-[#E5E5E0] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-mono text-xs font-bold text-white bg-[#111111] px-2 py-0.5 border border-[#111111]">
              {rfi.rfiNumber}
            </span>
            {getStatusBadge(rfi.status)}
            <span className="text-[10px] text-[#737373] font-mono hidden sm:inline">
              立案日期：{new Date(rfi.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-simulate-email-alert"
              onClick={handleSendEmailNotification}
              className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
              title="發送電子郵件通知審查技師"
            >
              <Mail className="w-3.5 h-3.5 text-[#CC0000]" />
              <span className="hidden sm:inline">郵件催辦</span>
            </button>
            <button
              type="button"
              id="btn-close-rfi-modal"
              onClick={onClose}
              className="p-1 border border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {emailSentAlert && (
          <div className="bg-[#111111] text-white text-xs px-5 py-2 flex items-center justify-between font-mono border-b border-[#111111]">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#CC0000]" />
              <span>已向指定技師 ({reviewer?.email}) 寄發正式催審公文電報。</span>
            </div>
            <span className="text-[10px] bg-[#CC0000] px-1.5 py-0.2 font-bold uppercase">
              DISPATCHED
            </span>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title & Impact Summary Bar */}
          <div>
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-0.5">
              工程疑義項目案名 (RFI INQUIRY SUBJECT)
            </span>
            <h2 className="font-serif font-black text-lg sm:text-xl text-[#111111] leading-snug">
              {rfi.title}
            </h2>

            {/* Impact Analysis Banner */}
            <div className="mt-3 p-3 bg-white border-2 border-[#111111] hard-shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 border-b sm:border-b-0 sm:border-r border-[#111111] pb-2 sm:pb-0 pr-2">
                <div className={`p-1.5 border border-[#111111] ${rfi.scheduleImpact ? 'bg-[#CC0000] text-white' : 'bg-[#E5E5E0] text-[#111111]'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#737373] uppercase">工期延遲評估</div>
                  <div className="font-mono font-bold mt-0.5 text-xs">
                    {rfi.scheduleImpact ? (
                      <span className="text-[#CC0000] font-black">關鍵路徑 +{rfi.scheduleDelayDays || 0} 天</span>
                    ) : (
                      <span className="text-[#737373]">無延遲風險</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b sm:border-b-0 sm:border-r border-[#111111] pb-2 sm:pb-0 pr-2">
                <div className={`p-1.5 border border-[#111111] ${rfi.costImpact ? 'bg-[#111111] text-white' : 'bg-[#E5E5E0] text-[#111111]'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#737373] uppercase">變更追加評估</div>
                  <div className="font-mono font-bold mt-0.5 text-xs">
                    {rfi.costImpact ? (
                      <span className="text-[#111111] font-black">NT$ {(rfi.costImpactAmount || 0).toLocaleString()}</span>
                    ) : (
                      <span className="text-[#737373]">不衍生追加款</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 border border-[#111111] bg-[#E5E5E0] text-[#111111]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#737373] uppercase">覆核法定到期</div>
                  <div className="font-mono font-bold mt-0.5 text-xs text-[#111111]">
                    {rfi.dueDate || '未指定'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Description Block */}
          <div className="border-2 border-[#111111] p-4 bg-white hard-shadow-sm">
            <div className="flex items-center justify-between mb-2.5 border-b-2 border-[#111111] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xs text-[#111111] uppercase tracking-wider">
                  現場問題詳情與技術疑義 (TECHNICAL INQUIRY)
                </span>
                <span className="text-[10px] text-[#737373] font-mono">
                  [ 提送：{raiser?.name} ({raiser?.title}) ]
                </span>
              </div>

              {!isEditingQuestion && (
                <button
                  type="button"
                  id="btn-edit-rfi-question"
                  onClick={() => {
                    setEditedQuestion(rfi.question);
                    setIsEditingQuestion(true);
                  }}
                  className="text-xs text-[#111111] hover:text-[#CC0000] underline font-bold flex items-center gap-1 font-mono"
                >
                  <Edit3 className="w-3 h-3" /> 修改提報
                </button>
              )}
            </div>

            {isEditingQuestion ? (
              <div className="space-y-2">
                <RichTextEditor
                  value={editedQuestion}
                  onChange={setEditedQuestion}
                  minHeight="130px"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingQuestion(false)}
                    className="px-3 py-1 text-xs border border-[#111111] bg-white hover:bg-[#E5E5E0] font-bold"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateRfi(rfi.id, { question: editedQuestion });
                      setIsEditingQuestion(false);
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-[#111111] hover:bg-[#CC0000] border border-[#111111]"
                  >
                    儲存變更
                  </button>
                </div>
              </div>
            ) : (
              <div className="font-body text-xs text-[#111111] whitespace-pre-wrap leading-relaxed">
                {/* Parse screenshot images if any */}
                {rfi.question.split('\n').map((line, idx) => {
                  const imgMatch = line.match(/^!\[(.*?)\]\((.+)\)$/);
                  if (imgMatch) {
                    return (
                      <div key={idx} className="my-2 border-2 border-[#111111] bg-[#F9F9F7] p-1.5 hard-shadow-sm">
                        <img
                          src={imgMatch[2]}
                          alt={imgMatch[1]}
                          className="max-h-72 w-auto border border-[#111111] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    );
                  }
                  return <p key={idx}>{line}</p>;
                })}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="border-2 border-[#111111] p-4 bg-white hard-shadow-sm">
            <h3 className="font-serif font-bold text-xs text-[#111111] uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#111111] pb-1">
              <Paperclip className="w-3.5 h-3.5" />
              相關工程圖面、規範與現場照片檔案 ({attachments.length})
            </h3>
            <AttachmentDropzone
              attachments={attachments}
              users={users}
              onUpload={onUploadAttachment}
              onDelete={onDeleteAttachment}
            />
          </div>

          {/* Official Response Block */}
          <div className="border-2 border-[#111111] p-4 bg-[#F9F9F7] hard-shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b-2 border-[#111111] pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#CC0000]" />
                <h3 className="font-serif font-black text-xs text-[#111111] uppercase tracking-wider">
                  審查技師正式覆核報告 (OFFICIAL TECHNICAL RESPONSE)
                </h3>
              </div>
              <div className="text-xs font-mono text-[#737373]">
                審查代表：<span className="font-bold text-[#111111]">{reviewer?.name} ({reviewer?.title})</span>
              </div>
            </div>

            {/* Display official response if already answered */}
            {rfi.officialResponse ? (
              <div className="bg-white border-2 border-[#111111] p-4 hard-shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#111111] pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 border border-[#111111] uppercase ${
                        rfi.officialResponse.decision === 'approved'
                          ? 'bg-[#111111] text-white'
                          : rfi.officialResponse.decision === 'rejected'
                          ? 'bg-[#CC0000] text-white'
                          : 'bg-[#E5E5E0] text-[#111111]'
                      }`}
                    >
                      {rfi.officialResponse.decision === 'approved' && '審核結論：核准同意施作 (APPROVED)'}
                      {rfi.officialResponse.decision === 'rejected' && '審核結論：退回修正 (REJECTED)'}
                      {rfi.officialResponse.decision === 'clarification' && '審核結論：要求補充澄清 (CLARIFICATION)'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#737373] font-mono">
                    簽署時間：{new Date(rfi.officialResponse.respondedAt).toLocaleString()}
                  </div>
                </div>

                <div className="font-body text-xs text-[#111111] whitespace-pre-wrap leading-relaxed bg-[#F9F9F7] p-3 border border-[#111111]">
                  {rfi.officialResponse.responseText}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-[#737373] font-mono">
                  <div>
                    法定覆核章：<span className="font-bold text-[#111111]">{users.find((u) => u.id === rfi.officialResponse?.responderId)?.name || reviewer?.name}</span>
                  </div>
                  <div className="text-[10px] text-[#CC0000] font-bold uppercase">
                    [ OFFICIAL DISPATCH SEAL ]
                  </div>
                </div>
              </div>
            ) : (
              // Response submission form (Reviewer / PM)
              <div>
                {canRespond ? (
                  <form onSubmit={handleOfficialRespondSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#111111] uppercase mb-1">
                        審查技師決策審定
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'approved', label: '核准同意施作 (APPROVED)' },
                          { id: 'clarification', label: '需澄清補充 (CLARIFICATION)' },
                          { id: 'rejected', label: '退回重議 (REJECTED)' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDecision(item.id as any)}
                            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 transition-colors ${
                              decision === item.id
                                ? 'bg-[#111111] text-white border-[#111111] hard-shadow-sm'
                                : 'bg-white text-[#111111] border-[#111111] hover:bg-[#E5E5E0]'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#111111] uppercase mb-1">
                        正式答覆指示內文 (載明技術計算基準、補強圖說號或指定工法)
                      </label>
                      <RichTextEditor
                        value={responseText}
                        onChange={setResponseText}
                        placeholder="請輸入正式解答指示與依據..."
                        minHeight="120px"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="submit"
                        id="btn-submit-official-response"
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#111111] hover:bg-[#CC0000] text-white text-xs font-bold uppercase tracking-wider border border-[#111111] hard-shadow-sm transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        簽發正式答覆公文
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-3 bg-white border border-[#111111] text-xs text-[#111111] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#CC0000] shrink-0" />
                    <span>此 RFI 案卷正在等待指定審查技師 ({reviewer?.name || '指定人員'}) 提交正式覆核答覆。</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Conversions & Closing */}
          <div className="p-4 bg-white border-2 border-[#111111] hard-shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-serif font-black text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                <Kanban className="w-3.5 h-3.5 text-[#111111]" />
                看板任務連動與落實執行 (WORK PACKAGE DISPATCH)
              </h4>
              <p className="text-[11px] text-[#737373] mt-0.5 font-mono">
                {linkedCard ? (
                  <>
                    已連動之看板工作套件：
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCardDetail(linkedCard);
                      }}
                      className="underline font-bold text-[#111111] hover:text-[#CC0000] ml-1"
                    >
                      {linkedCard.title}
                    </button>
                  </>
                ) : (
                  '尚未轉換為看板卡片。當 RFI 答覆完成後，可一鍵轉化為現場任務進行排程落實。'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!linkedCard && (
                <button
                  type="button"
                  id="btn-convert-rfi-to-card"
                  onClick={() => onConvertRfiToCard(rfi.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#111111] hover:text-white text-[#111111] border-2 border-[#111111] text-xs font-bold uppercase transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  轉化為看板卡片
                </button>
              )}

              {canClose && rfi.status !== 'closed' && (
                <button
                  type="button"
                  id="btn-close-rfi"
                  onClick={() => onCloseRfi(rfi.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111111] hover:bg-[#CC0000] text-white border-2 border-[#111111] text-xs font-bold uppercase tracking-wider hard-shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  確認結案 (CLOSE RFI)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
