export type UserRole = 'admin' | 'pm' | 'member' | 'client_reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  title: string;
  department: string;
}

export interface ProjectMember {
  userId: string;
  roleInProject: UserRole;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  members: ProjectMember[];
}

export interface BoardColumn {
  id: string;
  boardId: string;
  title: string;
  position: number;
  color?: string; // e.g. '#6366F1'
}

export type CardPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkPackageType = 'task' | 'milestone' | 'phase' | 'rfi_action';

export interface KanbanCard {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description: string;
  priority: CardPriority;
  startDate?: string;
  dueDate: string;
  progress?: number; // 0-100%
  cardType?: WorkPackageType;
  dependencies?: string[]; // IDs of predecessor tasks
  position: number;
  assigneeIds: string[];
  tags: string[];
  linkedRfiId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RfiStatus =
  | 'draft'
  | 'submitted'
  | 'pending_answer'
  | 'answered'
  | 'closed'
  | 'rejected';

export interface OfficialRfiResponse {
  responderId: string;
  responseText: string;
  decision: 'approved' | 'rejected' | 'clarification';
  respondedAt: string;
}

export interface RFI {
  id: string;
  projectId: string;
  rfiNumber: string; // e.g. RFI-202609-001
  title: string;
  question: string;
  status: RfiStatus;
  raisedById: string;
  assignedReviewerId: string;
  scheduleImpact: boolean;
  scheduleDelayDays?: number;
  costImpact: boolean;
  costImpactAmount?: number;
  dueDate: string;
  createdAt: string;
  closedAt?: string;
  linkedCardId?: string;
  officialResponse?: OfficialRfiResponse;
}

export interface Attachment {
  id: string;
  entityType: 'card' | 'rfi';
  entityId: string;
  fileName: string;
  fileType: string;
  fileSize: number; // in bytes
  filePath: string; // data URL or mock URL
  uploadedById: string;
  uploadedAt: string;
}

export interface CardComment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  entityType: 'card' | 'rfi' | 'project';
  entityId: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'rfi_status'
  | 'mention'
  | 'rfi_pending';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkType?: 'card' | 'rfi';
  linkId?: string;
  isRead: boolean;
  createdAt: string;
}
