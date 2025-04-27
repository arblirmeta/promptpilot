export interface Prompt {
  id: string;
  title: string;
  content: string;
  text?: string;          // Der eigentliche Prompt-Text (neu hinzugefügt)
  description?: string;   // Die Beschreibung des Prompts (neu hinzugefügt)
  category: string;
  tags: string[];
  authorId: string;
  userId?: string;        // userId für neue Prompts (neu hinzugefügt)
  authorName: string;
  userDisplayName?: string; // Für neue Prompts (neu hinzugefügt)
  authorImageUrl: string;
  userProfileImage?: string; // Für neue Prompts (neu hinzugefügt)
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  averageRating: number;  // Für alte Prompts
  rating?: number;        // Für neue Prompts (neu hinzugefügt)
  ratingCount: number;
  ratingsCount?: number;  // Alternative Schreibweise (neu hinzugefügt)
  createdAt: Date;
  updatedAt: Date;
  isPremium?: boolean;    // Premium-Status eines Prompts
  isPublic?: boolean;    // Öffentlicher Status eines Prompts
  isFeatured?: boolean;  // Featured-Status eines Prompts (neu hinzugefügt)
}

export interface PromptData {
  id: string;
  title?: string;
  content?: string;
  text?: string;           // Der eigentliche Prompt-Text
  description?: string;    // Die Beschreibung des Prompts 
  category?: string;
  tags?: string[];
  authorId?: string;
  userId?: string;         // userId für neue Prompts
  authorName?: string; 
  userDisplayName?: string; // Für neue Prompts
  authorImageUrl?: string;
  userProfileImage?: string; // Für neue Prompts
  likesCount?: number;
  viewsCount?: number;
  commentsCount?: number;
  averageRating?: number;   // Für alte Prompts
  rating?: number;          // Für neue Prompts
  ratingCount?: number;     // Für alte Prompts
  ratingsCount?: number;    // Für neue Prompts
  isPublic?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;     // Featured-Status
  likesBy?: string[];
  likedByUsers?: string[];  // Alternative Schreibweise
  createdAt?: string | number;
  lastModified?: string | number; // Entspricht updatedAt in der App
  updatedAt?: any;          // Firestore-Timestamp
}

export const convertToPrompt = (data: PromptData): Prompt => {
  // Stelle sicher, dass alle erforderlichen Felder mit Standardwerten initialisiert werden
  return {
    id: data.id,
    // Sichere Standardwerte für fehlende Eigenschaften
    title: data.title || '',
    
    // Der tatsächliche Prompt-Text und Beschreibung
    text: data.text || '',
    content: data.content || data.description || '',
    description: data.description || '',
    
    // Kategorie und Tags
    category: data.category || 'Allgemein',
    tags: Array.isArray(data.tags) ? data.tags : [],
    
    // Autor-Informationen (verwendet sowohl alte als auch neue Feldnamen)
    authorId: data.userId || data.authorId || '',  
    userId: data.userId || data.authorId || '',
    authorName: data.userDisplayName || data.authorName || 'Unbekannter Autor',
    userDisplayName: data.userDisplayName || data.authorName || '',
    authorImageUrl: data.userProfileImage || data.authorImageUrl || '',
    userProfileImage: data.userProfileImage || data.authorImageUrl || '',
    
    // Zähler und Bewertungen
    likesCount: data.likesCount || 0,
    viewsCount: data.viewsCount || 0,
    commentsCount: data.commentsCount || 0,
    averageRating: data.rating || data.averageRating || 0,
    rating: data.rating || data.averageRating || 0,
    ratingCount: data.ratingsCount || data.ratingCount || 0,
    ratingsCount: data.ratingsCount || data.ratingCount || 0,
    
    // Status-Flags
    isPremium: data.isPremium || false,
    isPublic: data.isPublic !== false, // Standardmäßig öffentlich, es sei denn, ausdrücklich auf false gesetzt
    isFeatured: data.isFeatured || false,
    
    // Datums-Konvertierung
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.lastModified || data.updatedAt ? new Date(data.lastModified || data.updatedAt) : new Date()
  };
};
