import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Minus, Plus, X } from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (sets: number, reps: number) => void;
  exerciseName: string;
  initialSets?: number;
  initialReps?: number;
  confirmButtonText?: string;
}

export default function SetRepSelectionModal({
  visible,
  onClose,
  onConfirm,
  exerciseName,
  initialSets = 3,
  initialReps = 10,
  confirmButtonText = "Agregar al Entrenamiento",
}: Props) {
  const { colors } = useTheme();
  const [sets, setSets] = useState(initialSets);
  const [reps, setReps] = useState(initialReps);

  // Update state if initial values change (e.g. when opening for a different exercise)
  React.useEffect(() => {
    if (visible) {
      setSets(initialSets);
      setReps(initialReps);
    }
  }, [visible, initialSets, initialReps]);

  const handleConfirm = () => {
    onConfirm(sets, reps);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{exerciseName}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Establecer series y repeticiones iniciales
            </Text>

            {/* Sets Selector */}
            <View style={styles.selectorRow}>
              <View style={styles.labelCol}>
                <Text style={[styles.label, { color: colors.text }]}>Series</Text>
              </View>
              <View style={[styles.controlCol, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                  onPress={() => setSets(Math.max(1, sets - 1))}
                  style={styles.stepBtn}
                >
                  <Minus size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={sets.toString()}
                  onChangeText={(val) => setSets(parseInt(val) || 1)}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => setSets(sets + 1)}
                  style={styles.stepBtn}
                >
                  <Plus size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps Selector */}
            <View style={styles.selectorRow}>
              <View style={styles.labelCol}>
                <Text style={[styles.label, { color: colors.text }]}>Repeticiones</Text>
              </View>
              <View style={[styles.controlCol, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                  onPress={() => setReps(Math.max(1, reps - 1))}
                  style={styles.stepBtn}
                >
                  <Minus size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={reps.toString()}
                  onChangeText={(val) => setReps(parseInt(val) || 1)}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => setReps(reps + 1)}
                  style={styles.stepBtn}
                >
                  <Plus size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>{confirmButtonText}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,15,42,0.85)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  labelCol: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  controlCol: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 4,
  },
  stepBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: 60,
    height: 40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
