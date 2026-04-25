import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { register, RegisterRequest } from '../services/authService';

// Email regex validation
const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export default function SignUpScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [documentId, setDocumentId] = useState('');
    const [gymId, setGymId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        // ── Front-end validations ──
        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedDoc = documentId.trim();

        if (!trimmedName) {
            showToast('Ingresa tu nombre completo', 'error');
            return;
        }
        if (!trimmedEmail) {
            showToast('Ingresa tu correo electrónico', 'error');
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            showToast('El correo electrónico no es válido', 'error');
            return;
        }
        if (!password) {
            showToast('Ingresa una contraseña', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Las contraseñas no coinciden', 'error');
            return;
        }
        if (!trimmedDoc) {
            showToast('Ingresa tu número de documento/cédula', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const payload: RegisterRequest = {
                fullName: trimmedName,
                email: trimmedEmail,
                password,
                documentId: trimmedDoc,
            };

            // Only include gymId if provided
            if (gymId.trim()) {
                payload.gymId = gymId.trim();
            }

            await register(payload);
            showToast('¡Registro exitoso! Ahora inicia sesión.', 'success');
            navigation?.navigate('Login');
        } catch (error: any) {
            showToast(error.message || 'Error al registrarse', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.secondary + '40',
        fontSize: 16,
    };

    const labelStyle = {
        color: colors.text,
        marginBottom: 6,
        fontWeight: '600' as const,
        fontSize: 14,
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Header ── */}
                    <View style={{ marginTop: 20, marginBottom: 32 }}>
                        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>
                            FitZone
                        </Text>
                        <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
                            Crear cuenta
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                            Completa los datos para registrarte
                        </Text>
                    </View>

                    {/* ── Full Name ── */}
                    <View style={{ marginBottom: 14 }}>
                        <Text style={labelStyle}>Nombre completo *</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Juan Pérez"
                            placeholderTextColor={colors.textSecondary}
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Email ── */}
                    <View style={{ marginBottom: 14 }}>
                        <Text style={labelStyle}>Correo electrónico *</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="tucorreo@ejemplo.com"
                            placeholderTextColor={colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            autoComplete="email"
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Document ID ── */}
                    <View style={{ marginBottom: 14 }}>
                        <Text style={labelStyle}>Cédula / Documento *</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="V-12345678"
                            placeholderTextColor={colors.textSecondary}
                            value={documentId}
                            onChangeText={setDocumentId}
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Password ── */}
                    <View style={{ marginBottom: 14 }}>
                        <Text style={labelStyle}>Contraseña *</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            textContentType="newPassword"
                            autoComplete="password-new"
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Confirm Password ── */}
                    <View style={{ marginBottom: 14 }}>
                        <Text style={labelStyle}>Confirmar contraseña *</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Repite tu contraseña"
                            placeholderTextColor={colors.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Gym ID (optional) ── */}
                    <View style={{ marginBottom: 28 }}>
                        <Text style={labelStyle}>Código del gimnasio (opcional)</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="Si tienes uno, ingrésalo aquí"
                            placeholderTextColor={colors.textSecondary}
                            value={gymId}
                            onChangeText={setGymId}
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>

                    {/* ── Register Button ── */}
                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={isLoading}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: colors.primary,
                            padding: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                            opacity: isLoading ? 0.7 : 1,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={{ color: '#FFF', fontSize: 17, fontWeight: 'bold' }}>
                                Registrarse
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* ── Login Link ── */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 30 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                            ¿Ya tienes cuenta?{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation?.navigate('Login')}
                            disabled={isLoading}
                        >
                            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: 'bold' }}>
                                Inicia sesión
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
