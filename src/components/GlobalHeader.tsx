import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { shadows } from "../theme/shadows";

const { width } = Dimensions.get("window");

interface GlobalHeaderProps {
  title?: string;
  showProfile?: boolean;
  onProfilePress?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export default function GlobalHeader({
  title,
  showProfile = true,
  onProfilePress,
  leftAction,
  rightAction,
}: GlobalHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { colors } = useTheme();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      navigation.navigate("Profile");
    }
  };

  const headerHeight = Platform.OS === "ios" ? 44 : 56;
  const totalHeight = headerHeight + insets.top;

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      {Platform.OS === "web" ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(5, 15, 42, 0.85)",
              backdropFilter: "blur(10px)",
            } as any,
          ]}
        />
      ) : (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      <View
        style={[
          styles.content,
          { marginTop: insets.top, height: headerHeight },
        ]}
      >
        {leftAction ? (
          <View style={styles.side}>{leftAction}</View>
        ) : (
          <View style={styles.side} /> // Placeholder for balance
        )}

        <View style={styles.center}>
          {title ? (
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            <Image
              source={require("../assets/Imagotipo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </View>

        {rightAction ? (
          <View style={styles.sideRight}>{rightAction}</View>
        ) : showProfile ? (
          <View style={styles.sideRight}>
            <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
              <View
                style={[
                  styles.avatarContainer,
                  { borderColor: colors.primary },
                ]}
              >
                {user?.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sideRight} /> // Placeholder
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...shadows.sm, // Adds subtle drop shadow
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  side: {
    flex: 1,
    alignItems: "flex-start",
  },
  center: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sideRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    height: 40,
    width: 140,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
