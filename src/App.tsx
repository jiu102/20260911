/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { apiService } from './services/apiService';
import {
  User,
  Project,
  BoardColumn,
  KanbanCard,
  RFI,
  Attachment,
  CardComment,
  ActivityLog,
  NotificationItem,
  CardPriority,
  RfiStatus,
} from './types';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { GanttChart } from './components/GanttChart';
import { WorkPackagesSubHeader } from './components/WorkPackagesSubHeader';
import { RFIDashboard } from './components/RFIDashboard';
import { ProjectOverview } from './components/ProjectOverview';
import { CardDetailModal } from './components/CardDetailModal';
import { RFIDetailModal } from './components/RFIDetailModal';
import { CreateCardModal } from './components/CreateCardModal';
import { CreateRfiModal } from './components/CreateRfiModal';

export default function App() {
  // Navigation view: Kanban, Gantt (Work Packages), RFI, or Project Overview
  const [currentView, setCurrentView] = useState<'kanban' | 'gantt' | 'rfi' | 'overview'>('kanban');

  // Core entities
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<CardComment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Selected modals
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedRfiId, setSelectedRfiId] = useState<string | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [createCardColumnId, setCreateCardColumnId] = useState<string | undefined>(undefined);
  const [isCreatingRfi, setIsCreatingRfi] = useState(false);

  // Sync state from apiService
  const refreshData = () => {
    const state = apiService.getState();
    setUsers(state.users);
    setCurrentUser(apiService.getCurrentUser());
    setProjects(state.projects);
    setActiveProject(apiService.getActiveProject());
    setColumns(apiService.getColumns());
    setCards(apiService.getCards());
    setRfis(apiService.getRFIs());
    setAttachments(state.attachments);
    setComments(state.comments);
    setActivities(state.activities);
    setNotifications(apiService.getNotifications());
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (!currentUser || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F9F9F7] font-mono">
        <div className="border-2 border-[#111111] bg-white p-4 hard-shadow text-center">
          <div className="font-serif font-black text-lg uppercase tracking-wider mb-2">THE GAZETTE DISPATCH</div>
          <div className="text-xs text-[#737373] animate-pulse">[ 加載專案與公文案卷中... ]</div>
        </div>
      </div>
    );
  }

  // Card Handlers
  const handleMoveCard = (cardId: string, targetColumnId: string, targetIndex?: number) => {
    // Optimistic UI update
    setCards((prev) => {
      const copy = [...prev];
      const card = copy.find((c) => c.id === cardId);
      if (card) {
        card.columnId = targetColumnId;
      }
      return copy;
    });

    apiService.moveCard(cardId, targetColumnId, targetIndex);
    refreshData();
  };

  const handleAddCard = (data: {
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
  }) => {
    const newCard = apiService.createCard(data);
    refreshData();
    setSelectedCardId(newCard.id);
  };

  const handleUpdateCard = (cardId: string, updates: Partial<KanbanCard>) => {
    apiService.updateCard(cardId, updates);
    refreshData();
  };

  const handleDeleteCard = (cardId: string) => {
    apiService.deleteCard(cardId);
    refreshData();
  };

  // Column Handlers
  const handleAddColumn = (title: string, color: string) => {
    apiService.createColumn(title, color);
    refreshData();
  };

  const handleUpdateColumn = (columnId: string, title: string, color: string) => {
    apiService.updateColumn(columnId, { title, color });
    refreshData();
  };

  const handleDeleteColumn = (columnId: string) => {
    apiService.deleteColumn(columnId);
    refreshData();
  };

  // RFI Handlers
  const handleCreateRfi = (data: {
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
  }) => {
    const newRfi = apiService.createRFI(data);
    refreshData();
    setSelectedRfiId(newRfi.id);
  };

  const handleUpdateRfi = (rfiId: string, updates: Partial<RFI>) => {
    apiService.updateRFI(rfiId, updates);
    refreshData();
  };

  const handleRespondRfi = (
    rfiId: string,
    responseText: string,
    decision: 'approved' | 'rejected' | 'clarification'
  ) => {
    apiService.respondToRFI(rfiId, responseText, decision);
    refreshData();
  };

  const handleCloseRfi = (rfiId: string) => {
    apiService.closeRFI(rfiId);
    refreshData();
  };

  const handleConvertRfiToCard = (rfiId: string) => {
    const newCard = apiService.convertRfiToCard(rfiId);
    refreshData();
    if (newCard) {
      setSelectedRfiId(null);
      setSelectedCardId(newCard.id);
      setCurrentView('kanban');
    }
  };

  // Attachment Handlers
  const handleUploadCardAttachment = async (cardId: string, file: File) => {
    await apiService.uploadFile({
      entityType: 'card',
      entityId: cardId,
      file,
    });
    refreshData();
  };

  const handleUploadRfiAttachment = async (rfiId: string, file: File) => {
    await apiService.uploadFile({
      entityType: 'rfi',
      entityId: rfiId,
      file,
    });
    refreshData();
  };

  const handleDeleteAttachment = (id: string) => {
    apiService.deleteAttachment(id);
    refreshData();
  };

  // Comment Handlers
  const handleAddComment = (cardId: string, content: string) => {
    apiService.addComment(cardId, content);
    refreshData();
  };

  // Notification navigation
  const handleNavigateToEntity = (type: 'card' | 'rfi', id: string) => {
    if (type === 'card') {
      setSelectedCardId(id);
      setCurrentView('kanban');
    } else {
      setSelectedRfiId(id);
      setCurrentView('rfi');
    }
  };

  // Modals active item
  const activeCard = selectedCardId ? cards.find((c) => c.id === selectedCardId) || null : null;
  const activeRfi = selectedRfiId ? rfis.find((r) => r.id === selectedRfiId) || null : null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col selection:bg-[#111111] selection:text-[#F9F9F7] text-[#111111]">
      {/* Global Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={(uid) => {
          apiService.setCurrentUser(uid);
          refreshData();
        }}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(pid) => {
          apiService.setActiveProject(pid);
          refreshData();
        }}
        notifications={notifications}
        onMarkNotificationRead={(nid) => {
          apiService.markNotificationRead(nid);
          refreshData();
        }}
        onMarkAllNotificationsRead={() => {
          apiService.markAllNotificationsRead();
          refreshData();
        }}
        onOpenCreateCard={() => {
          setCreateCardColumnId(undefined);
          setIsCreatingCard(true);
        }}
        onOpenCreateRfi={() => setIsCreatingRfi(true)}
        onResetDemoData={() => {
          if (confirm('確定要將專案資料恢復為預設示範數據？')) {
            apiService.resetToDefault();
            refreshData();
          }
        }}
        onNavigateToEntity={handleNavigateToEntity}
      />

      {/* Work Packages SubHeader (OpenProject style) when on Kanban or Gantt */}
      {(currentView === 'kanban' || currentView === 'gantt') && (
        <WorkPackagesSubHeader
          activeProject={activeProject}
          cards={cards}
          rfis={rfis}
          currentPmView={currentView}
          onViewChange={(view) => setCurrentView(view)}
          onOpenCreateCard={() => {
            setCreateCardColumnId(undefined);
            setIsCreatingCard(true);
          }}
        />
      )}

      {/* Main View Layout */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'kanban' && (
          <KanbanBoard
            columns={columns}
            cards={cards}
            users={users}
            rfis={rfis}
            attachments={attachments}
            comments={comments}
            currentUser={currentUser}
            onMoveCard={handleMoveCard}
            onOpenCardDetail={(c) => setSelectedCardId(c.id)}
            onAddCard={(colId) => {
              setCreateCardColumnId(colId);
              setIsCreatingCard(true);
            }}
            onAddColumn={handleAddColumn}
            onUpdateColumn={handleUpdateColumn}
            onDeleteColumn={handleDeleteColumn}
            onOpenRfiDetail={(r) => setSelectedRfiId(r.id)}
          />
        )}

        {currentView === 'gantt' && (
          <GanttChart
            cards={cards}
            columns={columns}
            users={users}
            rfis={rfis}
            currentUser={currentUser}
            onOpenCardDetail={(c) => setSelectedCardId(c.id)}
            onOpenCreateCard={() => {
              setCreateCardColumnId(undefined);
              setIsCreatingCard(true);
            }}
            onUpdateCard={handleUpdateCard}
          />
        )}

        {currentView === 'rfi' && (
          <RFIDashboard
            rfis={rfis}
            users={users}
            currentUser={currentUser}
            onOpenRfiDetail={(r) => setSelectedRfiId(r.id)}
            onOpenCreateRfi={() => setIsCreatingRfi(true)}
          />
        )}

        {currentView === 'overview' && (
          <ProjectOverview
            project={activeProject}
            columns={columns}
            cards={cards}
            rfis={rfis}
            users={users}
            activities={activities}
            onOpenCardDetail={(c) => setSelectedCardId(c.id)}
            onOpenRfiDetail={(r) => setSelectedRfiId(r.id)}
          />
        )}
      </main>

      {/* Card Detail Modal */}
      {activeCard && (
        <CardDetailModal
          card={activeCard}
          columns={columns}
          users={users}
          rfis={rfis}
          attachments={attachments.filter((a) => a.entityType === 'card' && a.entityId === activeCard.id)}
          comments={comments.filter((c) => c.cardId === activeCard.id)}
          activities={activities.filter((a) => a.entityType === 'card' && a.entityId === activeCard.id)}
          currentUser={currentUser}
          onClose={() => setSelectedCardId(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onUploadAttachment={(file) => handleUploadCardAttachment(activeCard.id, file)}
          onDeleteAttachment={handleDeleteAttachment}
          onAddComment={(content) => handleAddComment(activeCard.id, content)}
          onOpenRfiDetail={(r) => {
            setSelectedCardId(null);
            setSelectedRfiId(r.id);
          }}
        />
      )}

      {/* RFI Detail Modal */}
      {activeRfi && (
        <RFIDetailModal
          rfi={activeRfi}
          users={users}
          cards={cards}
          attachments={attachments.filter((a) => a.entityType === 'rfi' && a.entityId === activeRfi.id)}
          activities={activities.filter((a) => a.entityType === 'rfi' && a.entityId === activeRfi.id)}
          currentUser={currentUser}
          onClose={() => setSelectedRfiId(null)}
          onUpdateRfi={handleUpdateRfi}
          onRespondRfi={handleRespondRfi}
          onCloseRfi={handleCloseRfi}
          onConvertRfiToCard={handleConvertRfiToCard}
          onUploadAttachment={(file) => handleUploadRfiAttachment(activeRfi.id, file)}
          onDeleteAttachment={handleDeleteAttachment}
          onOpenCardDetail={(c) => {
            setSelectedRfiId(null);
            setSelectedCardId(c.id);
          }}
          onSimulateEmail={(toEmail, subject, snippet) => {
            apiService.simulateSendEmailNotification(toEmail, subject, snippet);
            refreshData();
          }}
        />
      )}

      {/* Create Card Modal */}
      {isCreatingCard && (
        <CreateCardModal
          initialColumnId={createCardColumnId}
          columns={columns}
          users={users}
          rfis={rfis}
          onClose={() => setIsCreatingCard(false)}
          onSubmit={handleAddCard}
        />
      )}

      {/* Create RFI Modal */}
      {isCreatingRfi && (
        <CreateRfiModal
          rfiNumberPreview={apiService.generateRfiNumber()}
          users={users}
          cards={cards}
          onClose={() => setIsCreatingRfi(false)}
          onSubmit={handleCreateRfi}
        />
      )}
    </div>
  );
}
