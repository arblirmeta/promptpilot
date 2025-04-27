import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage, auth } from '../config/firebase';
import { UserProfile } from '../models/UserProfile';

class UserProfileService {
  private readonly COLLECTION_NAME = 'userProfiles';
  private readonly FOLLOWING_COLLECTION = 'userFollowing';
  private readonly FOLLOWERS_COLLECTION = 'userFollowers';
  
  // Aktuellen Benutzer abrufen
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      
      return await this.getUserProfile(currentUser.uid);
    } catch (error) {
      console.error('Fehler beim Abrufen des aktuellen Benutzerprofils:', error);
      return null;
    }
  }

  // Benutzerprofil abrufen
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId: docSnap.id,
          displayName: data.displayName,
          username: data.username,
          email: data.email,
          photoURL: data.photoURL,
          bio: data.bio,
          joinDate: data.joinDate instanceof Timestamp ? data.joinDate.toDate() : data.joinDate,
          links: data.links,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          promptsCount: data.promptsCount || 0
        };
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Abrufen des Benutzerprofils:', error);
      throw error;
    }
  }

  // Benutzerprofil erstellen oder aktualisieren
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Aktualisiere bestehendes Profil
        await updateDoc(docRef, {
          ...profileData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Erstelle neues Profil
        await setDoc(docRef, {
          ...profileData,
          userId,
          joinDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          followersCount: 0,
          followingCount: 0,
          promptsCount: 0
        });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
      throw error;
    }
  }

  // Profilbild hochladen
  async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      // Erstelle einen eindeutigen Dateinamen
      const filename = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile_images/${userId}/${filename}`);
      
      // Konvertiere das Bild in ein Blob-Format
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Lade das Bild hoch
      await uploadBytes(storageRef, blob);
      
      // Hole die Download-URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Aktualisiere das Benutzerprofil mit der neuen Bild-URL
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      await updateDoc(docRef, {
        photoURL: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      return downloadURL;
    } catch (error) {
      console.error('Fehler beim Hochladen des Profilbilds:', error);
      throw error;
    }
  }

  // Benutzer folgen
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new Error('Du kannst dir nicht selbst folgen');
    }

    try {
      // Füge den Benutzer zur Liste der gefolgten Benutzer hinzu
      const followingRef = doc(firestore, this.FOLLOWING_COLLECTION, currentUserId, 'following', targetUserId);
      await setDoc(followingRef, { timestamp: serverTimestamp() });
      
      // Füge den aktuellen Benutzer zur Liste der Follower des Zielbenutzers hinzu
      const followerRef = doc(firestore, this.FOLLOWERS_COLLECTION, targetUserId, 'followers', currentUserId);
      await setDoc(followerRef, { timestamp: serverTimestamp() });
      
      // Erhöhe den Follower-Zähler des Zielbenutzers
      const targetUserRef = doc(firestore, this.COLLECTION_NAME, targetUserId);
      await updateDoc(targetUserRef, {
        followersCount: increment(1)
      });
      
      // Erhöhe den Following-Zähler des aktuellen Benutzers
      const currentUserRef = doc(firestore, this.COLLECTION_NAME, currentUserId);
      await updateDoc(currentUserRef, {
        followingCount: increment(1)
      });
    } catch (error) {
      console.error('Fehler beim Folgen des Benutzers:', error);
      throw error;
    }
  }

  // Benutzer entfolgen
  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      // Entferne den Benutzer aus der Liste der gefolgten Benutzer
      const followingRef = doc(firestore, this.FOLLOWING_COLLECTION, currentUserId, 'following', targetUserId);
      await deleteDoc(followingRef);
      
      // Entferne den aktuellen Benutzer aus der Liste der Follower des Zielbenutzers
      const followerRef = doc(firestore, this.FOLLOWERS_COLLECTION, targetUserId, 'followers', currentUserId);
      await deleteDoc(followerRef);
      
      // Verringere den Follower-Zähler des Zielbenutzers
      const targetUserRef = doc(firestore, this.COLLECTION_NAME, targetUserId);
      await updateDoc(targetUserRef, {
        followersCount: increment(-1)
      });
      
      // Verringere den Following-Zähler des aktuellen Benutzers
      const currentUserRef = doc(firestore, this.COLLECTION_NAME, currentUserId);
      await updateDoc(currentUserRef, {
        followingCount: increment(-1)
      });
    } catch (error) {
      console.error('Fehler beim Entfolgen des Benutzers:', error);
      throw error;
    }
  }

  // Prüfen, ob der aktuelle Benutzer einem anderen Benutzer folgt
  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const followingRef = doc(firestore, this.FOLLOWING_COLLECTION, currentUserId, 'following', targetUserId);
      const docSnap = await getDoc(followingRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Fehler beim Prüfen des Folge-Status:', error);
      return false;
    }
  }

  // Follower eines Benutzers abrufen
  async getUserFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const followersRef = collection(firestore, this.FOLLOWERS_COLLECTION, userId, 'followers');
      const querySnapshot = await getDocs(followersRef);
      
      const followerIds = querySnapshot.docs.map(doc => doc.id);
      
      if (followerIds.length === 0) {
        return [];
      }
      
      // Benutzerdaten für alle Follower abrufen
      const profiles: UserProfile[] = [];
      
      // Firestore unterstützt keine IN-Abfragen mit mehr als 10 Elementen
      // Daher teilen wir die Abfrage in Batches auf
      const batchSize = 10;
      for (let i = 0; i < followerIds.length; i += batchSize) {
        const batch = followerIds.slice(i, i + batchSize);
        const q = query(
          collection(firestore, this.COLLECTION_NAME),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          profiles.push({
            userId: doc.id,
            displayName: data.displayName,
            username: data.username,
            email: data.email,
            photoURL: data.photoURL,
            bio: data.bio,
            joinDate: data.joinDate instanceof Timestamp ? data.joinDate.toDate() : data.joinDate,
            links: data.links,
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            promptsCount: data.promptsCount || 0
          });
        });
      }
      
      return profiles;
    } catch (error) {
      console.error('Fehler beim Abrufen der Follower:', error);
      return [];
    }
  }

  // Benutzer, denen ein Benutzer folgt, abrufen
  async getUserFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const followingRef = collection(firestore, this.FOLLOWING_COLLECTION, userId, 'following');
      const querySnapshot = await getDocs(followingRef);
      
      const followingIds = querySnapshot.docs.map(doc => doc.id);
      
      if (followingIds.length === 0) {
        return [];
      }
      
      // Benutzerdaten für alle gefolgten Benutzer abrufen
      const profiles: UserProfile[] = [];
      
      // Firestore unterstützt keine IN-Abfragen mit mehr als 10 Elementen
      const batchSize = 10;
      for (let i = 0; i < followingIds.length; i += batchSize) {
        const batch = followingIds.slice(i, i + batchSize);
        const q = query(
          collection(firestore, this.COLLECTION_NAME),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          profiles.push({
            userId: doc.id,
            displayName: data.displayName,
            username: data.username,
            email: data.email,
            photoURL: data.photoURL,
            bio: data.bio,
            joinDate: data.joinDate instanceof Timestamp ? data.joinDate.toDate() : data.joinDate,
            links: data.links,
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            promptsCount: data.promptsCount || 0
          });
        });
      }
      
      return profiles;
    } catch (error) {
      console.error('Fehler beim Abrufen der gefolgten Benutzer:', error);
      return [];
    }
  }
}

// Importiere deleteDoc, wenn nicht bereits importiert
import { deleteDoc } from 'firebase/firestore';

export default new UserProfileService();
