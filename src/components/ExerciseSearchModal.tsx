import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { COMMON_EXERCISES } from "../data/exercises";
import { X, Search, Trash2 } from "lucide-react-native";
import { Exercise } from "../types";

import SetRepSelectionModal from "./SetRepSelectionModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exerciseName: string, sets: number, reps: number) => void;
  addedExercises: Exercise[];
  onRemove: (id: string) => void;
}

export default function ExerciseSearchModal({
  visible,
  onClose,
  onSelect,
  addedExercises,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(COMMON_EXERCISES);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.length > 0) {
      const filtered = COMMON_EXERCISES.filter((ex) =>
        ex.toLowerCase().includes(text.toLowerCase()),
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(COMMON_EXERCISES);
    }
  };

  const handleConfirmSelection = (sets: number, reps: number) => {
    if (selectedExercise) {
      onSelect(selectedExercise, sets, reps);
      setSelectedExercise(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Add Exercise
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        {/* Added Exercises Preview */}
        {addedExercises.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 12,
                letterSpacing: 0.5,
              }}
            >
              SELECTED EXERCISES ({addedExercises.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {addedExercises.map((ex) => (
                  <View
                    key={ex.id}
                    style={{
                      backgroundColor: colors.primary + "10",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        marginRight: 8,
                      }}
                    >
                      {ex.name}
                    </Text>
                    <TouchableOpacity onPress={() => onRemove(ex.id)}>
                      <X size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: "#E2E8F0" },
          ]}
        >
          <Search
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercise..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
            value={search}
            onChangeText={handleSearch}
          />
        </View>

        {/* Suggestions List */}
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: "#F1F5F9" }]}
              onPress={() => setSelectedExercise(item)}
            >
              <Text style={[styles.itemText, { color: colors.text }]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 150 }}
        />

        <SetRepSelectionModal
          visible={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onConfirm={handleConfirmSelection}
          exerciseName={selectedExercise || ""}
        />

        {/* Footer with Done button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF", // Solid background
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  doneButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
