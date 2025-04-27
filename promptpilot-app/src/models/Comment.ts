export interface Comment {
  id: string;
  promptId: string;
  userId: string;
  authorId?: string; // für Abwärtskompatibilität 
  authorName: string;
  authorImageUrl: string;
  text: string;
  content?: string; // für Abwärtskompatibilität
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string | null;
  replies?: Comment[];
}

export interface CommentData {
  id?: string;
  promptId: string;
  userId: string;
  authorId?: string; // für Abwärtskompatibilität
  authorName?: string;
  authorImageUrl?: string;
  text: string;
  content?: string; // für Abwärtskompatibilität
  likesCount?: number;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  parentId?: string | null;
}

export const convertToComment = (data: CommentData): Comment => {
  return {
    id: data.id || '',
    promptId: data.promptId,
    userId: data.userId,
    authorId: data.authorId || data.userId, // Fallback für Abwärtskompatibilität
    authorName: data.authorName || '',
    authorImageUrl: data.authorImageUrl || '',
    text: data.text || data.content || '', // Fallback für Abwärtskompatibilität
    content: data.content || data.text || '', // Fallback für Abwärtskompatibilität
    likesCount: data.likesCount || 0,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    parentId: data.parentId || null,
    replies: []
  };
};
