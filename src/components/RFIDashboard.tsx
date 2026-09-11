import React, { useState } from 'react';
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Download,
  Link2,
  FileText,
  Radio,
  Flame,
} from 'lucide-react';
import { RFI, User, RfiStatus } from '../types';

interface RFIDashboardProps {
  rfis: RFI[];
  users: User[];
  currentUser: User;
  onOpenRfiDetail: (rfi: RFI) => void;
  onOpenCreateRfi: () => void;
}

export const RFIDashboard: React.FC<RFIDashboardProps> = ({
  rfis,
  users,
  currentUser,
  onOpenRfiDetail,
  onOpenCreateRfi,
}) => {
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReviewer, setFilterReviewer] = useState<string>('ALL');
  const [filterScheduleImpactOnly, setFilterScheduleImpactOnly] = useState(false);

  // Metrics calculation
  const totalRfis = rfis.length;
  const pendingAnswerRfis = rfis.filter((r) => r.status === 'pending_answer' || r.status === 'submitted');
  const answeredRfis = rfis.filter((r) => r.status === 'answered');
  const closedRfis = rfis.filter((r) => r.status === 'closed');
  const scheduleImpactRfis = rfis.filter((r) => r.scheduleImpact);
  const totalDelayDays = scheduleImpactRfis.reduce((acc, r) => acc + (r.scheduleDelayDays || 0), 0);
  const costImpactRfis = rfis.filter((r) => r.costImpact);
  const totalCostAmount = costImpactRfis.reduce((acc, r) => acc + (r.costImpactAmount || 0), 0);

  // Status mapping
  const getStatusBadge = (status: RfiStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="bg-transparent text-[#737373] text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#737373]">
            [草稿 DRAFT]
          </span>
        );
      case 'submitted':
        return (
          <span className="bg-[#E5E5E0] text-[#111111] text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            [已提交 SUBMITTED]
          </span>
        );
      case 'pending_answer':
        return (
          <span className="bg-[#111111] text-[#F9F9F7] text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111] flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            [等待答覆 PENDING]
          </span>
        );
      case 'answered':
        return (
          <span className="bg-[#E5E5E0] text-[#111111] text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111] flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            [已答覆 ANSWERED]
          </span>
        );
      case 'closed':
        return (
          <span className="bg-[#111111] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111] flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            [已結案 CLOSED]
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-[#CC0000] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#111111] flex items-center gap-1">
            [已退回 REJECTED]
          </span>
        );
    }
  };

  // Filtered RFIs
  const filteredRfis = rfis.filter((r) => {
    if (activeStatusTab !== 'ALL' && r.status !== activeStatusTab) {
      return false;
    }
    if (filterReviewer !== 'ALL' && r.assignedReviewerId !== filterReviewer) {
      return false;
    }
    if (filterScheduleImpactOnly && !r.scheduleImpact) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.rfiNumber.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchQ = r.question.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchQ) return false;
    }
    return true;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'RFI編號',
      '標題',
      '狀態',
      '提問人員',
      '指派技師',
      '影響工期天數',
      '成本影響金額',
      '到期日',
      '建立時間',
    ];

    const rows = filteredRfis.map((r) => {
      const raiser = users.find((u) => u.id === r.raisedById)?.name || '未指派';
      const reviewer = users.find((u) => u.id === r.assignedReviewerId)?.name || '未指定';
      return [
        r.rfiNumber,
        `"${r.title.replace(/"/g, '""')}"`,
        r.status,
        `"${raiser}"`,
        `"${reviewer}"`,
        r.scheduleImpact ? r.scheduleDelayDays || 0 : 0,
        r.costImpact ? r.costImpactAmount || 0 : 0,
        r.dueDate,
        r.createdAt.split('T')[0],
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RFI_Gazette_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-mono text-[#111111]">
      {/* 1. Section Header Banner */}
      <div className="border-b-4 border-[#111111] pb-3 flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#111111] text-white px-2 py-0.5 text-xs font-bold uppercase tracking-widest">
              SECTION C
            </span>
            <span className="text-xs text-[#525252] uppercase tracking-wider">
              DISPATCHES & FORMAL INQUIRIES
            </span>
          </div>
          <h2 className="font-serif font-black text-2xl sm:text-3xl uppercase tracking-tight mt-1 text-[#111111]">
            工程疑義審查特刊 (RFI GAZETTE)
          </h2>
        </div>

        <div className="text-xs text-[#737373] text-right font-mono">
          <span>CLASSIFICATION: AUDITED ARCHIVE · </span>
          <span className="text-[#111111] font-bold">TOTAL DISPATCHES: {totalRfis}</span>
        </div>
      </div>

      {/* 2. Top Metric Cards (High Contrast Newspaper Print) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-[#F9F9F7] border-2 border-[#111111] p-3.5 hard-shadow-hover">
          <div className="flex items-center justify-between text-[#737373] text-[10px] font-bold uppercase tracking-wider border-b border-[#111111] pb-1">
            <span>TOTAL RFIS</span>
            <FileText className="w-3.5 h-3.5 text-[#111111]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-[#111111]">
              {totalRfis}
            </span>
            <span className="text-xs text-[#737373]">件累積</span>
          </div>
          <div className="mt-1 text-[10px] text-[#525252]">工程疑義正式提報總額</div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#F9F9F7] border-2 border-[#111111] p-3.5 hard-shadow-hover">
          <div className="flex items-center justify-between text-[#111111] text-[10px] font-bold uppercase tracking-wider border-b border-[#111111] pb-1">
            <span>PENDING REVIEW</span>
            <Clock className="w-3.5 h-3.5 text-[#CC0000]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-[#111111]">
              {pendingAnswerRfis.length}
            </span>
            <span className="text-xs text-[#CC0000] font-bold">待答覆</span>
          </div>
          <div className="mt-1 text-[10px] text-[#525252]">監造技師/建築師覆核中</div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#F9F9F7] border-2 border-[#111111] p-3.5 hard-shadow-hover">
          <div className="flex items-center justify-between text-[#737373] text-[10px] font-bold uppercase tracking-wider border-b border-[#111111] pb-1">
            <span>RESOLVED & ANSWERED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-[#111111]">
              {answeredRfis.length}
            </span>
            <span className="text-xs text-[#111111]">件審竣</span>
          </div>
          <div className="mt-1 text-[10px] text-[#525252]">技術方案已明確可施作</div>
        </div>

        {/* Card 4 (Schedule Impact) */}
        <div className="bg-[#F9F9F7] border-2 border-[#CC0000] p-3.5 hard-shadow-hover">
          <div className="flex items-center justify-between text-[#CC0000] text-[10px] font-bold uppercase tracking-wider border-b border-[#CC0000] pb-1">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              SCHEDULE RISK
            </span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-serif font-black text-3xl sm:text-4xl text-[#CC0000]">
              +{totalDelayDays}
            </span>
            <span className="text-xs text-[#CC0000] font-bold">天延宕</span>
          </div>
          <div className="mt-1 text-[10px] text-[#CC0000] font-bold">
            {scheduleImpactRfis.length} 件涉及要徑施工線
          </div>
        </div>

        {/* Card 5 (Cost Impact) */}
        <div className="col-span-2 lg:col-span-1 bg-[#F9F9F7] border-2 border-[#111111] p-3.5 hard-shadow-hover">
          <div className="flex items-center justify-between text-[#737373] text-[10px] font-bold uppercase tracking-wider border-b border-[#111111] pb-1">
            <span>BUDGET VARIANCE</span>
            <DollarSign className="w-3.5 h-3.5 text-[#111111]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-serif font-black text-2xl sm:text-3xl text-[#111111]">
              ${(totalCostAmount / 1000).toLocaleString()}K
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#525252]">
            {costImpactRfis.length} 件估列追加變更
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Action Bar */}
      <div className="bg-[#F9F9F7] border-2 border-[#111111] p-3 sm:p-4 hard-shadow space-y-3">
        {/* Status Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#111111] pb-3">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {[
              { id: 'ALL', label: '全數疑義', count: totalRfis },
              { id: 'pending_answer', label: '等待答覆', count: pendingAnswerRfis.length },
              { id: 'answered', label: '已答覆', count: answeredRfis.length },
              { id: 'closed', label: '已結案', count: closedRfis.length },
              {
                id: 'submitted',
                label: '已提交',
                count: rfis.filter((r) => r.status === 'submitted').length,
              },
              {
                id: 'draft',
                label: '草稿公文',
                count: rfis.filter((r) => r.status === 'draft').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`rfi-tab-${tab.id}`}
                onClick={() => setActiveStatusTab(tab.id)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border border-[#111111] transition-colors ${
                  activeStatusTab === tab.id
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                }`}
              >
                {tab.label} [{tab.count}]
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-rfi-csv"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#111111] hover:text-white border border-[#111111] text-xs font-bold uppercase tracking-wider transition-colors hard-shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              匯出總冊 (CSV)
            </button>
            <button
              type="button"
              id="btn-create-new-rfi"
              onClick={onOpenCreateRfi}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111111] hover:bg-[#CC0000] text-white border border-[#111111] text-xs font-bold uppercase tracking-wider transition-colors hard-shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              提報工程疑義 (NEW RFI)
            </button>
          </div>
        </div>

        {/* Search & Advanced Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 bg-white border border-[#111111] px-2.5 py-1 flex-1 min-w-[220px] max-w-md">
              <Search className="w-3.5 h-3.5 text-[#111111]" />
              <input
                type="text"
                id="input-rfi-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="檢索 RFI 編號 (例: RFI-202609-001) 或關鍵字..."
                className="bg-transparent text-[#111111] placeholder:text-[#A3A3A3] focus:outline-none w-full font-mono text-xs"
              />
            </div>

            {/* Reviewer filter */}
            <div className="flex items-center gap-1 bg-white border border-[#111111] px-2 py-1">
              <span className="text-[10px] text-[#737373] uppercase font-bold">REVIEWER:</span>
              <select
                id="select-rfi-reviewer-filter"
                value={filterReviewer}
                onChange={(e) => setFilterReviewer(e.target.value)}
                className="bg-transparent text-[#111111] font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">全部審查技師</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Impact filter */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[#111111] px-2 py-1 bg-white border border-[#111111] hover:bg-[#E5E5E0]">
              <input
                type="checkbox"
                id="checkbox-schedule-impact"
                checked={filterScheduleImpactOnly}
                onChange={(e) => setFilterScheduleImpactOnly(e.target.checked)}
                className="accent-[#111111]"
              />
              <span className="font-bold text-[11px]">僅顯示工期影響案件</span>
            </label>
          </div>

          <div className="text-[#525252] text-xs">
            查得公報共 <strong className="text-[#111111]">{filteredRfis.length}</strong> 筆
          </div>
        </div>
      </div>

      {/* 4. Newspaper Table List View */}
      <div className="bg-[#F9F9F7] border-2 border-[#111111] hard-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E5E5E0] border-b-2 border-[#111111] text-[#111111] font-bold uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">RFI 編號</th>
                <th className="py-2.5 px-3">疑義主旨與內文摘錄</th>
                <th className="py-2.5 px-3">狀態標籤</th>
                <th className="py-2.5 px-3">發起人</th>
                <th className="py-2.5 px-3">審查技師/顧問</th>
                <th className="py-2.5 px-3 text-center">工期 / 成本衝擊</th>
                <th className="py-2.5 px-3">回覆期限</th>
                <th className="py-2.5 px-3 text-right">看板連動</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]">
              {filteredRfis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#737373] font-mono">
                    [ 查無相符之工程疑義公文案卷 ]
                  </td>
                </tr>
              ) : (
                filteredRfis.map((rfi, idx) => {
                  const raiser = users.find((u) => u.id === rfi.raisedById);
                  const reviewer = users.find((u) => u.id === rfi.assignedReviewerId);
                  const isOverdue =
                    rfi.dueDate &&
                    new Date(rfi.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) &&
                    rfi.status !== 'closed' &&
                    rfi.status !== 'answered';

                  return (
                    <tr
                      key={rfi.id}
                      id={`rfi-row-${rfi.id}`}
                      onClick={() => onOpenRfiDetail(rfi)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        idx % 2 === 0 ? 'bg-[#F9F9F7]' : 'bg-[#F0F0EE]'
                      } hover:bg-[#E5E5E0]`}
                    >
                      {/* RFI Number */}
                      <td className="py-3 px-3 font-mono font-bold text-[#111111] whitespace-nowrap">
                        <span className="border-b border-[#111111] pb-0.5">
                          {rfi.rfiNumber}
                        </span>
                      </td>

                      {/* Title & Question snippet */}
                      <td className="py-3 px-3 max-w-sm sm:max-w-md">
                        <div className="font-serif font-bold text-[#111111] text-xs truncate">
                          {rfi.title}
                        </div>
                        <div className="font-body text-[11px] text-[#525252] truncate mt-0.5">
                          {rfi.question.replace(/[#*`]/g, '')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(rfi.status)}
                      </td>

                      {/* Raised By */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={raiser?.avatarUrl}
                            alt={raiser?.name}
                            className="w-5 h-5 object-cover grayscale border border-[#111111]"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-mono text-[11px] text-[#111111]">
                            {raiser?.name || '工程員'}
                          </span>
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={reviewer?.avatarUrl}
                            alt={reviewer?.name}
                            className="w-5 h-5 object-cover grayscale border border-[#111111]"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-mono text-[11px] text-[#111111]">
                            {reviewer?.name || '未指派'}
                          </span>
                        </div>
                      </td>

                      {/* Impact Analysis */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {rfi.scheduleImpact ? (
                            <span
                              className="bg-[#CC0000] text-white border border-[#111111] px-1 py-0.2 text-[9px] font-mono font-bold"
                              title={`工期延誤估計: ${rfi.scheduleDelayDays || 0} 天`}
                            >
                              +{rfi.scheduleDelayDays || 0}D 延誤
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#737373] font-mono">--</span>
                          )}

                          {rfi.costImpact && (
                            <span
                              className="bg-[#111111] text-white border border-[#111111] px-1 py-0.2 text-[9px] font-mono font-bold"
                              title={`成本影響估計: $${rfi.costImpactAmount || 0}`}
                            >
                              追加變更
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] ${
                            isOverdue
                              ? 'text-white bg-[#CC0000] font-bold px-1 py-0.2 border border-[#111111]'
                              : 'text-[#111111]'
                          }`}
                        >
                          {rfi.dueDate || '無期限'}
                        </span>
                      </td>

                      {/* Linked Card */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {rfi.linkedCardId ? (
                          <span className="inline-flex items-center gap-1 bg-[#111111] text-white text-[10px] font-mono px-1.5 py-0.5 border border-[#111111]">
                            <Link2 className="w-2.5 h-2.5" />
                            已連動
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#737373] font-mono">未連動</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
