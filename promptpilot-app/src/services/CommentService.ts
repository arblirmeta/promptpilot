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
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  deleteDoc,
  addDoc,
  runTransaction,
  writeBatch,
  FieldValue
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Comment, CommentData, convertToComment } from '../models/Comment';
import UserProfileService from './UserProfileService';

class CommentService {
  private readonly COLLECTION_NAME = 'comments';
  private readonly PROMPTS_COLLECTION = 'prompts';

  // Kommentar hinzufügen
  async addComment(commentData: CommentData): Promise<string> {
    try {
      const currentUser = await UserProfileService.getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }

      const now = serverTimestamp();

      // Erstellen des vollständigen Kommentar-Objekts
      const newComment = {
        promptId: commentData.promptId,
        userId: commentData.userId,
        authorName: currentUser.displayName || 'Unbekannter Nutzer',
        authorImageUrl: currentUser.photoURL || '',
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

  // Kommentar aktualisieren
  async updateComment(commentId: string, text: string): Promise<void> {
    try {
      const commentRef = doc(firestore, this.COLLECTION_NAME, commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        throw new Error('Kommentar nicht gefunden');
      }

      const commentData = commentSnap.data();
      const currentUser = await UserProfileService.getCurrentUserProfile();

      // Überprüfen, ob der Benutzer der Autor des Kommentars ist
      if (currentUser?.userId !== commentData.userId) {
        throw new Error('Nicht berechtigt, diesen Kommentar zu bearbeiten');
      }

      await updateDoc(commentRef, {
        text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Kommentars:', error);
      throw error;
    }
  }

  // Kommentar löschen
  async deleteComment(commentId: string): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      const commentRef = doc(firestore, this.COLLECTION_NAME, commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        throw new Error('Kommentar nicht gefunden');
      }

      const commentData = commentSnap.data();
      const promptId = commentData.promptId;
      const parentId = commentData.parentId;
      const currentUser = await UserProfileService.getCurrentUserProfile();

      // Überprüfen, ob der Benutzer der Autor des Kommentars ist
      if (currentUser?.userId !== commentData.userId) {
        throw new Error('Nicht berechtigt, diesen Kommentar zu löschen');
      }

      // Rufe alle Antworten (Replies) zu diesem Kommentar ab
      const repliesQuery = query(
        collection(firestore, this.COLLECTION_NAME),
        where('parentId', '==', commentId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      const repliesCount = repliesSnapshot.size;

      // Lösche alle Antworten
      repliesSnapshot.forEach(replyDoc => {
        batch.delete(doc(firestore, this.COLLECTION_NAME, replyDoc.id));
      });

      // Lösche den Hauptkommentar
      batch.delete(commentRef);

      // Aktualisiere die Kommentaranzahl des Prompts
      const promptRef = doc(firestore, this.PROMPTS_COLLECTION, promptId);
      // +1 für den Hauptkommentar selbst
      const decrementValue = repliesCount + 1;
      
      batch.update(promptRef, {
        commentsCount: increment(-decrementValue),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error('Fehler beim Löschen des Kommentars:', error);
      throw error;
    }
  }

  // Einen einzelnen Kommentar abrufen
  async getComment(commentId: string): Promise<Comment | null> {
    try {
      const commentRef = doc(firestore, this.COLLECTION_NAME, commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        return null;
      }

      const data = commentSnap.data();
      return convertToComment({
        id: commentSnap.id,
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
    } catch (error) {
      console.error('Fehler beim Abrufen des Kommentars:', error);
      return null;
    }
  }

  // Alle Kommentare für einen Prompt abrufen
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
        commentsQuery = query(commentsQuery, limit(maxComments));
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

      // Antworten für jeden Hauptkommentar abrufen
      const commentIds = comments.map(comment => comment.id);
      
      if (commentIds.length === 0) {
        return [];
      }

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
      const commentsWithReplies = comments.map(comment => {
        const commentReplies = replies.filter(reply => reply.parentId === comment.id);
        return {
          ...comment,
          replies: commentReplies
        };
      });

      return commentsWithReplies;
    } catch (error) {
      console.error('Fehler beim Abrufen der Kommentare:', error);
      return [];
    }
  }

  // Like für einen Kommentar hinzufügen/entfernen
  async toggleLike(userId: string, commentId: string): Promise<boolean> {
    try {
      const likeId = `${userId}_${commentId}`;
      const likeRef = doc(firestore, 'commentLikes', likeId);
      const likeSnap = await getDoc(likeRef);
      
      const commentRef = doc(firestore, this.COLLECTION_NAME, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Kommentar nicht gefunden');
      }
      
      // Führe die Operation als Transaktion aus, um Race Conditions zu vermeiden
      return await runTransaction(firestore, async (transaction) => {
        if (likeSnap.exists()) {
          // Like entfernen
          transaction.delete(likeRef);
          transaction.update(commentRef, {
            likesCount: increment(-1)
          });
          return false; // Nicht mehr geliked
        } else {
          // Like hinzufügen
          transaction.set(likeRef, {
            userId,
            commentId,
            createdAt: serverTimestamp()
          });
          transaction.update(commentRef, {
            likesCount: increment(1)
          });
          return true; // Jetzt geliked
        }
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Likes:', error);
      throw error;
    }
  }

  // Prüfen, ob ein Benutzer einen Kommentar geliked hat
  async hasUserLiked(userId: string, commentId: string): Promise<boolean> {
    try {
      const likeId = `${userId}_${commentId}`;
      const likeRef = doc(firestore, 'commentLikes', likeId);
      const likeSnap = await getDoc(likeRef);
      
      return likeSnap.exists();
    } catch (error) {
      console.error('Fehler beim Prüfen des Likes:', error);
      return false;
    }
  }
}

// Exportiere eine Instanz des CommentService
export default new CommentService();
