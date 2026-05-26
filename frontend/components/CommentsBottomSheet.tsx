import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Analytics } from '../utils/analytics';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';

interface Author {
  id: string;
  username: string;
  avatar: string;
  name?: string;
}

interface Comment {
  id: string;
  author: Author;
  text: string;
  created_at: string;
  parent_comment_id?: string | null;
  replies_count?: number;
  total_thread_replies?: number;
  mentioned_user_ids?: string[];
}

interface MentionUser {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
}

interface CommentsBottomSheetProps {
  postId: string;
  authToken: string;
  currentUserId?: string;
  onClose: () => void;
  onCommentAdded?: () => void;
  onUserPress?: (userId: string) => void;
}

export default function CommentsBottomSheet({ postId, authToken, currentUserId, onClose, onCommentAdded, onUserPress }: CommentsBottomSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesData, setRepliesData] = useState<{ [commentId: string]: Comment[] }>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  
  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<MentionUser[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchComments();
  }, [postId, authToken]);

  // Search for users when typing @
  useEffect(() => {
    if (mentionQuery.length > 0) {
      searchUsers(mentionQuery);
    } else {
      setMentionSuggestions([]);
      setShowMentions(false);
    }
  }, [mentionQuery]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          setComments([]);
        }
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('[CommentsBottomSheet] Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (commentId: string) => {
    if (loadingReplies.has(commentId)) return;
    
    setLoadingReplies(prev => new Set(prev).add(commentId));
    
    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}/replies`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRepliesData(prev => ({ ...prev, [commentId]: data }));
        }
      }
    } catch (error) {
      console.error('[CommentsBottomSheet] Error fetching replies:', error);
    } finally {
      setLoadingReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const searchUsers = async (query: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/search/mention?q=${encodeURIComponent(query)}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMentionSuggestions(data);
        setShowMentions(data.length > 0);
      }
    } catch (error) {
      console.error('[CommentsBottomSheet] Error searching users:', error);
    }
  };

  const handleTextChange = (text: string) => {
    setNewComment(text);
    
    // Check for @ mention
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      // Only search if there's no space after @ (still typing username)
      if (!textAfterAt.includes(' ') && textAfterAt.length > 0) {
        setMentionQuery(textAfterAt);
      } else if (textAfterAt.length === 0) {
        setMentionQuery('');
        setShowMentions(false);
      } else {
        setMentionQuery('');
        setShowMentions(false);
      }
    } else {
      setMentionQuery('');
      setShowMentions(false);
    }
  };

  const insertMention = (user: MentionUser) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const newText = newComment.slice(0, lastAtIndex) + `@${user.username} `;
      setNewComment(newText);
      setMentionedUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    }
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || posting) return;

    setPosting(true);

    try {
      // Extract mentioned user IDs from the comment text
      const mentionedIds = mentionedUsers
        .filter(user => newComment.includes(`@${user.username}`))
        .map(user => user.id);

      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          text: newComment.trim(),
          parent_comment_id: replyingTo?.id || null,
          mentioned_user_ids: mentionedIds.length > 0 ? mentionedIds : null,
        }),
      });
      
      if (response.ok) {
        Analytics.postCommented(authToken, {
          post_id: postId,
          comment_length: newComment.trim().length,
          is_reply: !!replyingTo,
          mentions_count: mentionedIds.length,
        });

        setNewComment('');
        setMentionedUsers([]);
        
        if (replyingTo) {
          // Keep the replies expanded and refresh them
          const parentId = replyingTo.id;
          setExpandedReplies(prev => new Set(prev).add(parentId));
          fetchReplies(parentId);
          setReplyingTo(null);
        }
        
        fetchComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.author.username} `);
    setMentionedUsers([{ id: comment.author.id, username: comment.author.username }]);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
    setMentionedUsers([]);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deleting) return;
    
    setDeleting(commentId);
    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        // Refresh comments list
        fetchComments();
        if (onCommentAdded) {
          onCommentAdded(); // This will also refresh post comment count
        }
      } else {
        const error = await response.json();
        console.error('Error deleting comment:', error);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeleting(null);
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      if (!repliesData[commentId]) {
        fetchReplies(commentId);
      }
    }
    setExpandedReplies(newExpanded);
  };

  const formatTimeAgo = (dateString: string) => {
    // Handle UTC dates
    let date: Date;
    if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + 'Z');
    }
    
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  // Look up user by username and navigate to profile
  const handleMentionPress = async (username: string) => {
    // Remove @ symbol
    const cleanUsername = username.replace('@', '');
    
    try {
      // Search for the user
      const response = await fetch(`${API_URL}/api/users/search/mention?q=${encodeURIComponent(cleanUsername)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        if (users.length > 0 && users[0].username.toLowerCase() === cleanUsername.toLowerCase()) {
          onUserPress && onUserPress(users[0].id);
        }
      }
    } catch (error) {
      console.error('[CommentsBottomSheet] Error looking up mentioned user:', error);
    }
  };

  // Render text with highlighted and clickable @mentions
  const renderCommentText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return (
      <Text style={styles.commentText}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            return (
              <Text 
                key={index} 
                style={styles.mentionText}
                onPress={() => handleMentionPress(part)}
              >
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  const renderComment = (comment: Comment, isReply: boolean = false, depth: number = 0) => {
    const avatarUrl = comment.author?.avatar 
      ? (comment.author.avatar.startsWith('http') 
          ? comment.author.avatar 
          : `${API_URL}${comment.author.avatar}`)
      : null;
    
    // For root comments (depth=0), show total thread replies; for nested, show direct replies
    const directReplies = comment.replies_count || 0;
    const totalThreadReplies = comment.total_thread_replies || 0;
    const displayReplyCount = depth === 0 ? (directReplies + totalThreadReplies) : directReplies;
    const hasReplies = displayReplyCount > 0;
    const isExpanded = expandedReplies.has(comment.id);
    const replies = repliesData[comment.id] || [];
    const isLoadingReplies = loadingReplies.has(comment.id);
    
    // Limit nesting depth to prevent infinite nesting UI issues
    const maxDepth = 3;
    const canShowNestedReplies = depth < maxDepth;

    return (
      <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
        <TouchableOpacity 
          onPress={() => onUserPress && onUserPress(comment.author.id)}
          activeOpacity={0.7}
        >
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={[styles.commentAvatar, isReply && styles.replyAvatar]}
            />
          ) : (
            <View style={[styles.commentAvatar, styles.avatarPlaceholder, isReply && styles.replyAvatar]}>
              <Ionicons name="person" size={isReply ? 12 : 16} color="#666" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <TouchableOpacity 
              onPress={() => onUserPress && onUserPress(comment.author.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.commentUsername}>{comment.author?.username || 'Unknown'}</Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
          {renderCommentText(comment.text)}
          
          {/* Reply button */}
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={() => handleReply(comment)}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
            
            {/* Delete button - only show for comment author */}
            {currentUserId && comment.author?.id === currentUserId && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteComment(comment.id)}
                disabled={deleting === comment.id}
              >
                {deleting === comment.id ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* View replies button - show for any comment with replies (including nested ones) */}
          {canShowNestedReplies && hasReplies && (
            <TouchableOpacity 
              style={styles.viewRepliesButton}
              onPress={() => toggleReplies(comment.id)}
            >
              {isLoadingReplies ? (
                <ActivityIndicator size="small" color="#FFD700" />
              ) : (
                <>
                  <View style={styles.repliesLine} />
                  <Text style={styles.viewRepliesText}>
                    {isExpanded ? 'Hide replies' : `View ${displayReplyCount} ${displayReplyCount === 1 ? 'reply' : 'replies'}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Replies - render nested replies recursively */}
          {canShowNestedReplies && isExpanded && replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {replies.map(reply => renderComment(reply, true, depth + 1))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerHandle} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
          </View>
        ) : (
          comments.map((comment) => renderComment(comment, false, 0))
        )}
      </ScrollView>

      {/* Mention Suggestions */}
      {showMentions && mentionSuggestions.length > 0 && (
        <View style={styles.mentionSuggestionsContainer}>
          {mentionSuggestions.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.mentionSuggestionItem}
              onPress={() => insertMention(user)}
            >
              {user.avatar ? (
                <Image 
                  source={{ uri: user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}` }} 
                  style={styles.mentionAvatar}
                />
              ) : (
                <View style={[styles.mentionAvatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={12} color="#666" />
                </View>
              )}
              <View style={styles.mentionUserInfo}>
                <Text style={styles.mentionUsername}>@{user.username}</Text>
                {user.name && <Text style={styles.mentionName}>{user.name}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyIndicatorText}>
            Replying to <Text style={styles.replyIndicatorUsername}>@{replyingTo.author.username}</Text>
          </Text>
          <TouchableOpacity onPress={cancelReply}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 200 : 50}
      >
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            placeholderTextColor="#666"
            value={newComment}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newComment.trim() || posting) && styles.sendButtonDisabled
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="send" size={20} color="#000" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  headerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 4,
  },
  commentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyContainer: {
    paddingLeft: 0,
    paddingVertical: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
  commentTime: {
    color: '#666',
    fontSize: 12,
  },
  commentText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  mentionText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  replyButton: {
    marginRight: 16,
  },
  replyButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    marginRight: 16,
  },
  deleteButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  repliesLine: {
    width: 24,
    height: 1,
    backgroundColor: '#333',
    marginRight: 8,
  },
  viewRepliesText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: -48,
    paddingLeft: 48,
    borderLeftWidth: 1,
    borderLeftColor: '#222',
  },
  mentionSuggestionsContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    maxHeight: 200,
  },
  mentionSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  mentionUserInfo: {
    flex: 1,
  },
  mentionUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mentionName: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  replyIndicatorText: {
    color: '#666',
    fontSize: 13,
  },
  replyIndicatorUsername: {
    color: '#FFD700',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0c0c0c',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
});
