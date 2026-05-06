import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Dimensions,
  ImageBackground,
  Share,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  X,
  Plus,
  ChevronRight,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useToast } from "../components/Toast";
import { useLanguage } from "../context/LanguageContext";
import { getFeed, toggleLike, addComment } from "../services/socialService";
import { Post, PostComment } from "../types";
import { SPACING, RADIUS, BRAND } from "../theme/colors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getAvatarUrl, getImageUrl } from "../api/apiClient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = 42;

export default function FeedScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { colors } = useTheme();
  const { user } = useUser();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [commentModal, setCommentModal] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFeed();
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, []);

  const loadFeed = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const data = await getFeed(pageNum, 20);
      if (append) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (error: any) {
      showToast(error.message || "Error al cargar el feed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(1, false);
  }, []);

  const onEndReached = () => {
    if (hasMore && !loading) {
      loadFeed(page + 1, true);
    }
  };

  const handleLike = async (post: Post) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          return {
            ...p,
            isLikedByCurrentUser: !p.isLikedByCurrentUser,
            likeCount: p.isLikedByCurrentUser
              ? p.likeCount - 1
              : p.likeCount + 1,
          };
        }
        return p;
      }),
    );
    try {
      await toggleLike(post.id);
    } catch (error: any) {
      // Revert
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id) {
            return {
              ...p,
              isLikedByCurrentUser: post.isLikedByCurrentUser,
              likeCount: post.likeCount,
            };
          }
          return p;
        }),
      );
      showToast("Error al dar like", "error");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !commentModal) return;
    setSendingComment(true);
    try {
      const newComment = await addComment(commentModal.id, commentText.trim());
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === commentModal.id) {
            return {
              ...p,
              commentCount: p.commentCount + 1,
              recentComments: [...p.recentComments, newComment],
            };
          }
          return p;
        }),
      );
      setCommentText("");
      showToast("Comentario agregado", "success");
    } catch (error: any) {
      showToast(error.message || "Error al comentar", "error");
    } finally {
      setSendingComment(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `${diffMin}m`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d`;
    return date.toLocaleDateString();
  };

  const handleShare = async (item: Post) => {
    try {
      const message = `Mira este post de ${item.userFullName} en Fitzone:\n${item.content || "Entrenamiento increíble"}`;
      await Share.share({
        message,
      });
    } catch (error: any) {
      showToast("Error al compartir", "error");
    }
  };

  const isDark = colors.background !== "#F8FAFC";

  const renderPost = ({ item }: { item: Post }) => {
    const hasImage = !!item.imageUrl;
    const CARD_WIDTH = width - SPACING.md * 2;

    return (
      <Animated.View
        style={[
          styles.postCard,
          {
            backgroundColor: hasImage ? "#000" : colors.card,
            borderColor: isDark ? colors.card : colors.border,
            borderWidth: hasImage ? 0 : 1,
          },
        ]}
      >
        {hasImage ? (
          <View style={{ width: "100%", minHeight: 450, backgroundColor: "#000", overflow: "hidden", borderRadius: 16 }}>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false} 
              style={{ flex: 1 }}
            >
              {/* Slide 1: Photo */}
              <ImageBackground
                source={{ uri: getImageUrl(item.imageUrl) }}
                style={{
                  width: CARD_WIDTH,
                  height: 450,
                  justifyContent: "space-between",
                }}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.8)"]}
                  style={StyleSheet.absoluteFill}
                />
              </ImageBackground>

              {/* Slide 2: Workout Summary (if available) */}
              {item.workoutSummary && (
                <View style={{ 
                  width: CARD_WIDTH, 
                  height: 450, 
                  backgroundColor: colors.card,
                  justifyContent: "center",
                  padding: 20 
                }}>
                  <View style={[styles.workoutCard, { backgroundColor: isDark ? "#1A1A2E" : "#F0F4FF", borderWidth: 0 }]}>
                    <View style={styles.workoutCardHeader}>
                      <Text style={styles.workoutEmoji}>🏋️</Text>
                      <Text style={[styles.workoutName, { color: colors.text }]}>{item.workoutSummary.name}</Text>
                    </View>
                    <View style={styles.workoutStats}>
                      <View style={styles.workoutStat}>
                        <Text style={[styles.workoutStatValue, { color: colors.primary }]}>
                          {Math.round((item.workoutSummary.durationSeconds ?? 0) / 60)}
                        </Text>
                        <Text style={[styles.workoutStatLabel, { color: colors.textSecondary }]}>min</Text>
                      </View>
                      <View style={[styles.workoutDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.workoutStat}>
                        <Text style={[styles.workoutStatValue, { color: colors.primary }]}>{item.workoutSummary.exerciseCount ?? 0}</Text>
                        <Text style={[styles.workoutStatLabel, { color: colors.textSecondary }]}>ejercicios</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Absolute Overlaid Content (Always visible on top of slides) */}
            <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
              {/* Header */}
              <View style={[styles.postHeader, { padding: 16 }]}>
                <View style={styles.userRow}>
                  <Image
                    source={{ uri: getAvatarUrl(item.userAvatarUrl) }}
                    style={[styles.avatar, { borderColor: BRAND.primary }]}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: "#FFF", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                      {item.userFullName}
                    </Text>
                    <Text
                      style={[
                        styles.postTime,
                        { color: "rgba(255,255,255,0.9)", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
                      ]}
                    >
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
                {item.type !== "Text" && (
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <Text style={[styles.typeBadgeText, { color: "#FFF" }]}>
                      {item.type}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: SPACING.md }}>
              {item.content ? (
                <Text
                  style={[
                    styles.postContent,
                    {
                      color: "#FFF",
                      textShadowColor: "rgba(0,0,0,0.8)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                >
                  {item.content}
                </Text>
              ) : null}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLike(item)}
                  activeOpacity={0.7}
                >
                  <Heart
                    size={26}
                    color={item.isLikedByCurrentUser ? "#FF2E4D" : "#FFF"}
                    fill={item.isLikedByCurrentUser ? "#FF2E4D" : "none"}
                    style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2 }}
                  />
                  <Text style={[styles.actionCount, { color: "#FFF", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                    {item.likeCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setCommentModal(item)}
                  activeOpacity={0.7}
                >
                  <MessageCircle size={26} color="#FFF" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2 }} />
                  <Text style={[styles.actionCount, { color: "#FFF", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                    {item.commentCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => handleShare(item)}>
                  <Share2 size={24} color="#FFF" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2 }} />
                </TouchableOpacity>
              </View>

              {(item?.recentComments?.length ?? 0) > 0 && (
                <View style={{ paddingHorizontal: SPACING.md }}>
                  {(item?.recentComments ?? []).slice(0, 2).map((c) => (
                    <View key={c.id} style={styles.commentRow}>
                      <Text style={[styles.commentAuthor, { color: "#FFF", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                        {c.userFullName}
                      </Text>
                      <Text
                        style={[
                          styles.commentText,
                          { color: "rgba(255,255,255,0.9)", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
                        ]}
                        numberOfLines={1}
                      >
                        {c.content}
                      </Text>
                    </View>
                  ))}
                  {item.commentCount > 2 && (
                    <TouchableOpacity onPress={() => setCommentModal(item)}>
                      <Text
                        style={[
                          styles.viewAllComments,
                          { color: "rgba(255,255,255,0.8)", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
                        ]}
                      >
                        Ver los {item.commentCount} comentarios
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View>
            {/* Header */}
            <View style={styles.postHeader}>
              <View style={styles.userRow}>
                <Image
                  source={{ uri: getAvatarUrl(item.userAvatarUrl) }}
                  style={[styles.avatar, { borderColor: colors.primary }]}
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {item.userFullName}
                  </Text>
                  <Text
                    style={[styles.postTime, { color: colors.textSecondary }]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
              {item.type !== "Text" && (
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text
                    style={[styles.typeBadgeText, { color: colors.primary }]}
                  >
                    {item.type}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            {item.content ? (
              <Text style={[styles.postContent, { color: colors.text }]}>
                {item.content}
              </Text>
            ) : null}

            {/* Workout Summary Card */}
            {item.workoutSummary ? (
              <View
                style={[
                  styles.workoutCard,
                  { backgroundColor: isDark ? "#1A1A2E" : "#F0F4FF" },
                ]}
              >
                <View style={styles.workoutCardHeader}>
                  <Text style={styles.workoutEmoji}>🏋️</Text>
                  <Text style={[styles.workoutName, { color: colors.text }]}>
                    {item.workoutSummary.name}
                  </Text>
                </View>
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStat}>
                    <Text
                      style={[
                        styles.workoutStatValue,
                        { color: colors.primary },
                      ]}
                    >
                      {Math.round(
                        (item?.workoutSummary?.durationSeconds ?? 0) / 60,
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.workoutStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      min
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.workoutDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.workoutStat}>
                    <Text
                      style={[
                        styles.workoutStatValue,
                        { color: colors.primary },
                      ]}
                    >
                      {item?.workoutSummary?.exerciseCount ?? 0}
                    </Text>
                    <Text
                      style={[
                        styles.workoutStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ejercicios
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.workoutDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.workoutStat}>
                    <Text
                      style={[
                        styles.workoutStatValue,
                        { color: colors.primary },
                      ]}
                    >
                      {item?.workoutSummary?.totalSets ?? 0}
                    </Text>
                    <Text
                      style={[
                        styles.workoutStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      sets
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleLike(item)}
                activeOpacity={0.7}
              >
                <Heart
                  size={22}
                  color={
                    item.isLikedByCurrentUser ? "#FF2E4D" : colors.textSecondary
                  }
                  fill={item.isLikedByCurrentUser ? "#FF2E4D" : "none"}
                />
                <Text
                  style={[
                    styles.actionCount,
                    {
                      color: item.isLikedByCurrentUser
                        ? "#FF2E4D"
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {item.likeCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setCommentModal(item)}
                activeOpacity={0.7}
              >
                <MessageCircle size={22} color={colors.textSecondary} />
                <Text
                  style={[styles.actionCount, { color: colors.textSecondary }]}
                >
                  {item.commentCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => handleShare(item)}>
                <Share2 size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Recent comments preview */}
            {(item?.recentComments?.length ?? 0) > 0 && (
              <View
                style={[
                  styles.commentsPreview,
                  { borderTopColor: colors.border },
                ]}
              >
                {(item?.recentComments ?? []).slice(0, 2).map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <Text
                      style={[styles.commentAuthor, { color: colors.text }]}
                    >
                      {c.userFullName}
                    </Text>
                    <Text
                      style={[
                        styles.commentText,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {c.content}
                    </Text>
                  </View>
                ))}
                {item.commentCount > 2 && (
                  <TouchableOpacity onPress={() => setCommentModal(item)}>
                    <Text
                      style={[
                        styles.viewAllComments,
                        { color: colors.primary },
                      ]}
                    >
                      Ver los {item.commentCount} comentarios
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📱</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Tu feed está vacío
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Sigue amigos y comparte tus entrenos para ver contenido aquí
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("Friends")}
      >
        <Text style={styles.emptyBtnText}>Buscar amigos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {!hideHeader && (
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Image
            source={require("../assets/Logotipo.png")}
            style={[
              styles.headerLogo,
              { transform: [{ scale: 2.4 }], marginLeft: 32 },
            ]}
            tintColor={colors.text}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("CreatePost")}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando feed...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            posts.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <ActivityIndicator
                style={{ marginVertical: 20 }}
                color={colors.primary}
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={5}
          windowSize={7}
          initialNumToRender={5}
        />
      )}

      {/* Create Post FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <Text style={{ fontSize: 24, color: "#FFF", fontWeight: "bold" }}>+</Text>
      </TouchableOpacity>

      {/* Comment Modal */}
      <Modal visible={!!commentModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.commentSheet, { backgroundColor: colors.card }]}>
            <View style={styles.commentSheetHeader}>
              <Text style={[styles.commentSheetTitle, { color: colors.text }]}>
                Comentarios
              </Text>
              <TouchableOpacity onPress={() => setCommentModal(null)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentModal?.recentComments || []}
              keyExtractor={(c) => c.id}
              style={{ flex: 1 }}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text
                    style={[
                      styles.noCommentsText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Sé el primero en comentar
                  </Text>
                </View>
              }
              renderItem={({ item: c }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{ uri: getAvatarUrl(c.userAvatarUrl) }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text
                      style={[styles.commentAuthorFull, { color: colors.text }]}
                    >
                      {c.userFullName}
                    </Text>
                    <Text
                      style={[
                        styles.commentBody,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {c.content}
                    </Text>
                    <Text
                      style={[
                        styles.commentTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatTime(c.createdAt)}
                    </Text>
                  </View>
                </View>
              )}
            />

            <View
              style={[
                styles.commentInputRow,
                { borderTopColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? "#1A1A2E" : "#F1F5F9",
                  },
                ]}
                placeholder="Escribe un comentario..."
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: commentText.trim()
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={handleComment}
                disabled={!commentText.trim() || sendingComment}
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Send size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm, // Reduced padding since it's nested
  },
  headerLogo: {
    width: 100,
    height: 30,
    alignSelf: "center",
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
  },
  userInfo: {
    marginLeft: SPACING.sm,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  postImage: {
    width: "100%",
    height: 280,
  },
  workoutCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  workoutCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  workoutEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: "700",
  },
  workoutStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  workoutStat: {
    alignItems: "center",
    flex: 1,
  },
  workoutStatValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  workoutStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  workoutDivider: {
    width: 1,
    height: 30,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  commentsPreview: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    marginRight: 6,
  },
  commentText: {
    fontSize: 13,
    flex: 1,
  },
  viewAllComments: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
  },
  emptyBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentSheet: {
    height: "70%",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.md,
  },
  commentSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  commentSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  noComments: {
    padding: 40,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 14,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthorFull: {
    fontSize: 13,
    fontWeight: "700",
  },
  commentBody: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 11,
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
});
