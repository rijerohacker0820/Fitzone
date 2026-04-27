import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { ACWRData } from "../types";

const { width } = Dimensions.get("window");

interface ACWRChartProps {
  data: ACWRData[];
}

export default function ACWRChart({ data }: ACWRChartProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Transform data for chart
  if (!data || data.length === 0) {
    return (
      <View
        style={{
          padding: 16,
          backgroundColor: colors.card,
          borderRadius: 16,
          margin: 16,
          height: 180,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.textSecondary }}>
          No data available for ACWR.
        </Text>
      </View>
    );
  }

  // Chart dimensions
  const chartWidth = width - 80;
  const chartHeight = 150;
  const padding = 20;

  // Calculate min/max for scaling
  const values = data.map((d) => d.ratio);
  const minValue = Math.min(...values, 0.5);
  const maxValue = Math.max(...values, 1.5);

  // Create path for line chart
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (chartWidth - padding * 2) + padding;
    const y =
      chartHeight -
      padding -
      ((d.ratio - minValue) / (maxValue - minValue)) *
        (chartHeight - padding * 2);
    return { x, y, value: d.ratio };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <View
      style={{
        padding: 20,
        backgroundColor: colors.card,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: colors.text,
              marginRight: 8,
            }}
          >
            {t("fitnessStatus")}
          </Text>
        </View>
        {/* Trend Icon Placeholder */}
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>↗</Text>
      </View>

      <Text
        style={{
          color: colors.primary,
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 20,
          textTransform: "uppercase",
        }}
      >
        {t("restDayMessage")}
      </Text>

      <View
        style={{ height: 180, alignItems: "center", justifyContent: "center" }}
      >
        <Svg height={chartHeight} width={chartWidth}>
          {/* Grid lines */}
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke={colors.textSecondary}
            strokeWidth="1"
            opacity="0.2"
          />
          <Line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke={colors.textSecondary}
            strokeWidth="1"
            opacity="0.2"
          />

          {/* Line path */}
          <Path
            d={pathData}
            stroke={colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r="4" fill={colors.primary} />
          ))}
        </Svg>
        {data.length === 0 && (
          <Text
            style={{
              position: "absolute",
              color: colors.textSecondary,
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            Log a workout to see your fitness status
          </Text>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          marginTop: 16,
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#32D74B",
              marginRight: 4,
            }}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 10,
              fontWeight: "600",
            }}
          >
            {t("optimalProgress")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
              marginRight: 4,
            }}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 10,
              fontWeight: "600",
            }}
          >
            {t("stable")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#FF453A",
              marginRight: 4,
            }}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 10,
              fontWeight: "600",
            }}
          >
            {t("fatigueRisk")}
          </Text>
        </View>
      </View>
    </View>
  );
}
