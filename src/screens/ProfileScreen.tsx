import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useUser } from "../context/UserContext";
import { clearAllData } from "../services/storage";
import { customAlert } from "../utils/alert";
import { useToast } from "../components/Toast";
import { getAvatarUrl } from "../api/apiClient";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import {
  Settings,
  User,
  Bell,
  Shield,
  Info,
  Trash2,
  Cpu,
  Camera,
  Edit2,
  Activity,
  Clock,
  Award,
  ChevronRight,
  Target,
  X,
  Globe,
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { getFollowers, getFollowing } from "../services/socialService";
import { uploadImage } from "../services/uploadService";
import { FollowerInfo } from "../types";
import {
  getPersonalRecords,
  getMuscleDistribution,
  getHistoricalComparison,
} from "../services/analyticsService";
import {
  PersonalRecord,
  MuscleDistribution,
  HistoricalComparison,
} from "../types";
import {
  getUserSettings,
  updateUserSettings,
  changePassword as apiChangePassword,
} from "../services/userService";
import { Lock } from "lucide-react-native";
import { SPACING, RADIUS } from "../theme/colors";
import { shadows } from "../theme/shadows";

// Simple bar chart component
const SimpleBar = ({
  label,
  percentage,
  color,
  value,
}: {
  label: string;
  percentage: number;
  color: string;
  value: string;
}) => (
  <View
    style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
  >
    <Text
      style={{ fontSize: 12, fontWeight: "600", width: 70, color }}
      numberOfLines={1}
    >
      {label}
    </Text>
    <View
      style={{
        flex: 1,
        height: 10,
        backgroundColor: "rgba(128,128,128,0.15)",
        borderRadius: 5,
        marginHorizontal: 8,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          borderRadius: 5,
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: color,
        }}
      />
    </View>
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        width: 40,
        textAlign: "right",
        color,
      }}
    >
      {value}
    </Text>
  </View>
);

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { user, updateProfile, logout } = useUser();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const isDark = colors.background !== "#F8FAFC";

  // Followers/Following modal
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<"followers" | "following">("followers");
  const [followersList, setFollowersList] = useState<FollowerInfo[]>([]);
  const [followingList, setFollowingList] = useState<FollowerInfo[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(false);

  useEffect(() => {
    loadSocialCounts();
  }, [user]);

  // Stats State
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [prs, setPrs] = useState<
    {
      exerciseName: string;
      muscleGroup: string;
      personalRecord: PersonalRecord;
    }[]
  >([]);
  const [muscleData, setMuscleData] = useState<MuscleDistribution[]>([]);
  const [comparison, setComparison] = useState<HistoricalComparison | null>(
    null,
  );
  const [periodDays, setPeriodDays] = useState(30);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (statsExpanded) {
      loadStats();
    }
  }, [statsExpanded, periodDays]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const [prData, muscleRes, compRes] = await Promise.all([
        getPersonalRecords(),
        getMuscleDistribution(periodDays),
        getHistoricalComparison(periodDays),
      ]);
      setPrs(prData);
      setMuscleData(muscleRes);
      setComparison(compRes);
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : "Error al cargar estadísticas";
      showToast(errorMsg, "error");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSocialCounts = async () => {
    try {
      const [followers, following] = await Promise.all([
        getFollowers(),
        getFollowing(),
      ]);
      setFollowersList(followers);
      setFollowingList(following);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
    } catch (e) {
      // Non-critical, silently fail
    }
  };

  const openFollowModal = async (tab: "followers" | "following") => {
    setFollowModalTab(tab);
    setShowFollowModal(true);
    setLoadingFollow(true);
    try {
      const [followers, following] = await Promise.all([
        getFollowers(),
        getFollowing(),
      ]);
      setFollowersList(followers);
      setFollowingList(following);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
    } catch (e) {
      showToast("Error al cargar datos", "error");
    } finally {
      setLoadingFollow(false);
    }
  };

  const formatChange = (val: number) => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  const getChangeIcon = (val: number) => {
    if (val > 0) return <TrendingUp size={16} color="#059669" />;
    if (val < 0) return <TrendingDown size={16} color="#DC2626" />;
    return <Minus size={16} color={colors.textSecondary} />;
  };

  const muscleColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#FFA07A",
    "#87CEEB",
    "#98D8C8",
    "#F7DC6F",
  ];

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Activity size={32} color={colors.primary} />
      </View>
    );
  }

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [tempBio, setTempBio] = useState(user.bio);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    isPublicProfile: true,
  });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getUserSettings();
        if (data) {
          setSettings({
            notificationsEnabled: data.notificationsEnabled ?? true,
            isPublicProfile: data.isPublicProfile ?? true,
          });
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await updateUserSettings(newSettings);
    } catch (e) {
      showToast("Error al actualizar ajustes", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Por favor complete todos los campos", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiChangePassword({ currentPassword, newPassword });
      showToast("Contraseña actualizada con éxito", "success");
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      showToast(e.message || "Error al cambiar contraseña", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({ name: tempName, bio: tempBio });
    setIsEditing(false);
  };

  const handleImageSelection = () => {
    if (Platform.OS === "web") {
      pickImage();
      return;
    }
    Alert.alert(t("profilePhoto"), t("changeProfilePhoto"), [
      { text: t("camera"), onPress: takePhoto },
      { text: t("gallery"), onPress: pickImage },
      {
        text: t("removePhoto"),
        style: "destructive",
        onPress: () => updateProfile({ profileImage: null }),
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
        setUploadingImage(true);
        try {
          const imageUrl = await uploadImage(result.assets[0].uri);
          updateProfile({ profileImage: imageUrl, avatarUrl: imageUrl });
          showToast("Foto actualizada", "success");
        } catch (err) {
          updateProfile({ profileImage: result.assets[0].uri });
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      Alert.alert(t("error"), t("errorPickImage") + ": " + error.message);
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
        setUploadingImage(true);
        try {
          const imageUrl = await uploadImage(result.assets[0].uri);
          updateProfile({ profileImage: imageUrl, avatarUrl: imageUrl });
          showToast("Foto actualizada", "success");
        } catch (err) {
          updateProfile({ profileImage: result.assets[0].uri });
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      Alert.alert(t("error"), t("errorTakePhoto") + ": " + error.message);
    }
  };

  const handleReset = () => {
    customAlert(t("developerReset"), t("developerResetMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("resetEverything"),
        style: "destructive",
        onPress: async () => {
          await clearAllData();
          customAlert(t("success"), t("allDataCleared"));
        },
      },
    ]);
  };

  const handleGoalPress = () => {
    if (!user.lastGoalChange) {
      setShowGoalPicker(true);
      return;
    }

    const lastDate = new Date(user.lastGoalChange);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - diffDays;

    if (daysRemaining > 0) {
      Alert.alert(
        t("goalLocked"),
        t("goalLockedMsg").replace("{days}", daysRemaining.toString()),
      );
    } else {
      setShowGoalPicker(true);
    }
  };

  const updateGoal = (days: number) => {
    updateProfile({
      weeklyWorkoutGoal: days,
      lastGoalChange: new Date().toISOString(),
    });
    setShowGoalPicker(false);
    Alert.alert(
      t("goalUpdated"),
      t("goalUpdatedMsg").replace("{days}", days.toString()),
    );
  };

  const StatCard = ({
    icon: Icon,
    value,
    label,
    color,
  }: {
    icon: any;
    value: string;
    label: string;
    color: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          ...(Platform.OS === "web"
            ? ({ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } as any)
            : {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
              }),
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text
        style={[styles.statLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );

  const SettingItem = ({
    icon: Icon,
    label,
    value,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    value?: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.background }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          marginRight: 12,
        }}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (color || colors.primary) + "15" },
          ]}
        >
          <Icon size={20} color={color || colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}
        {onPress && (
          <ChevronRight
            size={18}
            color={colors.textSecondary}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const SettingToggleItem = ({
    icon: Icon,
    label,
    value,
    color,
    onValueChange,
  }: {
    icon: any;
    label: string;
    value: boolean;
    color?: string;
    onValueChange: (val: boolean) => void;
  }) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.background }]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          marginRight: 12,
        }}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (color || colors.primary) + "15" },
          ]}
        >
          <Icon size={20} color={color || colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#CBD5E1", true: colors.primary + "80" }}
        thumbColor={value ? colors.primary : "#F1F5F9"}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Profile Section */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={handleImageSelection}>
              <View
                style={[
                  styles.avatarContainer,
                  { borderColor: colors.background },
                ]}
              >
                {user.profileImage ? (
                  <Image
                    source={{ uri: getAvatarUrl(user.profileImage) }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <User color="#FFF" size={40} />
                  </View>
                )}
              </View>
              <View style={styles.cameraButton}>
                <Camera size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={{ width: "80%", alignItems: "center", marginTop: 12 }}>
              <TextInput
                value={tempName}
                onChangeText={setTempName}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.textSecondary + "40",
                  },
                ]}
                placeholder={t("yourName")}
              />
              <TextInput
                value={tempBio}
                onChangeText={setTempBio}
                style={[
                  styles.input,
                  {
                    color: colors.textSecondary,
                    fontSize: 14,
                    height: 40,
                    borderColor: colors.textSecondary + "40",
                  },
                ]}
                placeholder={t("tellAboutYourself")}
                multiline
              />
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>{t("saveProfile")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: "center", marginTop: 12, width: "80%" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {user.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={{ marginLeft: 8, padding: 4 }}
                >
                  <Edit2 size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.bio, { color: colors.textSecondary }]}>
                {user.bio}
              </Text>

              {/* Followers / Following / Streak counters */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialItem} onPress={() => openFollowModal("followers")}>
                  <Text style={[styles.socialValue, { color: colors.text }]}>
                    {followersCount}
                  </Text>
                  <Text
                    style={[
                      styles.socialLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Seguidores
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.socialDivider,
                    { backgroundColor: colors.textSecondary + "30" },
                  ]}
                />
                <TouchableOpacity style={styles.socialItem} onPress={() => openFollowModal("following")}>
                  <Text style={[styles.socialValue, { color: colors.text }]}>
                    {followingCount}
                  </Text>
                  <Text
                    style={[
                      styles.socialLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Siguiendo
                  </Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.socialDivider,
                    { backgroundColor: colors.textSecondary + "30" },
                  ]}
                />
                <View style={styles.socialItem}>
                  <Text style={[styles.socialValue, { color: colors.text }]}>
                    {user?.stats?.streakDays ?? 0}
                  </Text>
                  <Text
                    style={[
                      styles.socialLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Racha
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={Activity}
            value={(user?.stats?.workoutsCompleted ?? 0).toString()}
            label={t("workouts")}
            color="#3B82F6"
          />
          <StatCard
            icon={Clock}
            value={`${Math.floor((user?.stats?.minutesTrained ?? 0) / 60)}h`}
            label={t("time")}
            color="#F59E0B"
          />
          <StatCard
            icon={Award}
            value={`${user?.stats?.streakDays ?? 0} ${(user?.stats?.streakDays ?? 0) === 1 ? t("dayUnit") : t("daysUnit")}`}
            label={t("streak")}
            color="#EF4444"
          />
        </View>

        {/* Advanced Stats Accordion */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setStatsExpanded(!statsExpanded)}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.textSecondary, marginBottom: 0, marginLeft: 0 },
              ]}
            >
              Estadísticas Avanzadas
            </Text>
            {statsExpanded ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {statsExpanded && (
            <View
              style={[styles.sectionContent, { backgroundColor: colors.card }]}
            >
              {statsLoading ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <View style={{ padding: 16 }}>
                  <View style={styles.periodRow}>
                    {[7, 30, 90].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.periodBtn,
                          {
                            backgroundColor:
                              periodDays === d ? colors.primary : "transparent",
                            borderColor:
                              periodDays === d ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setPeriodDays(d)}
                      >
                        <Text
                          style={[
                            styles.periodText,
                            {
                              color:
                                periodDays === d
                                  ? "#FFF"
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {d}d
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Historical Comparison */}
                  {comparison && (
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: isDark
                            ? "#1A1A2E"
                            : colors.background,
                          borderColor: isDark ? "transparent" : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <BarChart3 size={20} color={colors.primary} />
                        <Text
                          style={[styles.cardTitle, { color: colors.text }]}
                        >
                          Comparación
                        </Text>
                      </View>

                      <View style={styles.compGrid}>
                        <View style={styles.compItem}>
                          <Text
                            style={[styles.compValue, { color: colors.text }]}
                          >
                            {comparison?.currentPeriod?.workoutCount ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.compLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Entrenos
                          </Text>
                          <View style={styles.changeRow}>
                            {getChangeIcon(comparison?.workoutCountChange ?? 0)}
                            <Text
                              style={[
                                styles.changeText,
                                {
                                  color:
                                    (comparison?.workoutCountChange ?? 0) >= 0
                                      ? "#059669"
                                      : "#DC2626",
                                },
                              ]}
                            >
                              {formatChange(
                                comparison?.workoutCountChange ?? 0,
                              )}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.compDivider,
                            { backgroundColor: colors.border },
                          ]}
                        />

                        <View style={styles.compItem}>
                          <Text
                            style={[styles.compValue, { color: colors.text }]}
                          >
                            {Math.round(
                              (comparison?.currentPeriod?.totalVolume ?? 0) /
                                1000,
                            )}
                            k
                          </Text>
                          <Text
                            style={[
                              styles.compLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Vol. (kg)
                          </Text>
                          <View style={styles.changeRow}>
                            {getChangeIcon(comparison?.volumeChange ?? 0)}
                            <Text
                              style={[
                                styles.changeText,
                                {
                                  color:
                                    (comparison?.volumeChange ?? 0) >= 0
                                      ? "#059669"
                                      : "#DC2626",
                                },
                              ]}
                            >
                              {formatChange(comparison?.volumeChange ?? 0)}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.compDivider,
                            { backgroundColor: colors.border },
                          ]}
                        />

                        <View style={styles.compItem}>
                          <Text
                            style={[styles.compValue, { color: colors.text }]}
                          >
                            {Math.round(
                              (comparison?.currentPeriod
                                ?.totalDurationSeconds ?? 0) / 3600,
                            )}
                            h
                          </Text>
                          <Text
                            style={[
                              styles.compLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Tiempo
                          </Text>
                          <View style={styles.changeRow}>
                            {getChangeIcon(comparison?.durationChange ?? 0)}
                            <Text
                              style={[
                                styles.changeText,
                                {
                                  color:
                                    (comparison?.durationChange ?? 0) >= 0
                                      ? "#059669"
                                      : "#DC2626",
                                },
                              ]}
                            >
                              {formatChange(comparison?.durationChange ?? 0)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Personal Records */}
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? "#1A1A2E" : colors.background,
                        borderColor: isDark ? "transparent" : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Trophy size={20} color="#FFD700" />
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Records Personales
                      </Text>
                    </View>

                    {prs.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Text
                          style={[
                            styles.emptyText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Completa entrenos para ver tus PRs
                        </Text>
                      </View>
                    ) : (
                      prs.slice(0, 5).map((pr, i) => (
                        <View
                          key={i}
                          style={[
                            styles.prRow,
                            { borderBottomColor: colors.border },
                          ]}
                        >
                          <View style={styles.prInfo}>
                            <Text
                              style={[styles.prName, { color: colors.text }]}
                            >
                              {pr?.exerciseName ?? "Ejercicio"}
                            </Text>
                            <Text
                              style={[
                                styles.prMuscle,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {pr?.muscleGroup ?? "General"}
                            </Text>
                          </View>
                          <View style={styles.prValues}>
                            <Text
                              style={[
                                styles.prWeight,
                                { color: colors.primary },
                              ]}
                            >
                              {pr?.personalRecord?.maxWeight ?? 0} kg
                            </Text>
                            <Text
                              style={[
                                styles.prReps,
                                { color: colors.textSecondary },
                              ]}
                            >
                              × {pr?.personalRecord?.maxReps ?? 0}
                            </Text>
                          </View>
                          {pr?.personalRecord?.isNewPR && (
                            <View style={styles.newPrBadge}>
                              <Text style={styles.newPrText}>🆕</Text>
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>

                  {/* Muscle Distribution */}
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? "#1A1A2E" : colors.background,
                        borderColor: isDark ? "transparent" : colors.border,
                        marginBottom: 0,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Target size={20} color={colors.primary} />
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Distribución Muscular
                      </Text>
                    </View>

                    {muscleData.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Text
                          style={[
                            styles.emptyText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Sin datos suficientes
                        </Text>
                      </View>
                    ) : (
                      <View style={{ paddingTop: 8 }}>
                        {muscleData.map((m, i) => (
                          <SimpleBar
                            key={m?.muscleGroup ?? i}
                            label={m?.muscleGroup ?? "Otro"}
                            percentage={m?.percentage ?? 0}
                            color={muscleColors[i % muscleColors.length]}
                            value={`${(m?.percentage ?? 0).toFixed(0)}%`}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("goals")}
          </Text>
          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderBottomColor: colors.background },
              ]}
              onPress={handleGoalPress}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "#10B98115" },
                  ]}
                >
                  <Target size={20} color="#10B981" />
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {t("weeklyGoal")}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {t("goalSubtitle")}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    color: colors.primary,
                    marginRight: 8,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                  numberOfLines={1}
                >
                  {user.weeklyWorkoutGoal || 4} {t("daysPerWeek")}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("account")}
          </Text>
          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            <SettingItem
              icon={User}
              label={t("personalDetails")}
              value={user.email}
            />
            <SettingToggleItem
              icon={Bell}
              label={t("notifications")}
              value={settings.notificationsEnabled}
              onValueChange={(val) =>
                handleUpdateSetting("notificationsEnabled", val)
              }
            />
            <SettingToggleItem
              icon={Shield}
              label={t("privacy")}
              value={settings.isPublicProfile}
              onValueChange={(val) => handleUpdateSetting("isPublicProfile", val)}
            />
            <SettingItem
              icon={Lock}
              label="Cambiar Contraseña"
              onPress={() => setPasswordModalVisible(true)}
            />
            <SettingItem
              icon={Globe}
              label={t("language")}
              value={
                language === "en"
                  ? "English"
                  : language === "es"
                    ? "Español"
                    : "Français"
              }
              onPress={() => setShowLanguagePicker(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("support")}
          </Text>
          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            <SettingItem icon={Info} label={t("helpFeedback")} />
            <SettingItem
              icon={Settings}
              label={t("appSettings")}
              onPress={() => navigation.navigate("Settings")}
            />
          </View>
        </View>

        {/* Developer Tools */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>
            {t("developerZone")}
          </Text>
          <View
            style={[styles.sectionContent, { backgroundColor: colors.card }]}
          >
            <TouchableOpacity onPress={handleReset} style={styles.settingItem}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "#EF444415" },
                  ]}
                >
                  <Cpu size={20} color="#EF4444" />
                </View>
                <Text style={[styles.settingLabel, { color: "#EF4444" }]}>
                  {t("resetAppData")}
                </Text>
              </View>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>{t("logOut")}</Text>
        </TouchableOpacity>

        {/* Password Change Modal */}
        <Modal
          visible={passwordModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setPasswordModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 24,
                width: "100%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Cambiar Contraseña
                </Text>
                <TouchableOpacity
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 16 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    CONTRASEÑA ACTUAL
                  </Text>
                  <TextInput
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      padding: 16,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    NUEVA CONTRASEÑA
                  </Text>
                  <TextInput
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      padding: 16,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: colors.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    CONFIRMAR NUEVA CONTRASEÑA
                  </Text>
                  <TextInput
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 12,
                      padding: 16,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isChangingPassword}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  marginTop: 32,
                }}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text
                    style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}
                  >
                    Actualizar Contraseña
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Version 1.2.0 (Build 45)
        </Text>

        {/* Modal for Goal Selection */}
        <Modal
          visible={showGoalPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGoalPicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                width: "80%",
                maxHeight: 400,
                borderRadius: 24,
                padding: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  {t("setWeeklyGoal")}
                </Text>
                <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                {t("goalPrompt")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => updateGoal(num)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor:
                        user.weeklyWorkoutGoal === num
                          ? colors.primary
                          : colors.background,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor:
                        user.weeklyWorkoutGoal === num
                          ? colors.primary
                          : "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "bold",
                        color:
                          user.weeklyWorkoutGoal === num ? "#FFF" : colors.text,
                      }}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal for Language Selection */}
        <Modal
          visible={showLanguagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                width: "80%",
                borderRadius: 24,
                padding: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  {t("selectLanguage")}
                </Text>
                <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {[
                { code: "en", label: "English", icon: "🇺🇸" },
                { code: "es", label: "Español", icon: "🇪🇸" },
                { code: "fr", label: "Français", icon: "🇫🇷" },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    setLanguage(lang.code as any);
                    setShowLanguagePicker(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.background,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>
                      {lang.icon}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: colors.text,
                      }}
                    >
                      {lang.label}
                    </Text>
                  </View>
                  {language === lang.code && (
                    <Award size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Followers / Following Modal */}
        <Modal
          visible={showFollowModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFollowModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>Social</Text>
                <TouchableOpacity onPress={() => setShowFollowModal(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", paddingHorizontal: 20, marginVertical: 12 }}>
                <TouchableOpacity
                  onPress={() => setFollowModalTab("followers")}
                  style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: followModalTab === "followers" ? colors.primary : "transparent" }}
                >
                  <Text style={{ fontWeight: "700", color: followModalTab === "followers" ? colors.primary : colors.textSecondary }}>
                    Seguidores ({followersCount})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFollowModalTab("following")}
                  style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: followModalTab === "following" ? colors.primary : "transparent" }}
                >
                  <Text style={{ fontWeight: "700", color: followModalTab === "following" ? colors.primary : colors.textSecondary }}>
                    Siguiendo ({followingCount})
                  </Text>
                </TouchableOpacity>
              </View>
              {loadingFollow ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <ScrollView style={{ paddingHorizontal: 20 }}>
                  {(followModalTab === "followers" ? followersList : followingList).length === 0 ? (
                    <View style={{ padding: 40, alignItems: "center" }}>
                      <Text style={{ fontSize: 48, marginBottom: 12 }}>{followModalTab === "followers" ? "👥" : "🔍"}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center" }}>
                        {followModalTab === "followers" ? "Aún no tienes seguidores" : "No sigues a nadie todavía"}
                      </Text>
                    </View>
                  ) : (
                    (followModalTab === "followers" ? followersList : followingList).map((person) => (
                      <View key={person.userId} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <Image
                          source={{ uri: getAvatarUrl(person.avatarUrl) }}
                          style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{person.fullName}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingTop: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563EB",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 20,
    overflow: "hidden",
    ...shadows.premium,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "bold",
  },
  settingValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  version: {
    textAlign: "center",
    marginTop: 24,
    marginBottom: 40,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 12,
  },
  socialItem: {
    alignItems: "center",
    flex: 1,
  },
  socialValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  socialLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  socialDivider: {
    width: 1,
    height: 24,
  },
  periodRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
    ...shadows.premium,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyCard: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  compGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compItem: {
    flex: 1,
    alignItems: "center",
  },
  compValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  compLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  compDivider: {
    width: 1,
    marginVertical: 4,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: 13,
    fontWeight: "600",
  },
  prMuscle: {
    fontSize: 11,
    marginTop: 2,
  },
  prValues: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  prWeight: {
    fontSize: 15,
    fontWeight: "800",
  },
  prReps: {
    fontSize: 12,
    fontWeight: "600",
  },
  newPrBadge: {
    marginLeft: 8,
  },
  newPrText: {
    fontSize: 14,
  },
});
