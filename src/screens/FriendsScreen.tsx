import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Search,
  UserPlus,
  UserCheck,
  Clock,
  UserX,
  X,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useToast } from "../components/Toast";
import {
  getFriends,
  searchFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  followUser,
  unfollowUser,
} from "../services/socialService";
import { FriendDto, FriendSearchResult } from "../types";
import { SPACING, RADIUS } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAvatarUrl } from "../api/apiClient";

type Tab = "friends" | "requests" | "search";

export default function FriendsScreen({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  const { colors } = useTheme();
  const { user } = useUser();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isDark = colors.background !== "#F8FAFC";

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await getFriends();
      setFriends(data);
    } catch (error: any) {
      showToast(error.message || "Error al cargar amigos", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFriends();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await searchFriends(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await sendFriendRequest(userId);
      showToast("Solicitud enviada", "success");
      // Update search results optimistically
      setSearchResults((prev) =>
        prev.map((r) =>
          r.userId === userId ? { ...r, friendshipStatus: "Pending" } : r,
        ),
      );
      await loadFriends();
    } catch (error: any) {
      showToast(error.message || "Error al enviar solicitud", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      showToast("Solicitud aceptada", "success");
      await loadFriends();
    } catch (error: any) {
      showToast(error.message || "Error al aceptar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      await rejectFriendRequest(friendshipId);
      showToast("Solicitud rechazada", "info");
      await loadFriends();
    } catch (error: any) {
      showToast(error.message || "Error al rechazar", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    setActionLoading(userId + "_follow");
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      setSearchResults((prev) =>
        prev.map((r) =>
          r.userId === userId ? { ...r, isFollowing: !isFollowing } : r,
        ),
      );
    } catch (error: any) {
      showToast(error.message || "Error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const acceptedFriends = friends.filter((f) => f.status === "Accepted");
  const pendingRequests = friends.filter(
    (f) => f.status === "Pending" && !f.isRequester,
  );
  const sentRequests = friends.filter(
    (f) => f.status === "Pending" && f.isRequester,
  );

  const renderSearchItem = ({ item }: { item: FriendSearchResult }) => {
    const status = item.friendshipStatus;
    const isActionLoading =
      actionLoading === item.userId ||
      actionLoading === item.userId + "_follow";

    return (
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? colors.card : colors.border,
          },
        ]}
      >
        <Image
          source={{ uri: getAvatarUrl(item.avatarUrl) }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.fullName}
          </Text>
          <View style={styles.statRow}>
            <Text style={[styles.streak, { color: colors.primary }]}>
              🔥 {item.streak}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {/* Follow/Unfollow button */}
          <TouchableOpacity
            style={[
              styles.followBtn,
              {
                backgroundColor: item.isFollowing
                  ? "transparent"
                  : colors.primary + "20",
                borderColor: colors.primary,
                borderWidth: item.isFollowing ? 1 : 0,
              },
            ]}
            onPress={() => handleFollowToggle(item.userId, item.isFollowing)}
            disabled={isActionLoading}
          >
            <Text style={[styles.followBtnText, { color: colors.primary }]}>
              {item.isFollowing ? "Siguiendo" : "Seguir"}
            </Text>
          </TouchableOpacity>

          {/* Friend button */}
          {status === "Accepted" ? (
            <View
              style={[styles.statusBadge, { backgroundColor: "#05966920" }]}
            >
              <UserCheck size={14} color="#059669" />
              <Text style={[styles.statusText, { color: "#059669" }]}>
                Amigos
              </Text>
            </View>
          ) : status === "Pending" ? (
            <View
              style={[styles.statusBadge, { backgroundColor: "#D9770620" }]}
            >
              <Clock size={14} color="#D97706" />
              <Text style={[styles.statusText, { color: "#D97706" }]}>
                Pendiente
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleSendRequest(item.userId)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <UserPlus size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: FriendDto }) => (
    <View
      style={[
        styles.userCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.card : colors.border,
        },
      ]}
    >
      <Image
        source={{ uri: getAvatarUrl(item.avatarUrl) }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.fullName}
        </Text>
        <Text style={[styles.streak, { color: colors.primary }]}>
          🔥 {item.streak} días
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: "#05966920" }]}>
        <UserCheck size={14} color="#059669" />
        <Text style={[styles.statusText, { color: "#059669" }]}>Amigos</Text>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: FriendDto }) => {
    const isLoading = actionLoading === item.friendshipId;
    return (
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? colors.card : colors.border,
          },
        ]}
      >
        <Image
          source={{ uri: getAvatarUrl(item.avatarUrl) }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Quiere ser tu amigo
          </Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAccept(item.friendshipId)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.acceptBtnText}>Aceptar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectBtn, { borderColor: colors.border }]}
            onPress={() => handleReject(item.friendshipId)}
            disabled={isLoading}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      {!hideHeader && (
        <>
          <View
        style={[
          styles.searchBar,
          { backgroundColor: isDark ? "#1A1A2E" : "#F1F5F9" },
        ]}
      >
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar personas..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setTab("search")}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setSearchResults([]);
              setTab("friends");
            }}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      {tab !== "search" && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === "friends" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setTab("friends")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    tab === "friends" ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              Amigos ({acceptedFriends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === "requests" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setTab("requests")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    tab === "requests" ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              Solicitudes{" "}
              {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </>
      )}

      {/* Content */}
      {loading && tab !== "search" ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab === "search" ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searchQuery.length >= 2 ? (
              <View style={styles.emptyState}>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No se encontraron usuarios
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Escribe al menos 2 caracteres para buscar
                </Text>
              </View>
            )
          }
        />
      ) : tab === "friends" ? (
        <FlatList
          data={acceptedFriends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.friendshipId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={[styles.emptyTitle2, { color: colors.text }]}>
                Sin amigos aún
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Busca personas y envía solicitudes de amistad
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={[...pendingRequests, ...sentRequests]}
          renderItem={({ item }) =>
            item.isRequester ? (
              <View
                style={[
                  styles.userCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? colors.card : colors.border,
                  },
                ]}
              >
                <Image
                  source={{ uri: getAvatarUrl(item.avatarUrl) }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {item.fullName}
                  </Text>
                  <Text
                    style={[styles.subText, { color: colors.textSecondary }]}
                  >
                    Solicitud enviada
                  </Text>
                </View>
                <View
                  style={[styles.statusBadge, { backgroundColor: "#D9770620" }]}
                >
                  <Clock size={14} color="#D97706" />
                  <Text style={[styles.statusText, { color: "#D97706" }]}>
                    Pendiente
                  </Text>
                </View>
              </View>
            ) : (
              renderRequestItem({ item })
            )
          }
          keyExtractor={(item) => item.friendshipId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📨</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Sin solicitudes pendientes
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  badge: {
    marginLeft: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 15,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  tab: {
    paddingVertical: SPACING.sm,
    marginRight: SPACING.lg,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
  },
  streak: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acceptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  acceptBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle2: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
