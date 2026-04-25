import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BRAND, RADIUS, SHADOWS, SPACING } from '../theme/colors'; // assuming we added RADIUS, etc to colors or we use the new files

// I will import from the new theme files directly
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';

const { width } = Dimensions.get('window');

const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export default function LoginScreen({ navigation }: any) {
    const { login } = useUser();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Focus animations
    const emailFocused = useSharedValue(0);
    const passwordFocused = useSharedValue(0);

    const handleLogin = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showToast('Ingresa tu correo electrónico', 'error');
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            showToast('El correo electrónico no es válido', 'error');
            return;
        }
        if (!password) {
            showToast('Ingresa tu contraseña', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await login({ email: trimmedEmail, password });
            showToast('¡Bienvenido de vuelta!', 'success');
        } catch (error: any) {
            showToast(error.message || 'Error al iniciar sesión', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const emailStyle = useAnimatedStyle(() => ({
        borderColor: emailFocused.value ? BRAND.orange : colors.border,
        borderWidth: emailFocused.value ? 2 : 1,
        shadowOpacity: withTiming(emailFocused.value ? 0.1 : 0),
    }));

    const passwordStyle = useAnimatedStyle(() => ({
        borderColor: passwordFocused.value ? BRAND.orange : colors.border,
        borderWidth: passwordFocused.value ? 2 : 1,
        shadowOpacity: withTiming(passwordFocused.value ? 0.1 : 0),
    }));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
                        <Image 
                            source={require('../assets/Logotipo.png')} 
                            style={{ width: width * 0.6, height: 60, resizeMode: 'contain', marginBottom: spacing.md }}
                        />
                        <Text style={[typography.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                            Inicia sesión para continuar
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View style={{ marginBottom: spacing.lg }}>
                        <Text style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: '600', fontSize: 14, marginLeft: spacing.xs }}>
                            Correo electrónico
                        </Text>
                        <Animated.View style={[{ borderRadius: 20, backgroundColor: colors.card }, emailStyle]}>
                            <TextInput
                                style={{
                                    padding: spacing.md,
                                    color: colors.text,
                                    fontSize: 16,
                                    height: 56,
                                }}
                                placeholder="tucorreo@ejemplo.com"
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => emailFocused.value = withTiming(1)}
                                onBlur={() => emailFocused.value = withTiming(0)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                textContentType="emailAddress"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </Animated.View>
                    </View>

                    {/* Password Input */}
                    <View style={{ marginBottom: spacing.xxl }}>
                        <Text style={{ color: colors.text, marginBottom: spacing.sm, fontWeight: '600', fontSize: 14, marginLeft: spacing.xs }}>
                            Contraseña
                        </Text>
                        <Animated.View style={[{ borderRadius: 20, backgroundColor: colors.card }, passwordStyle]}>
                            <TextInput
                                style={{
                                    padding: spacing.md,
                                    color: colors.text,
                                    fontSize: 16,
                                    height: 56,
                                }}
                                placeholder="Tu contraseña"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => passwordFocused.value = withTiming(1)}
                                onBlur={() => passwordFocused.value = withTiming(0)}
                                secureTextEntry
                                textContentType="password"
                                autoComplete="password"
                                editable={!isLoading}
                            />
                        </Animated.View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[BRAND.orangeLight, BRAND.orangeDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                padding: spacing.md,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 60,
                                opacity: isLoading ? 0.7 : 1,
                                ...shadows.md,
                                shadowColor: BRAND.orange,
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>
                                    ENTRAR
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                            ¿No tienes cuenta?{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation?.navigate('SignUp')}
                            disabled={isLoading}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={{ color: BRAND.orange, fontSize: 15, fontWeight: 'bold' }}>
                                Regístrate
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
