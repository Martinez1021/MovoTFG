import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { MovoLogo } from '../../components/ui/MovoLogo';

interface LoginForm {
    email: string;
    password: string;
}

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { login, isLoading } = useAuthStore();
    const [showPass, setShowPass] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        setErrorMsg(null);
        try {
            await login(data.email, data.password);
        } catch (e: any) {
            setErrorMsg(e.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
        }
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0F0A1E']} style={styles.root}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Logo */}
                    <View style={styles.logoWrap}>
                        <MovoLogo size={80} />
                    </View>

                    <Text style={styles.heading}>Bienvenido de vuelta</Text>
                    <Text style={styles.sub}>Accede a tu entrenamiento personalizado</Text>

                    <View style={styles.form}>
                        <Controller
                            control={control}
                            name="email"
                            rules={{ required: 'Email obligatorio', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email no válido' } }}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Email"
                                    placeholder="tu@email.com"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.email?.message}
                                    leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="password"
                            rules={{ required: 'Contraseña obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Contraseña"
                                    placeholder="••••••••"
                                    secureTextEntry={!showPass}
                                    onChangeText={onChange}
                                    value={value}
                                    error={errors.password?.message}
                                    leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
                                    rightIcon={
                                        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    }
                                />
                            )}
                        />

                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        {errorMsg && (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle-outline" size={16} color="#ff4444" />
                                <Text style={styles.errorBannerText}>{errorMsg}</Text>
                            </View>
                        )}

                        <Button
                            title="Iniciar sesión"
                            onPress={handleSubmit(onSubmit)}
                            loading={isLoading}
                            fullWidth
                            style={styles.btn}
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.divText}>o</Text>
                            <View style={styles.line} />
                        </View>

                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Regístrate gratis</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    kav: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing['2xl'] },
    logoWrap: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    brand: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 6 },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
    sub: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] },
    form: {},
    forgot: { alignSelf: 'flex-end', marginBottom: Spacing.base },
    forgotText: { color: Colors.primary, fontSize: FontSizes.sm },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ff444422', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: '#ff444444' },
    errorBannerText: { flex: 1, color: '#ff6666', fontSize: FontSizes.sm, lineHeight: 18 },
    btn: { marginTop: Spacing.sm },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
    line: { flex: 1, height: 1, backgroundColor: Colors.border },
    divText: { color: Colors.textSecondary, marginHorizontal: Spacing.md, fontSize: FontSizes.sm },
    registerRow: { flexDirection: 'row', justifyContent: 'center' },
    registerText: { color: Colors.textSecondary, fontSize: FontSizes.base },
    registerLink: { color: Colors.primary, fontSize: FontSizes.base, fontWeight: '700' },
});
