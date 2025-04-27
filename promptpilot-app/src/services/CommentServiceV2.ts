import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  increment,
  deleteDoc,
  addDoc,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { firestore, auth } from '../config/firebase';
import { Comment, CommentData, convertToComment } from '../models/Comment';
import UserProfileService from './UserProfileService';

/**
 * Service für die Verwaltung von Kommentaren
 */
class CommentServiceV2 {
  private readonly COLLECTION_NAME = 'comments';
  private readonly PROMPTS_COLLECTION = 'prompts';

  /**
   * Fügt einen neuen Kommentar hinzu
   */
  async addComment(commentData: CommentData): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }

      // Hole das Benutzerprofil für den Namen und das Profilbild
      let userName = 'Unbekannter Nutzer';
      let photoURL = '';
      
      try {
        const userProfile = await UserProfileService.getUserProfile(currentUser.uid);
        if (userProfile) {
          userName = userProfile.displayName || userName;
          photoURL = userProfile.photoURL || photoURL;
        }
      } catch (error) {
        console.error('Fehler beim Laden des Benutzerprofils:', error);
      }

      const now = serverTimestamp();

      // Erstellen des vollständigen Kommentar-Objekts
      const newComment = {
        promptId: commentData.promptId,
        userId: currentUser.uid,
        authorName: userName,
        authorImageUrl: photoURL,
        text: commentData.text,
        likesCount: 0,
        createdAt: now,
        updatedAt: now,
        parentId: commentData.parentId || null
      };

      // Speichern des Kommentars
      const commentRef = await addDoc(collection(firestore, this.COLLECTION_NAME), newComment);

      // Aktualisieren des Prompts mit der Kommentaranzahl
      const promptRef = doc(firestore, this.PROMPTS_COLLECTION, commentData.promptId);
      
      await updateDoc(promptRef, {
        commentsCount: increment(1),
        updatedAt: now
      });

      return commentRef.id;
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error);
      throw error;
    }
  }

  /**
   * Lädt Kommentare für einen Prompt
   */
  async getPromptComments(promptId: string, maxComments: number = 0): Promise<Comment[]> {
    try {
      // Erst die Hauptkommentare (ohne parent) abrufen
      let commentsQuery = query(
        collection(firestore, this.COLLECTION_NAME),
        where('promptId', '==', promptId),
        where('parentId', '==', null),
        orderBy('createdAt', 'desc')
      );

      if (maxComments > 0) {
        commentsQuery = query(commentsQuery, firestoreLimit(maxComments));
      }

      const querySnapshot = await getDocs(commentsQuery);
      
      const comments: Comment[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return convertToComment({
          id: doc.id,
          promptId: data.promptId,
          userId: data.userId,
          authorName: data.authorName || '',
          authorImageUrl: data.authorImageUrl || '',
          text: data.text || '',
          likesCount: data.likesCount || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          parentId: data.parentId || null
        });
      });

      // Wenn keine Kommentare vorhanden sind, gib leeres Array zurück
      if (comments.length === 0) {
        return [];
      }

      // Versuche, Antworten zu laden, wenn Kommentare vorhanden sind
      try {
        // Antworten für jeden Hauptkommentar abrufen
        const commentIds = comments.map(comment => comment.id);
        
        // Alle Antworten auf einmal abrufen
        const repliesQuery = query(
          collection(firestore, this.COLLECTION_NAME),
          where('parentId', 'in', commentIds),
          orderBy('createdAt', 'asc')
        );

        const repliesSnapshot = await getDocs(repliesQuery);
        
        const replies: Comment[] = repliesSnapshot.docs.map(doc => {
          const data = doc.data();
          return convertToComment({
            id: doc.id,
            promptId: data.promptId,
            userId: data.userId,
            authorName: data.authorName || '',
            authorImageUrl: data.authorImageUrl || '',
            text: data.text || '',
            likesCount: data.likesCount || 0,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
            parentId: data.parentId || null
          });
        });

        // Antworten zu ihren Elternkommentaren zuordnen
        return comments.map(comment => {
          const commentReplies = replies.filter(reply => reply.parentId === comment.id);
          return {
            ...comment,
            replies: commentReplies
          };
        });
      } catch (error) {
        console.error('Fehler beim Laden der Antworten:', error);
        // Gib zumindest die Hauptkommentare zurück, wenn Antworten nicht geladen werden können
        return comments.map(comment => ({
          ...comment,
          replies: []
        }));
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Kommentare:', error);
      return [];
    }
  }

  /**
   * Löscht einen Kommentar
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }

      const commentRef = doc(firestore, this.COLLECTION_NAME, commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        throw new Error('Kommentar nicht gefunden');
      }

      const commentData = commentSnap.data();
      
      // Prüfe, ob der aktuelle Benutzer der Autor ist
      if (commentData.userId !== currentUser.uid) {
        throw new Error('Nicht berechtigt, diesen Kommentar zu löschen');
      }

      // Lösche den Kommentar
      await deleteDoc(commentRef);

      // Aktualisiere die Kommentaranzahl des Prompts
      const promptRef = doc(firestore, this.PROMPTS_COLLECTION, commentData.promptId);
      await updateDoc(promptRef, {
        commentsCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Kommentars:', error);
      throw error;
    }
  }
}

// Exportiere eine Singleton-Instanz
const commentService = new CommentServiceV2();
export default commentService;
