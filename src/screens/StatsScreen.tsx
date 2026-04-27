import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import {
  getPersonalRecords,
  getMuscleDistribution,
  getHistoricalComparison,
} from "../services/analyticsService";
import {
  MuscleDistribution,
  HistoricalComparison,
  PersonalRecord,
} from "../types";
import { SPACING, RADIUS } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Simple bar chart component — no external dependency
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
  <View style={simpleBarStyles.row}>
    <Text style={[simpleBarStyles.label, { color }]} numberOfLines={1}>
      {label}
    </Text>
    <View style={simpleBarStyles.barBg}>
      <View
        style={[
          simpleBarStyles.barFill,
          { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
    <Text style={[simpleBarStyles.value, { color }]}>{value}</Text>
  </View>
);

const simpleBarStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", width: 70 },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 5 },
  value: { fontSize: 12, fontWeight: "700", width: 40, textAlign: "right" },
});

export default function StatsScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const isDark = colors.background !== "#F8FAFC";
  const cardBg = isDark ? "#1A1A2E" : colors.card;

  useEffect(() => {
    loadAll();
  }, [periodDays]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prData, muscleRes, compRes] = await Promise.all([
        getPersonalRecords(),
        getMuscleDistribution(periodDays),
        getHistoricalComparison(periodDays),
      ]);
      setPrs(prData);
      setMuscleData(muscleRes);
      setComparison(compRes);
    } catch (error: any) {
      showToast(error.message || "Error al cargar estadísticas", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [periodDays]);

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

  const formatChange = (val: number) => {
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  const getChangeIcon = (val: number) => {
    if (val > 0) return <TrendingUp size={16} color="#059669" />;
    if (val < 0) return <TrendingDown size={16} color="#DC2626" />;
    return <Minus size={16} color={colors.textSecondary} />;
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Estadísticas
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analizando datos...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {[7, 30, 90].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.periodBtn,
              {
                backgroundColor:
                  periodDays === d ? colors.primary : "transparent",
                borderColor: periodDays === d ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPeriodDays(d)}
          >
            <Text
              style={[
                styles.periodText,
                {
                  color: periodDays === d ? "#FFF" : colors.textSecondary,
                },
              ]}
            >
              {d}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Historical Comparison */}
        {comparison && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: isDark ? "transparent" : colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <BarChart3 size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Comparación
              </Text>
            </View>

            <View style={styles.compGrid}>
              <View style={styles.compItem}>
                <Text style={[styles.compValue, { color: colors.text }]}>
                  {comparison?.currentPeriod?.workoutCount ?? 0}
                </Text>
                <Text
                  style={[styles.compLabel, { color: colors.textSecondary }]}
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
                    {formatChange(comparison?.workoutCountChange ?? 0)}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.compDivider, { backgroundColor: colors.border }]}
              />

              <View style={styles.compItem}>
                <Text style={[styles.compValue, { color: colors.text }]}>
                  {Math.round(
                    (comparison?.currentPeriod?.totalVolume ?? 0) / 1000,
                  )}
                  k
                </Text>
                <Text
                  style={[styles.compLabel, { color: colors.textSecondary }]}
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
                style={[styles.compDivider, { backgroundColor: colors.border }]}
              />

              <View style={styles.compItem}>
                <Text style={[styles.compValue, { color: colors.text }]}>
                  {Math.round(
                    (comparison?.currentPeriod?.totalDurationSeconds ?? 0) /
                      3600,
                  )}
                  h
                </Text>
                <Text
                  style={[styles.compLabel, { color: colors.textSecondary }]}
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
              backgroundColor: cardBg,
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Completa entrenos para ver tus PRs
              </Text>
            </View>
          ) : (
            prs.slice(0, 8).map((pr, i) => (
              <View
                key={i}
                style={[styles.prRow, { borderBottomColor: colors.border }]}
              >
                <View style={styles.prInfo}>
                  <Text style={[styles.prName, { color: colors.text }]}>
                    {pr?.exerciseName ?? "Ejercicio"}
                  </Text>
                  <Text
                    style={[styles.prMuscle, { color: colors.textSecondary }]}
                  >
                    {pr?.muscleGroup ?? "General"}
                  </Text>
                </View>
                <View style={styles.prValues}>
                  <Text style={[styles.prWeight, { color: colors.primary }]}>
                    {pr?.personalRecord?.maxWeight ?? 0} kg
                  </Text>
                  <Text
                    style={[styles.prReps, { color: colors.textSecondary }]}
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
              backgroundColor: cardBg,
              borderColor: isDark ? "transparent" : colors.border,
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Sin datos suficientes para este período
              </Text>
            </View>
          ) : (
            <View style={{ paddingTop: SPACING.sm }}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  periodRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
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
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptyCard: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
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
    fontSize: 26,
    fontWeight: "800",
  },
  compLabel: {
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: "700",
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "800",
  },
  prReps: {
    fontSize: 13,
    fontWeight: "600",
  },
  newPrBadge: {
    marginLeft: 8,
  },
  newPrText: {
    fontSize: 16,
  },
});
