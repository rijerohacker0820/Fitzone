import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronLeft,
  Camera,
  User,
  LogOut,
  Trash2,
  Shield,
  Bell,
  Search,
  Users,
  X,
  UserPlus,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useSquads } from "../context/SquadContext";
import { RootStackParamList } from "../navigation/types";
import { useToast } from "../components/Toast";

type SquadSettingsNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "SquadSettings"
>;
type SquadSettingsRouteProp = RouteProp<RootStackParamList, "SquadSettings">;

interface SquadMember {
  id: string;
  name: string;
  avatarColor: string;
  role: "Admin" | "Member";
  isCurrentUser?: boolean;
  profileImage?: string;
}

import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { searchUsers } from "../services/userService";
import { getFriends } from "../services/socialService";
import { UserProfile, FriendDto } from "../types";
import { addMemberToGroup, getGroupMembers, leaveGroup, removeMemberFromGroup, updateGroup, getGroupRequests, approveGroupRequest } from "../services/groupService";
import { getImageUrl, getAvatarUrl } from "../api/apiClient";
import { uploadImage } from "../services/uploadService";

export default function SquadSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<SquadSettingsNavProp>();
  const route = useRoute<SquadSettingsRouteProp>();
  const { squadId } = route.params;
  const { getSquad, updateSquad, refreshSquads } = useSquads();
  const { user } = useUser();
  const squad = getSquad(squadId);

  // Local State for editing
  const [name, setName] = useState(squad?.name || "");
  const [icon, setIcon] = useState(squad?.icon || "👥");
  const [image, setImage] = useState<string | null>(squad?.image || null);
  const [isPublic, setIsPublic] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendDto[]>([]);
  const [friendsList, setFriendsList] = useState<FriendDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  // Load friends when modal opens
  useEffect(() => {
    if (addMemberModalVisible) {
      const loadFriends = async () => {
        setIsSearching(true);
        try {
          const friends = await getFriends();
          setFriendsList(friends);
          setSearchResults(friends.filter((f) => !squadMembers.some((m) => m.id === f.userId)));
        } catch (error) {
          showToast("Error loading friends", "error");
        } finally {
          setIsSearching(false);
        }
      };
      loadFriends();
    }
  }, [addMemberModalVisible]);

  // Filter friends locally based on search query
  useEffect(() => {
    if (!addMemberModalVisible) return;
    
    if (userSearchQuery.trim()) {
      const lowerQuery = userSearchQuery.toLowerCase();
      const filtered = friendsList.filter(
        (f) =>
          f.fullName.toLowerCase().includes(lowerQuery) &&
          !squadMembers.some((m) => m.id === f.userId)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(friendsList.filter((f) => !squadMembers.some((m) => m.id === f.userId)));
    }
  }, [userSearchQuery, friendsList, squadMembers, addMemberModalVisible]);

  const handleAddMember = async (userId: string) => {
    setIsAddingUser(userId);
    try {
      await addMemberToGroup(squadId, userId);
      Alert.alert("Success", "Member added successfully");
      setAddMemberModalVisible(false);
      // In a real app we would want to refresh the squad squadMembers list here
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add member");
    } finally {
      setIsAddingUser(null);
    }
  };

  // Sync with context if it changes from outside (unlikely while focused here but good practice)
  useEffect(() => {
    if (squad) {
      setName(squad.name);
      setIcon(squad.icon || "👥");
      setImage(squad.image);
    }
  }, [squad]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const fetchedMembers = await getGroupMembers(squadId);
        const colors = [
          "#FCA5A5",
          "#93C5FD",
          "#FCD34D",
          "#86EFAC",
          "#C4B5FD",
          "#FDBA74",
        ];

        const mappedMembers: SquadMember[] = fetchedMembers.map(
          (m: any, i: number) => ({
            id: m.userId || m.id,
            name: m.fullName || m.name,
            avatarColor: colors[i % colors.length],
            role: m.role,
            isCurrentUser: (m.userId || m.id) === user?.id,
            profileImage: m.avatarUrl || m.profileImage || undefined,
            streak: m.streak,
          }),
        );

        // Sort admin/current user to top
        mappedMembers.sort((a, b) => {
          if (a.role === "Admin" && b.role !== "Admin") return -1;
          if (b.role === "Admin" && a.role !== "Admin") return 1;
          if (a.isCurrentUser && !b.isCurrentUser) return -1;
          if (b.isCurrentUser && !a.isCurrentUser) return 1;
          return 0;
        });

        setSquadMembers(mappedMembers);
        
        // Fetch join requests if user is Admin
        if (mappedMembers.find((m) => m.isCurrentUser)?.role === "Admin") {
          const reqs = await getGroupRequests(squadId);
          setJoinRequests(reqs);
        }
      } catch (error) {
        console.error("Failed to load squadMembers", error);
      }
    };

    fetchMembers();
  }, [squadId, addMemberModalVisible]); // Refresh squadMembers when modal closes!

  const handleApproveRequest = async (userId: string) => {
    try {
      await approveGroupRequest(squadId, userId);
      setJoinRequests((prev) => prev.filter((r) => r.userId !== userId));
      showToast("Solicitud aprobada", "success");
      // Could re-fetch members here
      const fetchedMembers = await getGroupMembers(squadId);
      // Map and sort members...
      // For simplicity, relying on the user pulling to refresh or reloading the screen to see them in participants list.
    } catch (e: any) {
      showToast("Error al aprobar solicitud", "error");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let imageUrl = image;
      // If image is a local URI (from picker), upload it first
      if (image && (image.startsWith("file://") || image.startsWith("content://"))) {
        imageUrl = await uploadImage(image);
      }

      await updateGroup(squadId, {
        name,
        isPublic,
        imageUrl: imageUrl || undefined,
      });

      updateSquad(squadId, {
        name,
        icon,
        image: imageUrl || null,
      });

      showToast("Grupo actualizado con éxito", "success");
      navigation.goBack();
    } catch (e: any) {
      showToast(e.message || "No se pudo guardar la configuración", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveSquad = () => {
    Alert.alert(t("leaveSquad"), t("leaveSquadMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("leave"),
        style: "destructive",
        onPress: async () => {
          try {
            await leaveGroup(squadId);
            await refreshSquads();
            showToast("Has salido del grupo", "info");
            navigation.navigate("MainTabs");
          } catch (e: any) {
            showToast(e.message || "Error al salir del grupo", "error");
          }
        },
      },
    ]);
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert("Eliminar Miembro", "¿Estás seguro de eliminar a este participante?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await removeMemberFromGroup(squadId, memberId);
            setSquadMembers((prev) => prev.filter((m) => m.id !== memberId));
            showToast("Miembro eliminado", "success");
          } catch (e: any) {
            showToast(e.message || "Error al eliminar miembro", "error");
          }
        },
      },
    ]);
  };

  const handleImageSelection = () => {
    if (Platform.OS === "web") {
      pickImage();
      return;
    }
    Alert.alert(t("squadPhoto"), t("chooseOption"), [
      { text: t("camera"), onPress: takePhoto },
      { text: t("gallery"), onPress: pickImage },
      {
        text: t("removePhoto"),
        style: "destructive",
        onPress: () => setImage(null),
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(t("permissionRequired"), t("cameraRollPermissionMsg"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(t("error"), t("errorPickImage"));
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(t("permissionRequired"), t("cameraPermissionMsg"));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert(t("error"), t("errorTakePhoto"));
    }
  };

  if (!squad) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 20,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginLeft: -8 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
          {t("squadSettings")}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={{
                color: colors.primary,
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {t("save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Visual Identity Section */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <TouchableOpacity
            onPress={handleImageSelection}
            style={{ position: "relative" }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 30,
                backgroundColor: colors.card,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {image ? (
                <Image
                  source={{ uri: getImageUrl(image) }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <TextInput
                  value={icon}
                  onChangeText={setIcon}
                  placeholder="😊"
                  maxLength={2}
                  style={{
                    fontSize: 48,
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                  }}
                />
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                backgroundColor: colors.primary,
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.card,
              }}
            >
              <Camera size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text
            style={{
              marginTop: 12,
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {t("tapToEditIcon")}
          </Text>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("general").toUpperCase()}</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("squadName")}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[styles.input, { color: colors.text }]}
                placeholder={t("squadName")}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.row}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Shield size={20} color="#64748B" style={{ marginRight: 12 }} />
                <Text style={styles.rowText}>{t("publicSquad")}</Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                thumbColor={isPublic ? "#2563EB" : "#F1F5F9"}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.row}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Bell size={20} color="#64748B" style={{ marginRight: 12 }} />
                <Text style={styles.rowText}>{t("notifications")}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                thumbColor={notificationsEnabled ? "#2563EB" : "#F1F5F9"}
              />
            </View>
          </View>
        </View>

        {/* Requests (Only for Admin) */}
        {joinRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              SOLICITUDES PENDIENTES ({joinRequests.length})
            </Text>
            <View style={styles.card}>
              {joinRequests.map((req, index) => (
                <View key={req.userId || req.id}>
                  <View style={styles.memberRow}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#3B82F6",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                          overflow: "hidden",
                        }}
                      >
                        {req.avatarUrl ? (
                          <Image
                            source={{ uri: getAvatarUrl(req.avatarUrl) }}
                            style={{ width: "100%", height: "100%" }}
                          />
                        ) : (
                          <Text style={{ fontSize: 16 }}>😊</Text>
                        )}
                      </View>
                      <View>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {req.fullName || req.name}
                        </Text>
                        <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                          Desea unirse
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleApproveRequest(req.userId || req.id)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 12 }}>
                        Aprobar
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {index < joinRequests.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Participants */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={styles.sectionTitle}>
              {t("participants").toUpperCase()} ({squadMembers.length})
            </Text>
            {squadMembers.find((m) => m.isCurrentUser)?.role === "Admin" && (
              <TouchableOpacity
                onPress={() => setAddMemberModalVisible(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 4,
                }}
              >
                <UserPlus
                  size={16}
                  color={colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    fontSize: 13,
                  }}
                >
                  Agregar Miembro
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            {squadMembers.map((member, index) => (
              <View key={member.id}>
                <View style={styles.memberRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: member.avatarColor,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        overflow: "hidden",
                      }}
                    >
                      {member.profileImage ? (
                        <Image
                          source={{ uri: getAvatarUrl(member.profileImage) }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : (
                        <Text style={{ fontSize: 16 }}>😊</Text>
                      )}
                    </View>
                    <View>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {member.name} {member.isCurrentUser && t("you")}
                      </Text>
                      <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{member.role}</Text>
                    </View>
                  </View>
                  {member.isCurrentUser ? (
                    <Text style={{ color: "#94A3B8", fontSize: 12 }}>
                      {t("owner")}
                    </Text>
                  ) : squadMembers.find((m) => m.isCurrentUser)?.role === "Admin" ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(member.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {index < squadMembers.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleLeaveSquad}
            style={[styles.card, { alignItems: "center", paddingVertical: 16 }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <LogOut size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text
                style={{ color: "#EF4444", fontWeight: "bold", fontSize: 16 }}
              >
                {t("leaveSquad")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={addMemberModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              paddingTop: 60,
              backgroundColor: colors.card,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}
            >
              Agregar Miembro
            </Text>
            <TouchableOpacity
              onPress={() => {
                setAddMemberModalVisible(false);
                setUserSearchQuery("");
                setSearchResults([]);
              }}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 52,
                marginBottom: 20,
              }}
            >
              <Search size={20} color="#94A3B8" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="Buscar usuarios por nombre o correo..."
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, fontSize: 16, color: colors.text }}
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView>
              {isSearching ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text style={{ color: "#94A3B8", fontSize: 16 }}>
                    Buscando...
                  </Text>
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((userRes) => (
                  <View
                    key={userRes.userId}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "#E2E8F0",
                          overflow: "hidden",
                          marginRight: 12,
                        }}
                      >
                        {userRes.avatarUrl ? (
                          <Image
                            source={{ uri: getAvatarUrl(userRes.avatarUrl) }}
                            style={{ width: "100%", height: "100%" }}
                          />
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Users size={24} color="#94A3B8" />
                          </View>
                        )}
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: colors.text,
                            marginBottom: 2,
                          }}
                        >
                          {userRes.fullName}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          Racha: {userRes.streak} días 🔥
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAddMember(userRes.userId)}
                      disabled={isAddingUser === userRes.userId}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFF",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        {isAddingUser === userRes.userId
                          ? "Agregando..."
                          : "Agregar"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : userSearchQuery.trim() !== "" ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text style={{ color: "#94A3B8", fontSize: 16 }}>
                    No se encontraron usuarios para "{userSearchQuery}"
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text style={{ color: "#94A3B8", fontSize: 16 }}>
                    Busca usuarios para agregarlos a tu grupo.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#94A3B8",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  inputContainer: { padding: 16 },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#94A3B8",
  },
  input: { fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  rowText: { fontSize: 16, fontWeight: "500", color: "#FFFFFF" },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  memberName: { fontSize: 16, fontWeight: "bold" },
  memberRole: { fontSize: 12, color: "#64748B" },
  separator: { height: 1, marginLeft: 16, backgroundColor: "rgba(255,255,255,0.1)" },
});
