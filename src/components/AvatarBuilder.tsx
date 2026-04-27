import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { generateAvatar } from "../services/gemini";
import { Image as ImageIcon, Wand2 } from "lucide-react-native";

export default function AvatarBuilder() {
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState("Athletic cyberpunk runner");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const url = await generateAvatar(prompt);
    setImageUrl(url);
    setLoading(false);
  };

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        margin: 16,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <Wand2 color={colors.primary} size={24} />
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: 8,
          }}
        >
          Avatar Builder
        </Text>
      </View>

      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        Describe your avatar
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.background,
            color: colors.text,
            padding: 12,
            borderRadius: 12,
          }}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g. Futuristic boxer"
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 12,
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Wand2 color={colors.background} size={20} />
          )}
        </TouchableOpacity>
      </View>

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            marginTop: 16,
            backgroundColor: colors.background,
          }}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            marginTop: 16,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon color={colors.textSecondary} size={48} />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            Preview
          </Text>
        </View>
      )}
    </View>
  );
}
