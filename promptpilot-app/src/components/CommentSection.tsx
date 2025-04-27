import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ProfileAvatar from './ProfileAvatar';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Comment, CommentData } from '../models/Comment';
import CommentService from '../services/CommentServiceV2';
import { auth } from '../config/firebase';

interface CommentSectionProps {
  promptId: string;
  maxComments?: number;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  promptId,
  maxComments = 5,
  showViewAll = true,
  onViewAllPress,
}) => {
  const { theme, isDark } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToUser, setReplyToUser] = useState<string>('');
  
  // Lade Kommentare
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const commentsList = await CommentService.getPromptComments(promptId, maxComments);
      setComments(commentsList);
    } catch (error) {
      console.error('Fehler beim Laden der Kommentare:', error);
    } finally {
      setIsLoading(false);
    }
  }, [promptId, maxComments]);
  
  useEffect(() => {
    loadComments();
  }, [loadComments]);
  
  // Kommentar hinzufügen
  const addComment = async () => {
    if (!newComment.trim()) return;
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Anmeldung erforderlich', 'Du musst angemeldet sein, um einen Kommentar zu schreiben.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const commentData: CommentData = {
        promptId,
        userId: currentUser.uid,
        text: newComment.trim(),
        parentId: replyTo,
      };
      
      await CommentService.addComment(commentData);
      
      // Zurücksetzen und neu laden
      setNewComment('');
      setReplyTo(null);
      setReplyToUser('');
      await loadComments();
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error);
      Alert.alert('Fehler', 'Dein Kommentar konnte nicht gespeichert werden. Bitte versuche es später erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Kommentar löschen
  const deleteComment = async (commentId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    Alert.alert(
      'Kommentar löschen',
      'Möchtest du diesen Kommentar wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await CommentService.deleteComment(commentId);
              await loadComments();
            } catch (error) {
              console.error('Fehler beim Löschen des Kommentars:', error);
              Alert.alert('Fehler', 'Der Kommentar konnte nicht gelöscht werden.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Antwort-Funktion
  const handleReply = (comment: Comment) => {
    setReplyTo(comment.id);
    setReplyToUser(comment.authorName);
    // Fokussiere das Eingabefeld
  };
  
  // Formatiere das Datum
  const formatCommentDate = (date: Date) => {
    return format(date, 'dd. MMM yyyy, HH:mm', { locale: de });
  };
  
  // Render eines einzelnen Kommentars
  const renderComment = (comment: Comment, isReply = false) => {
    const currentUser = auth.currentUser;
    const isAuthor = currentUser && currentUser.uid === comment.userId;
    
    return (
      <View 
        key={comment.id} 
        style={[
          styles.commentContainer,
          isReply && styles.replyContainer,
          { backgroundColor: isReply ? (isDark ? theme.colors.surface + '80' : theme.colors.background + '80') : undefined }
        ]}
      >
        <View style={styles.commentHeader}>
          <View style={styles.authorContainer}>
            <ProfileAvatar
              imageUrl={comment.authorImageUrl}
              size={isReply ? 32 : 40}
              fallbackInitial={comment.authorName}
            />
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>
                {comment.authorName}
              </Text>
              <Text style={[styles.commentDate, { color: theme.colors.subtext }]}>
                {formatCommentDate(comment.createdAt)}
              </Text>
            </View>
          </View>
          
          {isAuthor && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => deleteComment(comment.id)}
            >
              <MaterialCommunityIcons 
                name="delete-outline" 
                size={18} 
                color={theme.colors.error} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.commentText, { color: theme.colors.text }]}>
          {comment.text}
        </Text>
        
        <TouchableOpacity 
          style={styles.replyButton} 
          onPress={() => handleReply(comment)}
        >
          <MaterialCommunityIcons 
            name="reply" 
            size={16} 
            color={theme.colors.primary} 
          />
          <Text style={[styles.replyButtonText, { color: theme.colors.primary }]}>
            Antworten
          </Text>
        </TouchableOpacity>
        
        {/* Render child comments (replies) */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  };
  
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Kommentare
          </Text>
          <Text style={[styles.commentCount, { color: theme.colors.subtext }]}>
            {comments.length} {comments.length === 1 ? 'Kommentar' : 'Kommentare'}
          </Text>
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
        
        {/* Kommentar-Eingabefeld */}
        <View style={styles.inputContainer}>
          {replyTo && (
            <View style={[styles.replyBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.replyBadgeText, { color: theme.colors.primary }]}>
                Antwort an {replyToUser}
                <TouchableOpacity 
                  onPress={() => {
                    setReplyTo(null);
                    setReplyToUser('');
                  }}
                >
                  <MaterialCommunityIcons 
                    name="close" 
                    size={14} 
                    color={theme.colors.primary} 
                    style={styles.replyCloseIcon}
                  />
                </TouchableOpacity>
              </Text>
            </View>
          )}
          
          <View style={[styles.textInputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              placeholder="Schreibe einen Kommentar..."
              placeholderTextColor={theme.colors.placeholder}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { 
                  backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.primary + '50',
                  opacity: isSubmitting ? 0.7 : 1
                }
              ]}
              onPress={addComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size={16} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
        
        {/* Kommentarliste */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.subtext }]}>
              Kommentare werden geladen...
            </Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="comment-outline" 
              size={24} 
              color={theme.colors.subtext} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
              Sei der Erste, der einen Kommentar schreibt!
            </Text>
          </View>
        ) : (
          <View style={styles.commentsContainer}>
            {comments.map(comment => renderComment(comment))}
            
            {showViewAll && comments.length >= maxComments && (
              <TouchableOpacity 
                style={[styles.viewAllButton, { backgroundColor: theme.colors.background }]}
                onPress={onViewAllPress}
              >
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                  Alle Kommentare anzeigen
                </Text>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={16} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentCount: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  replyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  replyBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  replyCloseIcon: {
    marginLeft: 4,
  },
  textInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentsContainer: {
    marginTop: 8,
  },
  commentContainer: {
    marginBottom: 16,
  },
  replyContainer: {
    marginTop: 12,
    marginLeft: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderLeftWidth: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 8,
  },
  deleteButton: {
    padding: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});

export default CommentSection;
