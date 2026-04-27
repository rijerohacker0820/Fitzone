import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { WorkoutRoutine, WorkoutSet } from "../types";
import { uploadImage } from "../services/uploadService";
import {
  Play,
  Pause,
  Square,
  Check,
  X,
  ChevronLeft,
  Minus,
  Timer,
  Plus,
  Trash2,
} from "lucide-react-native";
import { saveWorkoutLog } from "../services/storage";
import { customAlert } from "../utils/alert";
import { createPost } from "../services/socialService";
import FinishWorkoutModal from "../components/FinishWorkoutModal";
import ExerciseSearchModal from "../components/ExerciseSearchModal";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import { shadows } from "../theme/shadows";
import { Exercise } from "../types";

import { useLanguage } from "../context/LanguageContext";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

interface Props {
  routine?: WorkoutRoutine;
  onFinish?: () => void;
  onBack?: () => void;
}

export default function ActiveWorkoutScreen({
  routine: propRoutine,
  onFinish: propOnFinish,
  onBack,
}: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const route = useRoute<RouteProp<RootStackParamList, "ActiveWorkout">>();
  // Priority: Prop -> Route Param -> Error/Fallback
  const routine = propRoutine || route.params?.routine;
  const navigation = useNavigation<any>();

  const onFinish = propOnFinish || (() => navigation.goBack());

  if (!routine) return null; // Or some error state

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);

  // --- Countdown State ---
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdownValue, setCountdownValue] = useState(3);
  const countdownScale = useRef(new Animated.Value(0.3)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  const useNative = Platform.OS !== "web";

  const animateCountdownTick = useCallback(() => {
    countdownScale.setValue(0.3);
    countdownOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(countdownScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: useNative,
      }),
      Animated.timing(countdownOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: useNative,
      }),
    ]).start();
  }, [countdownScale, countdownOpacity]);

  useEffect(() => {
    if (!showCountdown) return;
    animateCountdownTick();

    if (countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // countdownValue === 0 means we're showing "Listo!"
      const timer = setTimeout(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: useNative,
        }).start(() => {
          setShowCountdown(false);
          setIsRunning(true);
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [countdownValue, showCountdown]);
  const [activeRoutine, setActiveRoutine] = useState(routine);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [finalWorkoutData, setFinalWorkoutData] =
    useState<WorkoutRoutine | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  // Track set completion locally
  // We need deep copy or state management for sets.
  // For simplicity, we assume activeRoutine is the state.
  const progress = useMemo(() => {
    if (!activeRoutine) return 0;
    let total = 0;
    let attempted = 0;
    activeRoutine.exercises.forEach((ex: Exercise) => {
      total += ex.sets.length;
      attempted += ex.sets.filter(
        (s: WorkoutSet) =>
          s.status === "completed" ||
          s.status === "partial" ||
          s.status === "failed",
      ).length;
    });
    return total === 0 ? 0 : (attempted / total) * 100;
  }, [activeRoutine]);

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((e: number) => e + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    let interval: any;
    if (restTimeLeft !== null && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : null));
      }, 1000);
    } else if (restTimeLeft === 0) {
      setRestTimeLeft(null); // auto hide
    }
    return () => clearInterval(interval);
  }, [restTimeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const updateSetStatus = (
    exerciseIndex: number,
    setIndex: number,
    status: WorkoutSet["status"],
  ) => {
    if (!activeRoutine) return;
    const updated = {
      ...activeRoutine,
      exercises: activeRoutine.exercises.map((ex: Exercise, exIdx: number) => {
        if (exIdx !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s: WorkoutSet, sIdx: number) => {
            if (sIdx !== setIndex) return s;
            return {
              ...s,
              status: s.status === status ? "pending" : status,
            };
          }),
        };
      }),
    };

    setActiveRoutine(updated);

    // Start rest timer if completed
    if (status === "completed" || status === "partial") {
      setRestTimeLeft(activeRoutine.restSeconds || 60);
    }
  };

  const updateSetDetails = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: string,
  ) => {
    const numValue = parseInt(value, 10);
    const finalValue = isNaN(numValue) ? 0 : numValue;

    if (!activeRoutine) return;
    const updated = {
      ...activeRoutine,
      exercises: activeRoutine.exercises.map((ex: Exercise, exIdx: number) => {
        if (exIdx !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s: WorkoutSet, sIdx: number) => {
            if (sIdx !== setIndex) return s;
            return {
              ...s,
              [field]: finalValue,
            };
          }),
        };
      }),
    };
    setActiveRoutine(updated);
  };

  const handleAddExercise = (
    exerciseName: string,
    sets: number,
    reps: number,
  ) => {
    const newExercise: Exercise = {
      id: Crypto.randomUUID(),
      name: exerciseName,
      muscleGroup: "General",
      sets: Array.from({ length: sets }).map(() => ({
        id: Crypto.randomUUID(),
        reps: reps,
        weight: 0,
        status: "pending",
      })),
    };
    setActiveRoutine((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));
  };

  const handleRemoveExercise = (exId: string) => {
    if (!activeRoutine) return;
    setActiveRoutine((prev: any) => ({
      ...prev,
      exercises: prev.exercises.filter((e: Exercise) => e.id !== exId),
    }));
  };

  const handleFinish = () => {
    const hasPending = activeRoutine.exercises.some((ex) =>
      ex.sets.some((s) => s.status === "pending"),
    );

    if (hasPending) {
      customAlert(t("incompleteWorkout"), t("incompleteWorkoutMsg"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("finishAnyways"),
          style: "destructive",
          onPress: () => {
            if (!activeRoutine) return;
            const finalWorkout = {
              ...activeRoutine,
              exercises: activeRoutine.exercises.map((ex: Exercise) => ({
                ...ex,
                sets: ex.sets.map((s: WorkoutSet) => ({
                  ...s,
                  status: (s.status === "pending" ? "failed" : s.status) as WorkoutSet["status"],
                })),
              })),
            };
            setFinalWorkoutData(finalWorkout as WorkoutRoutine);
            setFinishModalVisible(true);
          },
        },
      ]);
    } else {
      setFinalWorkoutData(activeRoutine as WorkoutRoutine);
      setFinishModalVisible(true);
    }
  };

  const handleSaveWorkout = async (
    sensation: string,
    notes: string,
    imageUri?: string,
    shareToFeed: boolean = true,
  ) => {
    if (!finalWorkoutData) return;

    const workoutToSave = {
      ...finalWorkoutData,
      sensation,
      notes,
      imageUri,
    };

    setFinishModalVisible(false);
    await finishWorkout(workoutToSave, shareToFeed);
  };

  const finishWorkout = async (workoutLog: WorkoutRoutine, shareToFeed: boolean) => {
    setIsRunning(false);
    const finalWorkout = { ...workoutLog };
    finalWorkout.duration = elapsed;
    finalWorkout.status = "completed";
    finalWorkout.date = new Date().toISOString();
    const newWorkoutId = await saveWorkoutLog(finalWorkout);
    console.log("Workout saved with ID:", newWorkoutId);

    try {
      if (shareToFeed) {
        let uploadedUrl = workoutLog.imageUri;
        if (workoutLog.imageUri && !workoutLog.imageUri.startsWith("http")) {
          // uploadImage returns the full URL string directly
          uploadedUrl = await uploadImage(workoutLog.imageUri);
        }

        const postContent = `🏆 ${t("finishedWorkout")}: ${activeRoutine.name}${workoutLog.notes ? `\n\n"${workoutLog.notes}"` : ""}`;
        
        await createPost({
          content: postContent,
          type: "Workout",
          workoutId: newWorkoutId,
          imageUrl: uploadedUrl,
        });
      }
    } catch (postError) {
      console.error("[ActiveWorkout] Failed to share workout to feed", postError);
    }

    customAlert(t("workoutFinished"), t("greatJob"), [
      { text: t("done"), onPress: onFinish },
    ]);
  };

  const handleCancel = () => {
    Alert.alert(t("cancelWorkout"), t("cancelWorkoutMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("yesCancel"),
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showCountdown && (
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, zIndex: 999, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", opacity: overlayOpacity }}>
          <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: colors.primary + "15", position: "absolute" }} />
          <View style={{ width: 280, height: 280, borderRadius: 140, borderWidth: 2, borderColor: colors.primary + "08", position: "absolute" }} />
          <Animated.View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primary + "20", borderWidth: 4, borderColor: colors.primary, alignItems: "center", justifyContent: "center", transform: [{ scale: countdownScale }], opacity: countdownOpacity, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 }}>
            <Text style={{ color: "#FFFFFF", fontSize: countdownValue > 0 ? 72 : 36, fontWeight: "900", letterSpacing: countdownValue > 0 ? 0 : 2, textTransform: "uppercase" }}>
              {countdownValue > 0 ? countdownValue : t("getReady")}
            </Text>
          </Animated.View>
          <Text style={{ color: "#94A3B8", fontSize: 16, fontWeight: "600", marginTop: 48, letterSpacing: 1, textTransform: "uppercase" }}>
            {activeRoutine.name}
          </Text>
        </Animated.View>
      )}
      <View style={{ padding: 20, paddingTop: 60, backgroundColor: colors.card, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity onPress={onBack || handleCancel} style={{ marginRight: 16 }}>
            <ChevronLeft color={colors.text} size={28} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t("activeSession")}</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold" }} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              {activeRoutine.name}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            customAlert("Descartar Rutina", "¿Seguro que deseas descartar este entrenamiento? Se perderá todo el progreso.", [
              { text: t("cancel"), style: "cancel" },
              { text: "Descartar", style: "destructive", onPress: () => { setIsRunning(false); navigation.goBack(); } }
            ]);
          }}
          style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: "#FEE2E2", marginRight: 8 }}
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFinish}>
          <LinearGradient colors={["#F97316", "#EA580C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 }}>
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>{t("finish")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 15, backgroundColor: colors.card }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ color: "#64748B", fontSize: 16, fontWeight: "600" }}>{t("progress")}</Text>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "bold" }}>{Math.round(progress)}%</Text>
        </View>
        <View style={{ height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
          <Animated.View style={{ height: "100%", width: animatedProgress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }), backgroundColor: colors.primary, borderRadius: 4 }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {activeRoutine?.exercises.map((exercise: Exercise, exIdx: number) => (
          <View key={exercise.id || exIdx} style={{ marginBottom: 24, backgroundColor: colors.card, padding: 20, borderRadius: 20, ...shadows.premium }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>{exercise.name}</Text>
              <TouchableOpacity onPress={() => { customAlert("Eliminar ejercicio", `¿Eliminar ${exercise.name} de esta sesión?`, [{ text: t("cancel"), style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => handleRemoveExercise(exercise.id) }]); }} style={{ padding: 4 }}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            {exercise.sets.map((set: WorkoutSet, setIdx: number) => (
              <View key={set.id || setIdx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.background, padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: set.status === "completed" ? colors.primary : "#1E293B" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: colors.textSecondary, fontWeight: "bold", width: 50, fontSize: 16 }}>{t("set")} {setIdx + 1}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 12, marginLeft: 10 }}>
                    <TextInput style={{ color: colors.text, fontSize: 20, fontWeight: "700", minWidth: 40, textAlign: "center", paddingVertical: 8 }} keyboardType="numeric" value={set.reps === 0 ? "" : set.reps.toString()} onChangeText={(val) => updateSetDetails(exIdx, setIdx, "reps", val)} placeholder="0" placeholderTextColor="#94A3B8" />
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}> {t("reps").toLowerCase()} × </Text>
                    <TextInput style={{ color: colors.text, fontSize: 20, fontWeight: "700", minWidth: 50, textAlign: "center", paddingVertical: 8 }} keyboardType="numeric" value={set.weight === 0 ? "" : set.weight.toString()} onChangeText={(val) => updateSetDetails(exIdx, setIdx, "weight", val)} placeholder="0" placeholderTextColor="#94A3B8" />
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}> kg</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={() => updateSetStatus(exIdx, setIdx, "completed")} style={{ overflow: "hidden", borderRadius: 20 }}>
                    <LinearGradient colors={set.status === "completed" ? ["#49b8bf", "#1a45b8"] : ["transparent", "transparent"]} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: set.status === "completed" ? 0 : 2, borderColor: set.status === "completed" ? "transparent" : colors.card, alignItems: "center", justifyContent: "center" }}>
                      <Check color={set.status === "completed" ? "#FFF" : colors.textSecondary} size={20} strokeWidth={3} />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateSetStatus(exIdx, setIdx, "partial")} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: set.status === "partial" ? "#F59E0B" : "transparent", borderWidth: 1, borderColor: set.status === "partial" ? "#F59E0B" : "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ transform: [{ rotate: "45deg" }] }}><Minus color={set.status === "partial" ? "#FFF" : "#94A3B8"} size={18} /></View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateSetStatus(exIdx, setIdx, "failed")} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: set.status === "failed" ? "#EF4444" : "transparent", borderWidth: 1, borderColor: set.status === "failed" ? "#EF4444" : "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                    <X color={set.status === "failed" ? "#FFF" : "#94A3B8"} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
        <TouchableOpacity onPress={() => setSearchModalVisible(true)} style={{ height: 60, borderRadius: 16, borderStyle: "dotted", borderWidth: 2, borderColor: "#CBD5E1", flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24, backgroundColor: colors.card }}>
          <Plus size={24} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: "600" }}>{t("addExercise")}</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={{ position: "absolute", bottom: 30, left: 20, right: 20 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 80, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Timer size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>{t("sessionTime").toUpperCase()}</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0F172A", fontVariant: ["tabular-nums"] }}>{formatTime(elapsed)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setIsRunning(!isRunning)}>
            <LinearGradient colors={["#2563EB", "#1D4ED8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", minWidth: 110, justifyContent: "center" }}>
              {isRunning ? (
                <>
                  <Pause size={18} color="#FFF" fill="#FFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>{t("pause")}</Text>
                </>
              ) : (
                <>
                  <Play size={18} color="#FFF" fill="#FFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>{t("resume")}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {restTimeLeft !== null && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#1E293B", borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 80, shadowColor: colors.primary, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Timer size={20} color="#38BDF8" />
              </View>
              <View>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>DESCANSO</Text>
                <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFF", fontVariant: ["tabular-nums"] }}>{formatTime(restTimeLeft)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => setRestTimeLeft((prev) => prev ? Math.max(0, prev - 15) : null)} style={{ backgroundColor: "rgba(255,255,255,0.1)", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>-15</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRestTimeLeft((prev) => (prev ? prev + 15 : 15))} style={{ backgroundColor: "rgba(255,255,255,0.1)", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>+15</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRestTimeLeft(null)} style={{ backgroundColor: "#EF4444", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <FinishWorkoutModal visible={finishModalVisible} onClose={() => setFinishModalVisible(false)} onSave={handleSaveWorkout} />
      <ExerciseSearchModal visible={searchModalVisible} onClose={() => setSearchModalVisible(false)} onSelect={handleAddExercise} addedExercises={activeRoutine.exercises} onRemove={handleRemoveExercise} />
    </View>
  );
}
