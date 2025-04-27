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
  deleteDoc
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

export interface Rating {
  id?: string;
  promptId: string;
  userId: string;
  ratingValue: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

class RatingService {
  private readonly COLLECTION_NAME = 'ratings';
  private readonly PROMPTS_COLLECTION = 'prompts';

  // Bewertung für einen Prompt abgeben oder aktualisieren
  async ratePrompt(userId: string, promptId: string, ratingValue: number): Promise<void> {
    if (ratingValue < 1 || ratingValue > 5) {
      throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    }

    try {
      // Erstelle eine eindeutige ID für die Bewertung (userId_promptId)
      const ratingId = `${userId}_${promptId}`;
      const ratingRef = doc(firestore, this.COLLECTION_NAME, ratingId);
      const ratingDoc = await getDoc(ratingRef);
      
      const promptRef = doc(firestore, this.PROMPTS_COLLECTION, promptId);
      const promptDoc = await getDoc(promptRef);
      
      if (!promptDoc.exists()) {
        throw new Error('Prompt nicht gefunden');
      }
      
      const now = serverTimestamp();
      
      if (ratingDoc.exists()) {
        // Aktualisiere bestehende Bewertung
        const oldRating = ratingDoc.data().ratingValue;
        
        await updateDoc(ratingRef, {
          ratingValue,
          updatedAt: now
        });
        
        // Aktualisiere die durchschnittliche Bewertung des Prompts
        const promptData = promptDoc.data();
        const totalRatings = promptData.ratingsCount || 0;
        const currentAvgRating = promptData.averageRating || 0;
        
        if (totalRatings > 0) {
          // Berechne die neue durchschnittliche Bewertung
          const newTotalValue = (currentAvgRating * totalRatings) - oldRating + ratingValue;
          const newAvgRating = newTotalValue / totalRatings;
          
          await updateDoc(promptRef, {
            averageRating: newAvgRating,
            updatedAt: now
          });
        }
      } else {
        // Erstelle neue Bewertung
        await setDoc(ratingRef, {
          promptId,
          userId,
          ratingValue,
          createdAt: now,
          updatedAt: now
        });
        
        // Aktualisiere die durchschnittliche Bewertung und Anzahl der Bewertungen des Prompts
        const promptData = promptDoc.data();
        const totalRatings = (promptData.ratingsCount || 0) + 1;
        const currentAvgRating = promptData.averageRating || 0;
        
        // Berechne die neue durchschnittliche Bewertung
        const newTotalValue = (currentAvgRating * (totalRatings - 1)) + ratingValue;
        const newAvgRating = newTotalValue / totalRatings;
        
        await updateDoc(promptRef, {
          averageRating: newAvgRating,
          ratingsCount: increment(1),
          updatedAt: now
        });
      }
    } catch (error) {
      console.error('Fehler beim Bewerten des Prompts:', error);
      throw error;
    }
  }

  // Bewertung eines Benutzers für einen Prompt abrufen
  async getUserRating(userId: string, promptId: string): Promise<Rating | null> {
    try {
      const ratingId = `${userId}_${promptId}`;
      const ratingRef = doc(firestore, this.COLLECTION_NAME, ratingId);
      const ratingDoc = await getDoc(ratingRef);
      
      if (ratingDoc.exists()) {
        const data = ratingDoc.data();
        return {
          id: ratingDoc.id,
          promptId: data.promptId,
          userId: data.userId,
          ratingValue: data.ratingValue,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertung:', error);
      throw error;
    }
  }

  // Bewertung löschen
  async deleteRating(userId: string, promptId: string): Promise<void> {
    try {
      const ratingId = `${userId}_${promptId}`;
      const ratingRef = doc(firestore, this.COLLECTION_NAME, ratingId);
      const ratingDoc = await getDoc(ratingRef);
      
      if (!ratingDoc.exists()) {
        throw new Error('Bewertung nicht gefunden');
      }
      
      const ratingValue = ratingDoc.data().ratingValue;
      
      // Lösche die Bewertung
      await deleteDoc(ratingRef);
      
      // Aktualisiere die durchschnittliche Bewertung des Prompts
      const promptRef = doc(firestore, this.PROMPTS_COLLECTION, promptId);
      const promptDoc = await getDoc(promptRef);
      
      if (promptDoc.exists()) {
        const promptData = promptDoc.data();
        const totalRatings = promptData.ratingsCount || 0;
        
        if (totalRatings > 1) {
          // Berechne die neue durchschnittliche Bewertung
          const currentAvgRating = promptData.averageRating || 0;
          const newTotalValue = (currentAvgRating * totalRatings) - ratingValue;
          const newAvgRating = newTotalValue / (totalRatings - 1);
          
          await updateDoc(promptRef, {
            averageRating: newAvgRating,
            ratingsCount: increment(-1),
            updatedAt: serverTimestamp()
          });
        } else if (totalRatings === 1) {
          // Wenn dies die einzige Bewertung war, setze die durchschnittliche Bewertung zurück
          await updateDoc(promptRef, {
            averageRating: 0,
            ratingsCount: 0,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Bewertung:', error);
      throw error;
    }
  }

  // Alle Bewertungen für einen Prompt abrufen
  async getPromptRatings(promptId: string): Promise<Rating[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION_NAME),
        where('promptId', '==', promptId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          promptId: data.promptId,
          userId: data.userId,
          ratingValue: data.ratingValue,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Bewertungen:', error);
      return [];
    }
  }

  // Top bewertete Prompts abrufen
  async getTopRatedPrompts(limit: number = 10): Promise<any[]> {
    try {
      // Vereinfachte Abfrage, um Index-Fehler zu vermeiden
      const q = query(
        collection(firestore, this.PROMPTS_COLLECTION),
        where('isPublic', '==', true),
        orderBy('averageRating', 'desc'),
        firestoreLimit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        };
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der top bewerteten Prompts:', error);
      return [];
    }
  }
}

export default new RatingService();
