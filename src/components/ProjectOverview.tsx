import React from 'react';
import {
  Activity,
  Shield,
  Database,
  FileText,
  Radio,
} from 'lucide-react';
import { Project, BoardColumn, KanbanCard, RFI, User, ActivityLog } from '../types';

interface ProjectOverviewProps {
  project: Project;
  columns: BoardColumn[];
  cards: KanbanCard[];
  rfis: RFI[];
  users: User[];
  activities: ActivityLog[];
  onOpenCardDetail: (card: KanbanCard) => void;
  onOpenRfiDetail: (rfi: RFI) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  columns,
  cards,
  rfis,
  users,
  activities,
  onOpenCardDetail,
  onOpenRfiDetail,
}) => {
  const doneCards = cards.filter((c) => c.columnId === 'col-done').length;
  const cardCompletionRate = cards.length > 0 ? Math.round((doneCards / cards.length) * 100) : 0;

  const closedRfis = rfis.filter((r) => r.status === 'closed').length;
  const answeredRfis = rfis.filter((r) => r.status === 'answered').length;
  const rfiResolutionRate = rfis.length > 0 ? Math.round(((closedRfis + answeredRfis) / rfis.length) * 100) : 0;

  const totalDelayDays = rfis
    .filter((r) => r.scheduleImpact)
    .reduce((acc, r) => acc + (r.scheduleDelayDays || 0), 0);

  const totalCostImpact = rfis
    .filter((r) => r.costImpact)
    .reduce((acc, r) => acc + (r.costImpactAmount || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-mono text-[#111111]">
      {/* 1. Project Header Masthead Banner */}
      <div className="bg-[#F9F9F7] border-4 border-[#111111] p-6 hard-shadow">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-white bg-[#111111] px-2 py-0.5 border border-[#111111]">
                PROJECT DOSSIER · {project.code}
              </span>
              <span className="text-xs text-[#737373] uppercase font-bold">
                ESTABLISHED: {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-4xl text-[#111111] uppercase tracking-tight">
              {project.name}
            </h1>
            <p className="font-body text-xs sm:text-sm text-[#525252] mt-2 max-w-3xl leading-relaxed border-l-2 border-[#111111] pl-3 italic">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l-2 border-[#111111] pt-4 sm:pt-0 sm:pl-6">
            <div className="text-right">
              <div className="text-[10px] text-[#737373] font-bold uppercase tracking-wider">
                看板驗收進度
              </div>
              <div className="font-serif font-black text-3xl sm:text-4xl text-[#111111]">
                {cardCompletionRate}%
              </div>
              <div className="text-[10px] text-[#525252]">
                已完成 {doneCards} / {cards.length} 套件
              </div>
            </div>

            <div className="h-12 w-0.5 bg-[#111111]" />

            <div className="text-right">
              <div className="text-[10px] text-[#737373] font-bold uppercase tracking-wider">
                RFI 結案率
              </div>
              <div className="font-serif font-black text-3xl sm:text-4xl text-[#111111]">
                {rfiResolutionRate}%
              </div>
              <div className="text-[10px] text-[#525252]">
                結案 {closedRfis + answeredRfis} / {rfis.length} 案
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Architecture & RBAC Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {/* RBAC Roles Matrix */}
          <div className="bg-[#F9F9F7] border-2 border-[#111111] p-4 sm:p-5 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2 mb-3">
              <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#111111]" />
                身分驗證與角色權限矩陣 (RBAC ACCESS MATRIX)
              </h3>
              <span className="text-[10px] text-[#737373] font-bold uppercase">
                SEC.3.1 SPECIFICATION
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-[#E5E5E0] border-b-2 border-[#111111] text-[#111111] font-bold uppercase">
                    <th className="py-2 px-3">角色位階</th>
                    <th className="py-2 px-3">工事職責與系統權限限度</th>
                    <th className="py-2 px-3">模擬成員</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#CC0000] bg-white border-r border-[#111111]">
                      Admin (系統總管)
                    </td>
                    <td className="py-2.5 px-3 text-[#525252] font-body text-xs">
                      管理人員帳號、專案權限、所有看板與 RFI 最高異動與配置權限
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#111111] font-bold">
                      David Wang
                    </td>
                  </tr>
                  <tr className="bg-[#F0F0EE]">
                    <td className="py-2.5 px-3 font-bold text-[#111111] bg-white border-r border-[#111111]">
                      PM (專案經理)
                    </td>
                    <td className="py-2.5 px-3 text-[#525252] font-body text-xs">
                      創建專案、調整看板專欄、指派責任工程師、正式結案 RFI 並轉化為卡片
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#111111] font-bold">
                      Sarah Lin
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#111111] bg-white border-r border-[#111111]">
                      Reviewer (審查技師)
                    </td>
                    <td className="py-2.5 px-3 text-[#525252] font-body text-xs">
                      審閱工程 RFI 疑難、填寫正式技術答覆 (Official Response)、核簽同意
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#111111] font-bold">
                      Kevin Chen
                    </td>
                  </tr>
                  <tr className="bg-[#F0F0EE]">
                    <td className="py-2.5 px-3 font-bold text-[#111111] bg-white border-r border-[#111111]">
                      Member (工事組員)
                    </td>
                    <td className="py-2.5 px-3 text-[#525252] font-body text-xs">
                      創建/編輯任務、提報 RFI、剪貼簿貼圖上傳圖說、留言 @提及成員
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#111111]">
                      Alex Huang, Emily Tseng
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Decoupled Architecture & Schema Reference */}
          <div className="bg-[#F9F9F7] border-2 border-[#111111] p-4 sm:p-5 hard-shadow">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2 mb-3">
              <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#111111]" />
                系統架構與實體關聯 (DECOUPLED ARCHITECTURE & ERD)
              </h3>
              <span className="text-[10px] text-[#737373] font-bold uppercase">
                SEC.4 & 5 SPEC
              </span>
            </div>

            <div className="bg-[#111111] text-[#F9F9F7] p-3.5 font-mono text-xs overflow-x-auto leading-relaxed border border-[#111111]">
              <div className="text-[#CC0000] font-bold mb-1">// RESTful API 端點規範 (Section 4)</div>
              <div>GET   /api/v1/projects/:id/boards      - 取得看板與欄位結構</div>
              <div>POST  /api/v1/cards                    - 新增任務卡片</div>
              <div>PATCH /api/v1/cards/:id/move           - 移動卡片 (Optimistic Update)</div>
              <div>GET   /api/v1/projects/:id/rfis        - 取得工程疑義列表 (衝擊篩選)</div>
              <div>POST  /api/v1/rfis/:id/respond         - 提交技師正式技術答覆</div>
              <div>POST  /api/v1/uploads/image            - 剪貼簿截圖直接貼上轉 URL</div>
              <div className="text-[#E5E5E0] font-bold mt-3 mb-1 border-t border-[#333333] pt-2">
                // 資料庫 Entity 關聯結構 (Section 5)
              </div>
              <div>[Projects] 1 --- N [Boards] 1 --- N [Columns] 1 --- N [Cards]</div>
              <div>[Projects] 1 --- N [RFIs] 1 --- N [Official_Responses]</div>
              <div>[Cards] (1) &lt;--- 雙向關聯 (Optional Link) ---&gt; (1) [RFIs]</div>
              <div>[Attachments] &amp; [Comments] (支援 @Mention 提及與 50MB 附件)</div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Activity Log & Audit Trail */}
        <div className="lg:col-span-5 bg-[#F9F9F7] border-2 border-[#111111] p-4 sm:p-5 hard-shadow flex flex-col">
          <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2 mb-3">
            <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#111111]" />
              電報日誌歷程 (TELEGRAPHIC AUDIT WIRE)
            </h3>
            <span className="text-xs text-[#111111] font-bold">[{activities.length} 條紀錄]</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-[#737373] italic py-6 text-center">
                [ 尚無電報活動紀錄 ]
              </p>
            ) : (
              activities.map((act) => {
                const user = users.find((u) => u.id === act.userId);
                return (
                  <div
                    key={act.id}
                    className="p-2.5 bg-white border border-[#111111] text-xs transition-colors hover:bg-[#E5E5E0]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 font-bold text-[#111111]">
                        <img
                          src={user?.avatarUrl}
                          alt={user?.name}
                          className="w-4 h-4 object-cover grayscale border border-[#111111]"
                          referrerPolicy="no-referrer"
                        />
                        <span>{user?.name || '系統公報'}</span>
                        <span className="text-[9px] bg-[#111111] text-white px-1 py-0.2 uppercase">
                          {act.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#737373] font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="font-body text-[#525252] text-[11px] leading-relaxed mt-1">
                      {act.details}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
