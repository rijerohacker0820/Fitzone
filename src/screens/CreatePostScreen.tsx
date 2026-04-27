import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Camera, Dumbbell, X, ChevronDown, Send } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useToast } from "../components/Toast";
import { createPost } from "../services/socialService";
import { uploadImage } from "../services/uploadService";
import { getWorkoutLogs } from "../services/storage";
import { WorkoutRoutine, PostCreatePayload } from "../types";
import { SPACING, RADIUS } from "../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRoutine | null>(
    null,
  );
  const [workouts, setWorkouts] = useState<WorkoutRoutine[]>([]);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isDark = colors.background !== "#F8FAFC";

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const logs = await getWorkoutLogs();
      setWorkouts(logs.slice(0, 20)); // Last 20
    } catch (e) {
      console.error("Failed to load workouts:", e);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      showToast("Error al seleccionar imagen", "error");
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUri && !selectedWorkout) {
      showToast("Escribe algo, selecciona una imagen o un entreno", "error");
      return;
    }

    setPosting(true);
    try {
      let imageUrl: string | undefined;

      // Upload image first if selected
      if (imageUri) {
        setUploading(true);
        imageUrl = await uploadImage(imageUri);
        setUploading(false);
      }

      // Determine post type
      let type = "Text";
      if (imageUrl && selectedWorkout) type = "Workout";
      else if (imageUrl) type = "Image";
      else if (selectedWorkout) type = "Workout";

      const payload: PostCreatePayload = {
        content: content.trim(),
        type,
      };
      if (imageUrl) payload.imageUrl = imageUrl;
      if (selectedWorkout) payload.workoutId = selectedWorkout.id;

      await createPost(payload);
      showToast("Post publicado 🎉", "success");
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || "Error al publicar", "error");
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const canPost = content.trim() || imageUri || selectedWorkout;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Nuevo Post
        </Text>
        <TouchableOpacity
          style={[
            styles.postBtn,
            {
              backgroundColor:
                canPost && !posting ? colors.primary : colors.border,
            },
          ]}
          onPress={handlePost}
          disabled={!canPost || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.postBtnText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* User info */}
        <View style={styles.userRow}>
          <Image
            source={{ uri: user?.avatarUrl || "https://i.pravatar.cc/150" }}
            style={styles.avatar}
          />
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || "User"}
          </Text>
        </View>

        {/* Text input */}
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          placeholder="¿Cómo fue tu entreno hoy?"
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
        />

        {/* Image preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setImageUri(null)}
            >
              <X size={18} color="#FFF" />
            </TouchableOpacity>
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.uploadText}>Subiendo...</Text>
              </View>
            )}
          </View>
        )}

        {/* Selected workout */}
        {selectedWorkout && (
          <View
            style={[
              styles.workoutPreview,
              { backgroundColor: isDark ? "#1A1A2E" : "#F0F4FF" },
            ]}
          >
            <View style={styles.workoutPreviewHeader}>
              <Text style={styles.workoutEmoji}>🏋️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.workoutName, { color: colors.text }]}>
                  {selectedWorkout.name}
                </Text>
                <Text
                  style={[
                    styles.workoutDetail,
                    { color: colors.textSecondary },
                  ]}
                >
                  {selectedWorkout.exercises.length} ejercicios ·{" "}
                  {Math.round(selectedWorkout.duration / 60)} min
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedWorkout(null)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom toolbar */}
      <View
        style={[
          styles.toolbar,
          { borderTopColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <TouchableOpacity style={styles.toolBtn} onPress={pickImage}>
          <Camera size={22} color={colors.primary} />
          <Text style={[styles.toolLabel, { color: colors.primary }]}>
            Foto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setShowWorkoutPicker(!showWorkoutPicker)}
        >
          <Dumbbell size={22} color={colors.primary} />
          <Text style={[styles.toolLabel, { color: colors.primary }]}>
            Entreno
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout picker */}
      {showWorkoutPicker && (
        <View
          style={[
            styles.workoutPicker,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.pickerTitle, { color: colors.text }]}>
            Selecciona un entreno
          </Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {workouts.length === 0 ? (
              <Text
                style={[styles.noWorkouts, { color: colors.textSecondary }]}
              >
                No tienes entrenos recientes
              </Text>
            ) : (
              workouts.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.workoutOption,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedWorkout(w);
                    setShowWorkoutPicker(false);
                  }}
                >
                  <Text
                    style={[styles.workoutOptionName, { color: colors.text }]}
                  >
                    {w.name}
                  </Text>
                  <Text
                    style={[
                      styles.workoutOptionDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {new Date(w.date).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  postBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: SPACING.sm,
  },
  textInput: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
  },
  imagePreviewContainer: {
    position: "relative",
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: RADIUS.lg,
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RADIUS.lg,
  },
  uploadText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  workoutPreview: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  workoutPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: "700",
  },
  workoutDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  toolbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  workoutPicker: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  noWorkouts: {
    textAlign: "center",
    paddingVertical: SPACING.lg,
    fontSize: 14,
  },
  workoutOption: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  workoutOptionName: {
    fontSize: 14,
    fontWeight: "600",
  },
  workoutOptionDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
