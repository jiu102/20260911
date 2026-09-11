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
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_COLUMNS,
  INITIAL_CARDS,
  INITIAL_RFIS,
  INITIAL_ATTACHMENTS,
  INITIAL_COMMENTS,
  INITIAL_ACTIVITIES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';

const STORAGE_KEY = 'pm_rfi_tracking_openproject_v3';

interface StorageState {
  users: User[];
  projects: Project[];
  columns: BoardColumn[];
  cards: KanbanCard[];
  rfis: RFI[];
  attachments: Attachment[];
  comments: CardComment[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  currentUserId: string;
  activeProjectId: string;
}

function loadState(): StorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: StorageState = JSON.parse(raw);
      // Ensure all cards have Gantt fields
      if (parsed.cards) {
        parsed.cards = parsed.cards.map((c) => ({
          ...c,
          startDate: c.startDate || c.createdAt.split('T')[0],
          progress: c.progress ?? (c.columnId === 'col-done' ? 100 : c.columnId === 'col-in-progress' ? 50 : 0),
          cardType: c.cardType || 'task',
          dependencies: c.dependencies || [],
        }));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load localStorage', e);
  }

  const initial: StorageState = {
    users: INITIAL_USERS,
    projects: INITIAL_PROJECTS,
    columns: INITIAL_COLUMNS,
    cards: INITIAL_CARDS,
    rfis: INITIAL_RFIS,
    attachments: INITIAL_ATTACHMENTS,
    comments: INITIAL_COMMENTS,
    activities: INITIAL_ACTIVITIES,
    notifications: INITIAL_NOTIFICATIONS,
    currentUserId: 'usr-1', // Default to Sarah Lin (PM)
    activeProjectId: 'prj-1',
  };
  saveState(initial);
  return initial;
}

function saveState(state: StorageState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// Global in-memory instance
let db: StorageState = loadState();

export const apiService = {
  resetToDefault(): StorageState {
    localStorage.removeItem(STORAGE_KEY);
    db = loadState();
    return db;
  },

  getState(): StorageState {
    return db;
  },

  // Users & Auth simulator
  getCurrentUser(): User {
    const u = db.users.find((user) => user.id === db.currentUserId);
    return u || db.users[0];
  },

  setCurrentUser(userId: string) {
    db.currentUserId = userId;
    saveState(db);
  },

  getUsers(): User[] {
    return db.users;
  },

  // Projects
  getProjects(): Project[] {
    return db.projects;
  },

  getActiveProject(): Project {
    const p = db.projects.find((proj) => proj.id === db.activeProjectId);
    return p || db.projects[0];
  },

  setActiveProject(projectId: string) {
    db.activeProjectId = projectId;
    saveState(db);
  },

  createProject(name: string, code: string, description: string): Project {
    const newProj: Project = {
      id: `prj-${Date.now()}`,
      name,
      code,
      description,
      createdAt: new Date().toISOString(),
      members: db.users.map((u) => ({ userId: u.id, roleInProject: u.role })),
    };
    db.projects.push(newProj);
    db.activeProjectId = newProj.id;
    saveState(db);
    return newProj;
  },

  // Board & Columns
  getColumns(boardId = 'board-1'): BoardColumn[] {
    return db.columns
      .filter((c) => c.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  },

  createColumn(title: string, color = '#6366F1', boardId = 'board-1'): BoardColumn {
    const maxPos = db.columns.reduce((m, c) => Math.max(m, c.position), 0);
    const newCol: BoardColumn = {
      id: `col-${Date.now()}`,
      boardId,
      title,
      position: maxPos + 1,
      color,
    };
    db.columns.push(newCol);
    saveState(db);
    return newCol;
  },

  updateColumn(columnId: string, updates: Partial<BoardColumn>): BoardColumn | null {
    const col = db.columns.find((c) => c.id === columnId);
    if (!col) return null;
    Object.assign(col, updates);
    saveState(db);
    return col;
  },

  deleteColumn(columnId: string): boolean {
    // If cards exist in this column, move them to the first column
    const fallbackCol = db.columns.find((c) => c.id !== columnId);
    if (fallbackCol) {
      db.cards.forEach((c) => {
        if (c.columnId === columnId) {
          c.columnId = fallbackCol.id;
        }
      });
    }
    db.columns = db.columns.filter((c) => c.id !== columnId);
    saveState(db);
    return true;
  },

  // Cards
  getCards(): KanbanCard[] {
    return db.cards;
  },

  createCard(data: {
    columnId: string;
    title: string;
    description: string;
    priority: CardPriority;
    startDate?: string;
    dueDate: string;
    progress?: number;
    cardType?: any;
    dependencies?: string[];
    assigneeIds: string[];
    tags: string[];
    linkedRfiId?: string;
  }): KanbanCard {
    const currentUser = this.getCurrentUser();
    const columnCards = db.cards.filter((c) => c.columnId === data.columnId);
    const position = columnCards.length;

    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      columnId: data.columnId,
      boardId: 'board-1',
      title: data.title,
      description: data.description,
      priority: data.priority,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      progress: data.progress ?? (data.columnId === 'col-done' ? 100 : 0),
      cardType: data.cardType || 'task',
      dependencies: data.dependencies || [],
      position,
      assigneeIds: data.assigneeIds,
      tags: data.tags,
      linkedRfiId: data.linkedRfiId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.cards.push(newCard);

    // If linked to an RFI, update that RFI's linkedCardId
    if (data.linkedRfiId) {
      const rfi = db.rfis.find((r) => r.id === data.linkedRfiId);
      if (rfi) {
        rfi.linkedCardId = newCard.id;
      }
    }

    // Activity Log
    db.activities.unshift({
      id: `act-${Date.now()}`,
      entityType: 'card',
      entityId: newCard.id,
      userId: currentUser.id,
      action: '建立任務卡片',
      details: `建立了卡片「${newCard.title}」`,
      timestamp: new Date().toISOString(),
    });

    // Notify assignees
    data.assigneeIds.forEach((uid) => {
      if (uid !== currentUser.id) {
        db.notifications.unshift({
          id: `notif-${Date.now()}-${uid}`,
          userId: uid,
          title: '任務指派通知',
          message: `${currentUser.name} 將您指派至「${newCard.title}」`,
          type: 'task_assigned',
          linkType: 'card',
          linkId: newCard.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    saveState(db);
    return newCard;
  },

  updateCard(cardId: string, updates: Partial<KanbanCard>): KanbanCard | null {
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return null;
    const currentUser = this.getCurrentUser();

    // Check if assignees changed
    if (updates.assigneeIds && JSON.stringify(updates.assigneeIds) !== JSON.stringify(card.assigneeIds)) {
      const newAssignees = updates.assigneeIds.filter((uid) => !card.assigneeIds.includes(uid));
      newAssignees.forEach((uid) => {
        if (uid !== currentUser.id) {
          db.notifications.unshift({
            id: `notif-${Date.now()}-${uid}`,
            userId: uid,
            title: '任務指派更新',
            message: `${currentUser.name} 將您指派為「${card.title}」的負責人`,
            type: 'task_assigned',
            linkType: 'card',
            linkId: card.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
    }

    Object.assign(card, updates, { updatedAt: new Date().toISOString() });

    // Link back RFI if specified
    if (updates.linkedRfiId) {
      const rfi = db.rfis.find((r) => r.id === updates.linkedRfiId);
      if (rfi) {
        rfi.linkedCardId = card.id;
      }
    }

    saveState(db);
    return card;
  },

  moveCard(cardId: string, targetColumnId: string, targetIndex?: number): boolean {
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return false;
    const currentUser = this.getCurrentUser();
    const sourceCol = db.columns.find((c) => c.id === card.columnId);
    const destCol = db.columns.find((c) => c.id === targetColumnId);

    const oldColumnId = card.columnId;
    card.columnId = targetColumnId;
    card.updatedAt = new Date().toISOString();

    // Reorder cards in target column
    const targetCards = db.cards
      .filter((c) => c.columnId === targetColumnId && c.id !== cardId)
      .sort((a, b) => a.position - b.position);

    if (typeof targetIndex === 'number' && targetIndex >= 0) {
      targetCards.splice(targetIndex, 0, card);
    } else {
      targetCards.push(card);
    }

    targetCards.forEach((c, idx) => {
      c.position = idx;
    });

    // Also reorder source column
    if (oldColumnId !== targetColumnId) {
      const sourceCards = db.cards
        .filter((c) => c.columnId === oldColumnId)
        .sort((a, b) => a.position - b.position);
      sourceCards.forEach((c, idx) => {
        c.position = idx;
      });

      // Log movement activity
      db.activities.unshift({
        id: `act-${Date.now()}`,
        entityType: 'card',
        entityId: card.id,
        userId: currentUser.id,
        action: '移動卡片',
        details: `將卡片「${card.title}」從「${sourceCol?.title || oldColumnId}」移動至「${destCol?.title || targetColumnId}」`,
        timestamp: new Date().toISOString(),
      });
    }

    saveState(db);
    return true;
  },

  deleteCard(cardId: string): boolean {
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) return false;
    db.cards = db.cards.filter((c) => c.id !== cardId);
    // Remove comments and attachments
    db.comments = db.comments.filter((cmt) => cmt.cardId !== cardId);
    db.attachments = db.attachments.filter((a) => !(a.entityType === 'card' && a.entityId === cardId));
    saveState(db);
    return true;
  },

  // RFIs
  getRFIs(projectId?: string): RFI[] {
    const pId = projectId || db.activeProjectId;
    return db.rfis.filter((r) => r.projectId === pId);
  },

  getRFIById(id: string): RFI | undefined {
    return db.rfis.find((r) => r.id === id);
  },

  generateRfiNumber(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `RFI-${yearMonth}-`;
    const matching = db.rfis.filter((r) => r.rfiNumber.startsWith(prefix));
    const nextSeq = matching.length + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  },

  createRFI(data: {
    title: string;
    question: string;
    assignedReviewerId: string;
    scheduleImpact: boolean;
    scheduleDelayDays?: number;
    costImpact: boolean;
    costImpactAmount?: number;
    dueDate: string;
    status?: RfiStatus;
    linkedCardId?: string;
  }): RFI {
    const currentUser = this.getCurrentUser();
    const rfiNumber = this.generateRfiNumber();
    const status: RfiStatus = data.status || 'submitted';

    const newRfi: RFI = {
      id: `rfi-${Date.now()}`,
      projectId: db.activeProjectId,
      rfiNumber,
      title: data.title,
      question: data.question,
      status,
      raisedById: currentUser.id,
      assignedReviewerId: data.assignedReviewerId,
      scheduleImpact: data.scheduleImpact,
      scheduleDelayDays: data.scheduleDelayDays,
      costImpact: data.costImpact,
      costImpactAmount: data.costImpactAmount,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      linkedCardId: data.linkedCardId,
    };

    db.rfis.unshift(newRfi);

    // If linked to a card, update card's linkedRfiId
    if (data.linkedCardId) {
      const card = db.cards.find((c) => c.id === data.linkedCardId);
      if (card) {
        card.linkedRfiId = newRfi.id;
      }
    }

    // Activity Log
    db.activities.unshift({
      id: `act-${Date.now()}`,
      entityType: 'rfi',
      entityId: newRfi.id,
      userId: currentUser.id,
      action: '建立 RFI',
      details: `建立了工程疑義 ${rfiNumber}「${newRfi.title}」`,
      timestamp: new Date().toISOString(),
    });

    // Notification to assigned reviewer
    if (data.assignedReviewerId) {
      db.notifications.unshift({
        id: `notif-${Date.now()}-rev`,
        userId: data.assignedReviewerId,
        title: '新 RFI 等待答覆與審核',
        message: `${currentUser.name} 提交了 ${rfiNumber}「${newRfi.title}」，請進行技術答覆。`,
        type: 'rfi_pending',
        linkType: 'rfi',
        linkId: newRfi.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveState(db);
    return newRfi;
  },

  updateRFI(rfiId: string, updates: Partial<RFI>): RFI | null {
    const rfi = db.rfis.find((r) => r.id === rfiId);
    if (!rfi) return null;
    const currentUser = this.getCurrentUser();

    // Check status change
    if (updates.status && updates.status !== rfi.status) {
      db.activities.unshift({
        id: `act-${Date.now()}`,
        entityType: 'rfi',
        entityId: rfi.id,
        userId: currentUser.id,
        action: '變更 RFI 狀態',
        details: `將 ${rfi.rfiNumber} 狀態從「${rfi.status}」更新為「${updates.status}」`,
        timestamp: new Date().toISOString(),
      });

      // Notify the raiser
      if (rfi.raisedById !== currentUser.id) {
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: rfi.raisedById,
          title: `RFI 狀態更新 (${rfi.rfiNumber})`,
          message: `${currentUser.name} 已將 ${rfi.rfiNumber} 狀態更改為 ${updates.status}`,
          type: 'rfi_status',
          linkType: 'rfi',
          linkId: rfi.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    Object.assign(rfi, updates);
    saveState(db);
    return rfi;
  },

  respondToRFI(
    rfiId: string,
    responseText: string,
    decision: 'approved' | 'rejected' | 'clarification' = 'approved'
  ): RFI | null {
    const rfi = db.rfis.find((r) => r.id === rfiId);
    if (!rfi) return null;
    const currentUser = this.getCurrentUser();

    rfi.officialResponse = {
      responderId: currentUser.id,
      responseText,
      decision,
      respondedAt: new Date().toISOString(),
    };
    rfi.status = decision === 'rejected' ? 'rejected' : 'answered';

    // Activity log
    db.activities.unshift({
      id: `act-${Date.now()}`,
      entityType: 'rfi',
      entityId: rfi.id,
      userId: currentUser.id,
      action: '提交正式答覆',
      details: `審核人員 ${currentUser.name} 提交了 ${rfi.rfiNumber} 的正式答覆 (決策: ${decision})`,
      timestamp: new Date().toISOString(),
    });

    // Notify the question raiser
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: rfi.raisedById,
      title: `RFI 已獲得正式解答 (${rfi.rfiNumber})`,
      message: `${currentUser.name} 已正式答覆 ${rfi.rfiNumber}「${rfi.title}」`,
      type: 'rfi_status',
      linkType: 'rfi',
      linkId: rfi.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveState(db);
    return rfi;
  },

  closeRFI(rfiId: string): RFI | null {
    const rfi = db.rfis.find((r) => r.id === rfiId);
    if (!rfi) return null;
    const currentUser = this.getCurrentUser();

    rfi.status = 'closed';
    rfi.closedAt = new Date().toISOString();

    db.activities.unshift({
      id: `act-${Date.now()}`,
      entityType: 'rfi',
      entityId: rfi.id,
      userId: currentUser.id,
      action: '結案 RFI',
      details: `PM/審查者 ${currentUser.name} 將 ${rfi.rfiNumber} 正式結案`,
      timestamp: new Date().toISOString(),
    });

    saveState(db);
    return rfi;
  },

  // 1-Click Convert RFI to Kanban Task Card (Specification 3.3)
  convertRfiToCard(rfiId: string, targetColumnId = 'col-todo'): KanbanCard | null {
    const rfi = db.rfis.find((r) => r.id === rfiId);
    if (!rfi) return null;
    const currentUser = this.getCurrentUser();

    const responseExcerpt = rfi.officialResponse
      ? `\n\n【正式解答方針】\n${rfi.officialResponse.responseText}`
      : '';

    const newCard = this.createCard({
      columnId: targetColumnId,
      title: `[落實 ${rfi.rfiNumber}] ${rfi.title}`,
      description: `依據工程疑義解答落實執行：\n${rfi.question}${responseExcerpt}`,
      priority: rfi.scheduleImpact || rfi.costImpact ? 'high' : 'medium',
      dueDate: rfi.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assigneeIds: [rfi.raisedById],
      tags: ['RFI衍生', '工程施作'],
      linkedRfiId: rfi.id,
    });

    rfi.linkedCardId = newCard.id;

    db.activities.unshift({
      id: `act-${Date.now()}`,
      entityType: 'rfi',
      entityId: rfi.id,
      userId: currentUser.id,
      action: '一鍵轉化為看板任務',
      details: `將 ${rfi.rfiNumber} 轉化為看板卡片「${newCard.title}」`,
      timestamp: new Date().toISOString(),
    });

    saveState(db);
    return newCard;
  },

  // Attachments & Uploads (Section 3.4 & 4.3)
  getAttachments(entityType: 'card' | 'rfi', entityId: string): Attachment[] {
    return db.attachments.filter(
      (a) => a.entityType === entityType && a.entityId === entityId
    );
  },

  uploadFile(data: {
    entityType: 'card' | 'rfi';
    entityId: string;
    file: File | { name: string; size: number; type: string; dataUrl: string };
  }): Promise<Attachment> {
    const currentUser = this.getCurrentUser();
    return new Promise((resolve, reject) => {
      // 50MB Limit check
      const MAX_SIZE = 50 * 1024 * 1024;
      if (data.file.size > MAX_SIZE) {
        return reject(new Error('檔案大小超過 50MB 限制！'));
      }

      const createRecord = (dataUrl: string, fileName: string, fileType: string, fileSize: number) => {
        const att: Attachment = {
          id: `att-${Date.now()}`,
          entityType: data.entityType,
          entityId: data.entityId,
          fileName,
          fileType,
          fileSize,
          filePath: dataUrl,
          uploadedById: currentUser.id,
          uploadedAt: new Date().toISOString(),
        };

        db.attachments.unshift(att);

        // Activity log
        db.activities.unshift({
          id: `act-${Date.now()}`,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: currentUser.id,
          action: '上傳附件',
          details: `上傳了檔案「${fileName}」(${Math.round(fileSize / 1024)} KB)`,
          timestamp: new Date().toISOString(),
        });

        saveState(db);
        resolve(att);
      };

      if ('dataUrl' in data.file) {
        createRecord(data.file.dataUrl, data.file.name, data.file.type, data.file.size);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          createRecord(reader.result as string, (data.file as File).name, (data.file as File).type, (data.file as File).size);
        };
        reader.onerror = () => reject(new Error('讀取檔案失敗'));
        reader.readAsDataURL(data.file as File);
      }
    });
  },

  deleteAttachment(attachmentId: string): boolean {
    const att = db.attachments.find((a) => a.id === attachmentId);
    if (!att) return false;
    db.attachments = db.attachments.filter((a) => a.id !== attachmentId);
    saveState(db);
    return true;
  },

  // Comments & @Mentions (Section 3.5)
  getComments(cardId: string): CardComment[] {
    return db.comments.filter((c) => c.cardId === cardId);
  },

  addComment(cardId: string, content: string): CardComment {
    const currentUser = this.getCurrentUser();
    // Parse @mentions
    const mentions: string[] = [];
    db.users.forEach((u) => {
      if (content.includes(`@${u.name}`) || content.includes(`@${u.name.split(' ')[0]}`)) {
        mentions.push(u.id);
      }
    });

    const newComment: CardComment = {
      id: `cmt-${Date.now()}`,
      cardId,
      authorId: currentUser.id,
      content,
      mentions,
      createdAt: new Date().toISOString(),
    };

    db.comments.push(newComment);

    // Notify mentioned users
    const card = db.cards.find((c) => c.id === cardId);
    mentions.forEach((uid) => {
      if (uid !== currentUser.id) {
        db.notifications.unshift({
          id: `notif-${Date.now()}-${uid}`,
          userId: uid,
          title: '你在卡片留言中被 @提及',
          message: `${currentUser.name} 在「${card?.title || '任務'}」中提到了你：「${content.slice(0, 40)}...」`,
          type: 'mention',
          linkType: 'card',
          linkId: cardId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    saveState(db);
    return newComment;
  },

  // Activity Log
  getActivities(entityType?: 'card' | 'rfi', entityId?: string): ActivityLog[] {
    if (entityType && entityId) {
      return db.activities.filter((a) => a.entityType === entityType && a.entityId === entityId);
    }
    return db.activities;
  },

  // Notifications
  getNotifications(userId?: string): NotificationItem[] {
    const uid = userId || db.currentUserId;
    return db.notifications.filter((n) => n.userId === uid);
  },

  markNotificationRead(notificationId: string) {
    const notif = db.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      saveState(db);
    }
  },

  markAllNotificationsRead(userId?: string) {
    const uid = userId || db.currentUserId;
    db.notifications.forEach((n) => {
      if (n.userId === uid) n.isRead = true;
    });
    saveState(db);
  },

  // Simulate Email Dispatch Trigger
  simulateSendEmailNotification(toEmail: string, subject: string, snippet: string) {
    console.log(`[Email Service] Sent to ${toEmail}: ${subject}`);
    const currentUser = this.getCurrentUser();
    db.notifications.unshift({
      id: `notif-${Date.now()}-email`,
      userId: currentUser.id,
      title: '📧 Email 通知已發送',
      message: `已同步發送郵件提醒至 ${toEmail}：[${subject}]`,
      type: 'rfi_status',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    saveState(db);
  },
};
