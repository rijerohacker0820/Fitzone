import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Calendar, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "./AnimatedButton";

interface Props {
  onLogPress?: () => void;
  onSchedulePress?: () => void;
}

export default function ActionButtons({ onLogPress, onSchedulePress }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
      <AnimatedButton
        onPress={onSchedulePress}
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border || "#1a45b8",
          height: 100,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#1E293B",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Calendar size={20} color={colors.text} />
        </View>
        <Text
          style={{ color: colors.text, fontWeight: "bold", fontSize: 15 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Ver Horario
        </Text>
      </AnimatedButton>

      {/* Log Workout Button */}
      <AnimatedButton
        onPress={onLogPress}
        style={{
          flex: 1,
        }}
      >
        <LinearGradient
          colors={["#49b8bf", "#1a45b8"]}
          style={{
            flex: 1,
            borderRadius: 20,
            padding: 16,
            alignItems: "center",
            justifyContent: "center",
            height: 100,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={3} />
          </View>
          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "bold",
              fontSize: 15,
              textAlign: "center",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Nuevo Entrenamiento
          </Text>
        </LinearGradient>
      </AnimatedButton>
    </View>
  );
}
