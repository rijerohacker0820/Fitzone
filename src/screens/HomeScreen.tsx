import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { RootStackParamList } from "../navigation/types";
import PerformanceChart from "../components/ACWRChart";
import GlobalHeader from "../components/GlobalHeader";
import { WorkoutRoutine } from "../types";
import { getWorkoutLogs, saveRoutine, getRoutines } from "../services/storage";
import { Zap, Dumbbell, X, ChevronRight } from "lucide-react-native";
import StreakCard from "../components/StreakCard";
import ActionButtons from "../components/ActionButtons";
import { shadows } from "../theme/shadows";
import FABMenu from "../components/FABMenu";
import ManualWorkoutModal from "../components/ManualWorkoutModal";
import * as Crypto from "expo-crypto";
import { useSquads } from "../context/SquadContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useUser();
  const navigation = useNavigation<any>();
  const { squads } = useSquads();
  const insets = useSafeAreaInsets();

  const [recentLogs, setRecentLogs] = useState<WorkoutRoutine[]>([]);
  const [allRoutines, setAllRoutines] = useState<WorkoutRoutine[]>([]);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [existingRoutineModalVisible, setExistingRoutineModalVisible] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {

    const logs = await getWorkoutLogs();
    logs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setRecentLogs(logs.slice(0, 5));
    setAllRoutines(await getRoutines());
  };

  const handleStartQuickWorkout = () => {
    const quickWorkout: WorkoutRoutine = {
      id: Crypto.randomUUID(),
      name: t("quickWorkout"),
      exercises: [],
      date: new Date().toISOString(),
      duration: 0,
      status: "in-progress",
      tags: ["Quick Workout"],
    };

    setFabMenuVisible(false);
    navigation.navigate("ActiveWorkout", { routine: quickWorkout });
  };

  const handleRoutineCreated = async (routine: WorkoutRoutine) => {
    await saveRoutine(routine);
    await loadData();
    setManualModalVisible(false);
  };

  const handleSchedulePress = () => {
    navigation.navigate("Schedule");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlobalHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 70,
          paddingBottom: 100,
        }}
      >
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}
          >
            {t("welcomeBack")}, {user?.name?.split(" ")[0]}
          </Text>
          <Text
            style={{ fontSize: 16, color: colors.textSecondary, marginTop: 4 }}
          >
            {t("momentumMsg")}
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            {t("yourSquads")}
          </Text>
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH}
            snapToAlignment="center"
            style={{ width: "100%", overflow: "visible" }}
          >
            {!squads || squads.length === 0 ? (
              <View style={{ width: CARD_WIDTH }}>
                <StreakCard
                  squadName={t("joinSquad")}
                  streak={0}
                  onPress={() => navigation.navigate("Social")}
                  isActive={false}
                  members={[]}
                />
              </View>
            ) : (
              squads.map((squad) => (
                <View key={squad.id} style={{ width: CARD_WIDTH }}>
                  <View style={{ width: "100%", paddingRight: 8 }}>
                    <StreakCard
                      squadName={squad.name}
                      streak={squad.streak}
                      onPress={() =>
                        navigation.navigate("SquadDetail", {
                          squadId: squad.id,
                        })
                      }
                      isActive={squad.streak > 0}
                      members={squad.membersList}
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <PerformanceChart />
        <ActionButtons
          onLogPress={() => setFabMenuVisible(true)}
          onSchedulePress={handleSchedulePress}
        />

        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          {t("recentHistory")}
        </Text>
        <View style={{ marginBottom: 40 }}>
          {recentLogs.length === 0 ? (
            <View
              style={{
                height: 100,
                backgroundColor: colors.card,
                borderRadius: 20,
                padding: 16,
                justifyContent: "center",
                alignItems: "center",
                ...shadows.premium,
              }}
            >
              <Text style={{ color: colors.textSecondary }}>
                {t("noWorkouts")}
              </Text>
            </View>
          ) : (
            recentLogs.map((log, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigation.navigate("WorkoutSummary", { log })}
                style={{
                  backgroundColor: colors.card,
                  padding: 16,
                  borderRadius: 20,
                  ...shadows.premium,
                  marginBottom: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
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
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      flexShrink: 0,
                    }}
                  >
                    {log.tags && log.tags.includes("Quick Workout") ? (
                      <Zap size={20} color={colors.primary} />
                    ) : (
                      <Dumbbell size={20} color={colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                      numberOfLines={1}
                    >
                      {log.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {new Date(log.date).toLocaleDateString()} •{" "}
                      {Math.floor(log.duration / 60)} min
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "#22C55E20",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      color: "#22C55E",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {t("done")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <FABMenu
          visible={fabMenuVisible}
          onClose={() => setFabMenuVisible(false)}
          onAdd={handleStartQuickWorkout}
          onBuild={() => setManualModalVisible(true)}
          onExisting={() => {
            setFabMenuVisible(false);
            setExistingRoutineModalVisible(true);
          }}
        />

        <ManualWorkoutModal
          visible={manualModalVisible}
          onClose={() => setManualModalVisible(false)}
          onRoutineCreated={handleRoutineCreated}
          onRoutineDeleted={() => {}}
          initialRoutine={null}
        />

        <Modal
          visible={existingRoutineModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setExistingRoutineModalVisible(false)}
        >
          <View
            style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}
              >
                {t("selectRoutine")}
              </Text>
              <TouchableOpacity
                onPress={() => setExistingRoutineModalVisible(false)}
                style={{
                  padding: 8,
                  backgroundColor: "#1E293B",
                  borderRadius: 20,
                }}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allRoutines}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setExistingRoutineModalVisible(false);
                    navigation.navigate("ActiveWorkout", { routine: item });
                  }}
                  style={{
                    backgroundColor: colors.card,
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderWidth: 0,
                    ...shadows.premium,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: colors.text,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {item.exercises.length} {t("exercises")}
                    </Text>
                  </View>
                  <ChevronRight color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Text style={{ color: colors.textSecondary }}>
                    {t("noRoutinesFound")}
                  </Text>
                </View>
              }
            />
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
