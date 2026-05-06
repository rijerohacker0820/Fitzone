import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { X, Dumbbell, Play, Sparkles, Zap } from "lucide-react-native";
import { useLanguage } from "../context/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  onBuild: () => void;
  onExisting?: () => void;
}

export default function FABMenu({
  visible,
  onClose,
  onAdd,
  onBuild,
  onExisting,
}: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.overlay}>
        <View style={styles.overlayBg}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Build Option */}
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + "40" }]}
              onPress={() => {
                onClose();
                setTimeout(onBuild, 100);
              }}
            >
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Crear Rutina</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  CREAR NUEVA RUTINA REUTILIZABLE
                </Text>
              </View>
              <LinearGradient
                colors={["#49b8bf", "#1a45b8"]}
                style={styles.iconContainer}
              >
                <Dumbbell size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Existing Option */}
            {onExisting && (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + "40" }]}
                onPress={() => {
                  onClose();
                  setTimeout(onExisting, 100);
                }}
              >
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>Rutina Existente</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    COMENZAR DESDE GUARDADA
                  </Text>
                </View>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#F59E0B20" }]}
                >
                  <Play size={24} color="#F59E0B" fill="#F59E0B" />
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Workout Option */}
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + "40" }]}
              onPress={() => {
                onClose();
                setTimeout(onAdd, 100);
              }}
            >
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Nuevo Entrenamiento</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  SESIÓN RÁPIDA SIN PLANTILLA
                </Text>
              </View>
              <View
                style={[styles.iconContainer, { backgroundColor: "#00D68F20" }]}
              >
                <Zap size={24} color="#00D68F" />
              </View>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.border + "40" }]}
            >
              <X color={colors.textSecondary} size={30} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  overlayBg: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 42, 0.85)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  container: {
    paddingRight: 20,
    paddingBottom: 30,
    alignItems: "flex-end",
  },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 10,
  },
});
