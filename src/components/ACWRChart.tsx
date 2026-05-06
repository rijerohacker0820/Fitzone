import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { getWorkoutLogs } from "../services/storage";
import { WorkoutRoutine, Exercise } from "../types";
import { TrendingUp, Clock, Dumbbell } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface StatsData {
  weeklyVolume: { week: string; volume: number }[];
  maxWeights: { exercise: string; weight: number }[];
  avgDuration: number;
  totalWorkouts: number;
  totalVolume: number;
}

export default function PerformanceChart() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [stats, setStats] = useState<StatsData>({
    weeklyVolume: [],
    maxWeights: [],
    avgDuration: 0,
    totalWorkouts: 0,
    totalVolume: 0,
  });
  const [activeTab, setActiveTab] = useState<"volume" | "duration">("volume");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const logs = await getWorkoutLogs();
    if (!logs || logs.length === 0) {
      setStats({
        weeklyVolume: [],
        maxWeights: [],
        avgDuration: 0,
        totalWorkouts: 0,
        totalVolume: 0,
      });
      return;
    }

    // Calculate weekly volume
    const now = new Date();
    const weeklyData: { [key: string]: number } = {};
    const weeklyDuration: { [key: string]: number[] } = {};

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const key = `S${4 - i}`;
      weeklyData[key] = 0;
      weeklyDuration[key] = [];
    }

    // Max weights per exercise
    const maxWeightMap: { [exercise: string]: number } = {};

    logs.forEach((log: WorkoutRoutine) => {
      const logDate = new Date(log.date);
      const weeksAgo = Math.floor(
        (now.getTime() - logDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      if (weeksAgo >= 0 && weeksAgo < 4) {
        const weekKey = `S${4 - weeksAgo}`;
        let logVolume = 0;

        log.exercises?.forEach((ex: Exercise) => {
          ex.sets?.forEach((set) => {
            if (set.status === "completed" || set.status === "partial") {
              logVolume += set.reps * set.weight;
              if (!maxWeightMap[ex.name] || set.weight > maxWeightMap[ex.name]) {
                maxWeightMap[ex.name] = set.weight;
              }
            }
          });
        });

        if (weeklyData[weekKey] !== undefined) {
          weeklyData[weekKey] += logVolume;
        }
        if (weeklyDuration[weekKey]) {
          weeklyDuration[weekKey].push(log.duration || 0);
        }
      }
    });

    const weeklyVolume = Object.entries(weeklyData).map(([week, volume]) => ({
      week,
      volume,
    }));

    const maxWeights = Object.entries(maxWeightMap)
      .map(([exercise, weight]) => ({ exercise, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    const allDurations = logs
      .filter((l: WorkoutRoutine) => l.duration > 0)
      .map((l: WorkoutRoutine) => l.duration);

    const avgDuration =
      allDurations.length > 0
        ? Math.round(
            allDurations.reduce((a: number, b: number) => a + b, 0) /
              allDurations.length /
              60,
          )
        : 0;

    const totalVolume = logs.reduce((sum: number, log: WorkoutRoutine) => {
      let vol = 0;
      log.exercises?.forEach((ex: Exercise) => {
        ex.sets?.forEach((set) => {
          if (set.status === "completed" || set.status === "partial") {
            vol += set.reps * set.weight;
          }
        });
      });
      return sum + vol;
    }, 0);

    setStats({
      weeklyVolume,
      maxWeights,
      avgDuration,
      totalWorkouts: logs.length,
      totalVolume,
    });
  };

  // Chart dimensions
  const chartWidth = width - 100;
  const chartHeight = 120;
  const padding = 16;

  const renderChart = () => {
    const data = stats.weeklyVolume;
    if (!data || data.length === 0) return null;

    const values = data.map((d) => d.volume);
    const maxValue = Math.max(...values, 1);

    const points = data.map((d, i) => {
      const x =
        padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
      const y =
        chartHeight - padding - (d.volume / maxValue) * (chartHeight - padding * 2);
      return { x, y, value: d.volume };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Area path
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

    return (
      <View style={{ alignItems: "center" }}>
        <Svg height={chartHeight} width={chartWidth}>
          <Defs>
            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0.02" />
            </SvgGradient>
          </Defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct, i) => (
            <Line
              key={i}
              x1={padding}
              y1={padding + pct * (chartHeight - padding * 2)}
              x2={chartWidth - padding}
              y2={padding + pct * (chartHeight - padding * 2)}
              stroke={colors.textSecondary}
              strokeWidth="0.5"
              opacity="0.15"
            />
          ))}

          {/* Area fill */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <Path
            d={pathData}
            stroke={colors.primary}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={colors.primary}
              stroke={colors.card}
              strokeWidth="2"
            />
          ))}
        </Svg>

        {/* X-axis labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: chartWidth - padding * 2,
            marginTop: 4,
          }}
        >
          {data.map((d, i) => (
            <Text
              key={i}
              style={{
                color: colors.textSecondary,
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              {d.week}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const hasData = stats.totalWorkouts > 0;

  return (
    <View
      style={{
        padding: 20,
        backgroundColor: colors.card,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border + "30",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TrendingUp size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: colors.text,
            }}
          >
            Tu Rendimiento
          </Text>
        </View>
      </View>

      {!hasData ? (
        <View
          style={{
            height: 120,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Registra un entrenamiento para ver tu progreso
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Summary Row */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 16,
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {stats.totalWorkouts}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                Entrenos
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#00D68F",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {stats.avgDuration}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                Min/sesión
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#F59E0B",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {stats.totalVolume > 1000
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                  : stats.totalVolume}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: "600",
                  marginTop: 2,
                }}
              >
                Vol. Total (kg)
              </Text>
            </View>
          </View>

          {/* Chart */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 11,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Volumen Semanal
          </Text>
          {renderChart()}

          {/* Max Weights */}
          {stats.maxWeights.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Peso Máximo
              </Text>
              {stats.maxWeights.map((mw, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                    borderBottomWidth: i < stats.maxWeights.length - 1 ? 1 : 0,
                    borderBottomColor: colors.background,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Dumbbell size={14} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {mw.exercise}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    {mw.weight} kg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
