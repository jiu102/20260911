import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  FileQuestion,
  Bell,
  Plus,
  ChevronDown,
  RotateCcw,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  FolderKanban,
  UserCheck,
  BarChart3,
  Layers,
  Search,
  Flame,
  Radio,
} from 'lucide-react';
import { User, Project, NotificationItem, UserRole } from '../types';

interface NavbarProps {
  currentView: 'kanban' | 'gantt' | 'rfi' | 'overview';
  onViewChange: (view: 'kanban' | 'gantt' | 'rfi' | 'overview') => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  projects: Project[];
  activeProject: Project;
  onSelectProject: (projectId: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenCreateCard: () => void;
  onOpenCreateRfi: () => void;
  onResetDemoData: () => void;
  onNavigateToEntity?: (type: 'card' | 'rfi', id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  currentUser,
  allUsers,
  onSwitchUser,
  projects,
  activeProject,
  onSelectProject,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenCreateCard,
  onOpenCreateRfi,
  onResetDemoData,
  onNavigateToEntity,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const projRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (projRef.current && !projRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-[#CC0000] text-white text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            SYS.ADMIN
          </span>
        );
      case 'pm':
        return (
          <span className="bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            PROJ.DIRECTOR
          </span>
        );
      case 'client_reviewer':
        return (
          <span className="bg-transparent text-[#111111] text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            REVIEWER
          </span>
        );
      case 'member':
        return (
          <span className="bg-[#E5E5E0] text-[#111111] text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-[#111111]">
            ENGINEER
          </span>
        );
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="bg-[#F9F9F7] text-[#111111] border-b-4 border-[#111111] sticky top-0 z-40 sharp-corners">
      {/* 1. Top Newspaper Dateline Bar */}
      <div className="border-b border-[#111111] bg-[#F9F9F7] px-4 py-1 flex items-center justify-between text-[11px] font-mono text-[#525252]">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#111111] tracking-wider uppercase">
            VOL. XXVII · NO. 142
          </span>
          <span className="hidden md:inline text-[#E5E5E0]">|</span>
          <span className="hidden md:inline tracking-wider uppercase">
            TAIPEI METROPOLITAN ENGINEERING DISTRICT
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[#111111] font-serif italic text-xs tracking-wide">
          <span>✦</span>
          <span>"All the Project Progress & RFI Audits Fit to Record"</span>
          <span>✦</span>
        </div>

        <div className="flex items-center gap-3">
          <span>{currentDateFormatted}</span>
          <span className="text-[#111111] font-bold border border-[#111111] px-1 bg-[#E5E5E0]">
            WEATHER: CLEAR
          </span>
        </div>
      </div>

      {/* 2. Main Newspaper Masthead */}
      <div className="max-w-screen-xl mx-auto px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-[#111111] pb-2 sm:pb-3">
          {/* Left: Big Serif Title & Project Info */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#111111] uppercase leading-none">
                  THE PROJECT CHRONICLE
                </h1>
                <span className="bg-[#CC0000] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 tracking-widest uppercase">
                  DAILY RECORD
                </span>
              </div>
              <p className="text-xs font-mono text-[#525252] tracking-wider uppercase mt-1">
                工程紀事報 · 工事套件排程 · 疑義追蹤審查系統
              </p>
            </div>
          </div>

          {/* Right: Quick Controls (Project Switcher, User & Actions) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Project Switcher Dropdown */}
            <div className="relative" ref={projRef}>
              <button
                type="button"
                id="btn-project-dropdown"
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F9F7] hover:bg-[#E5E5E0] text-[#111111] border border-[#111111] text-xs font-mono font-bold transition-all duration-150 hard-shadow-sm"
              >
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeProject.name}</span>
                <span className="bg-[#111111] text-[#F9F9F7] px-1 py-0.2 text-[10px]">
                  {activeProject.code}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#111111] shrink-0" />
              </button>

              {showProjectMenu && (
                <div className="absolute right-0 mt-1 w-80 bg-[#F9F9F7] border-2 border-[#111111] hard-shadow p-2 z-50 text-[#111111]">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#737373] border-b border-[#111111] pb-1">
                    PROJECT REGISTRY (選擇工程專案)
                  </div>
                  <div className="space-y-1 mt-1">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        id={`select-project-${p.id}`}
                        onClick={() => {
                          onSelectProject(p.id);
                          setShowProjectMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 border text-xs transition-colors duration-150 flex flex-col ${
                          p.id === activeProject.id
                            ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                            : 'border-transparent hover:border-[#111111] hover:bg-[#E5E5E0] text-[#111111]'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="truncate">{p.name}</span>
                          <span className="font-mono text-[10px] opacity-80">{p.code}</span>
                        </div>
                        <span className="text-[11px] opacity-75 line-clamp-1 mt-0.5 font-body">
                          {p.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Dispatch Action */}
            <div className="relative" ref={createRef}>
              <button
                type="button"
                id="btn-create-dropdown"
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] border border-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-all duration-150 hard-shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>發布 / 新增</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showCreateMenu && (
                <div className="absolute right-0 mt-1 w-52 bg-[#F9F9F7] border-2 border-[#111111] hard-shadow p-1.5 z-50 text-[#111111]">
                  <button
                    type="button"
                    id="btn-quick-new-card"
                    onClick={() => {
                      setShowCreateMenu(false);
                      onOpenCreateCard();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-mono font-semibold text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] flex items-center gap-2 border border-transparent hover:border-[#111111] transition-colors"
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    新增工作套件 / 任務
                  </button>
                  <button
                    type="button"
                    id="btn-quick-new-rfi"
                    onClick={() => {
                      setShowCreateMenu(false);
                      onOpenCreateRfi();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-mono font-semibold text-[#111111] hover:bg-[#CC0000] hover:text-white flex items-center gap-2 border border-transparent hover:border-[#CC0000] transition-colors mt-1"
                  >
                    <FileQuestion className="w-3.5 h-3.5" />
                    提報工程 RFI 疑義單
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Box */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                id="btn-notification-bell"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 bg-[#F9F9F7] text-[#111111] border border-[#111111] hover:bg-[#E5E5E0] transition-all duration-150 hard-shadow-sm"
                title="公報通知"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#CC0000] text-white text-[9px] font-mono font-bold px-1 border border-[#111111] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-[#F9F9F7] border-2 border-[#111111] hard-shadow p-3 z-50 text-[#111111]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#111111]">
                    <div className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#CC0000]" />
                      OFFICIAL DISPATCHES ({notifications.length})
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        id="btn-mark-all-read"
                        onClick={onMarkAllNotificationsRead}
                        className="text-[10px] font-mono font-bold text-[#111111] hover:text-[#CC0000] flex items-center gap-1 underline underline-offset-2"
                      >
                        <CheckCheck className="w-3 h-3" />
                        全數閱畢標註
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E5E0] my-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs font-mono text-[#737373]">
                        尚無任何最新工程通報
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif.id}
                          id={`notification-item-${notif.id}`}
                          onClick={() => {
                            onMarkNotificationRead(notif.id);
                            if (notif.linkType && notif.linkId && onNavigateToEntity) {
                              onNavigateToEntity(notif.linkType, notif.linkId);
                              setShowNotifMenu(false);
                            }
                          }}
                          className={`p-2.5 hover:bg-[#E5E5E0] cursor-pointer transition-colors ${
                            !notif.isRead ? 'bg-[#F0F0EE] border-l-4 border-[#CC0000]' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="text-xs font-serif font-bold text-[#111111] leading-tight">
                              {notif.title}
                            </h5>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-[#CC0000] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] font-body text-[#404040] mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="text-[10px] font-mono text-[#737373] mt-1.5 flex items-center justify-between">
                            <span>
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {notif.linkType && (
                              <span className="text-[#111111] font-bold underline flex items-center gap-0.5">
                                查閱公報 <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role & Persona Switcher */}
            <div className="relative" ref={userRef}>
              <button
                type="button"
                id="btn-user-role-selector"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 bg-[#F9F9F7] hover:bg-[#E5E5E0] border border-[#111111] text-[#111111] transition-all duration-150 hard-shadow-sm"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-6 h-6 object-cover grayscale border border-[#111111]"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden lg:block text-left font-mono">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-[#111111]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-72 bg-[#F9F9F7] border-2 border-[#111111] hard-shadow p-2 z-50 text-[#111111]">
                  <div className="px-3 py-2 border-b border-[#111111] flex items-center gap-2.5 bg-[#F0F0EE]">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-9 h-9 object-cover grayscale border border-[#111111]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs font-serif font-bold text-[#111111]">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#525252]">
                        {currentUser.email}
                      </div>
                      <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
                    </div>
                  </div>

                  <div className="p-2 text-[10px] font-mono font-bold text-[#737373] uppercase tracking-widest border-b border-[#E5E5E0]">
                    PERSONA SIMULATOR (切換身分權限)
                  </div>
                  <div className="space-y-1 mt-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        id={`switch-user-${u.id}`}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 border text-xs font-mono transition-colors flex items-center justify-between ${
                          u.id === currentUser.id
                            ? 'bg-[#111111] text-[#F9F9F7] border-[#111111]'
                            : 'border-transparent hover:border-[#111111] hover:bg-[#E5E5E0] text-[#111111]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-5 h-5 object-cover grayscale border border-[#111111]"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-medium">{u.name}</span>
                        </div>
                        <span className="text-[10px] uppercase">{u.role}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#111111] px-1">
                    <button
                      type="button"
                      id="btn-reset-demo-data"
                      onClick={() => {
                        setShowUserMenu(false);
                        onResetDemoData();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs font-mono text-[#CC0000] hover:bg-[#CC0000] hover:text-white border border-transparent hover:border-[#CC0000] flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重置系統預設示範資料 (RESET DATA)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Editorial Navigation Bar & View Tabs */}
        <nav className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-0 border-l border-t border-b border-[#111111] overflow-x-auto w-full md:w-auto">
            {/* Kanban Tab */}
            <button
              type="button"
              id="nav-tab-kanban"
              onClick={() => onViewChange('kanban')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#111111] transition-all duration-150 shrink-0 ${
                currentView === 'kanban'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>[01] 看板排程 · KANBAN</span>
            </button>

            {/* Gantt Tab */}
            <button
              type="button"
              id="nav-tab-gantt"
              onClick={() => onViewChange('gantt')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#111111] transition-all duration-150 shrink-0 ${
                currentView === 'gantt'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>[02] 甘特時程 · GANTT</span>
            </button>

            {/* RFI Tab */}
            <button
              type="button"
              id="nav-tab-rfi"
              onClick={() => onViewChange('rfi')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#111111] transition-all duration-150 shrink-0 ${
                currentView === 'rfi'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>[03] 工程疑義 · RFI DISPATCH</span>
            </button>

            {/* Overview Tab */}
            <button
              type="button"
              id="nav-tab-overview"
              onClick={() => onViewChange('overview')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-r border-[#111111] transition-all duration-150 shrink-0 ${
                currentView === 'overview'
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>[04] 專案總覽 · THE FRONT PAGE</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#525252] border-t border-b border-[#000000] py-2 px-3">
            <span className="font-bold text-[#111111]">EDITION:</span> VOL 1.0 · PRINTED DIGITALLY
          </div>
        </nav>
      </div>

      {/* 4. Breaking News / Bulletin Crawl Ticker */}
      <div className="bg-[#111111] text-[#F9F9F7] py-1 border-t border-b border-[#111111] overflow-hidden flex items-center font-mono text-xs select-none">
        <div className="bg-[#CC0000] text-white font-bold px-3 py-0.5 tracking-widest uppercase flex items-center gap-1.5 shrink-0 z-10 border-r border-[#111111]">
          <Flame className="w-3 h-3" />
          <span>BREAKING DISPATCH</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="animate-ticker text-[11px] tracking-wide">
            <span className="mx-6">
              ✦ [RFI-001] 地下二樓連續壁深水滲水疑義：已提送結構技師覆核，工期影響評估中
            </span>
            <span className="mx-6 text-[#E5E5E0]">///</span>
            <span className="mx-6">
              ✦ [WP-003] 主結構 B2F 頂板灌漿工程即將進場施作，抽檢鋼筋綁紮強度通過
            </span>
            <span className="mx-6 text-[#E5E5E0]">///</span>
            <span className="mx-6 text-[#CC0000] font-bold">
              ✦ [ALERT] 消防安全防護審查即將於本週五截止，請監造主任盡速覆核答覆
            </span>
            <span className="mx-6 text-[#E5E5E0]">///</span>
            <span className="mx-6">
              ✦ [AUDIT] 雙週工程查驗進度目前超前 4.2%，累計安全工時已達 128,000 小時
            </span>
            {/* Duplicated for seamless crawl */}
            <span className="mx-6">
              ✦ [RFI-001] 地下二樓連續壁深水滲水疑義：已提送結構技師覆核，工期影響評估中
            </span>
            <span className="mx-6 text-[#E5E5E0]">///</span>
            <span className="mx-6">
              ✦ [WP-003] 主結構 B2F 頂板灌漿工程即將進場施作，抽檢鋼筋綁紮強度通過
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
