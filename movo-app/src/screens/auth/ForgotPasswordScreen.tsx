import React from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSizes } from '../../utils/constants';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>();

    const onSubmit = async ({ email }: { email: string }) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Email enviado', 'Revisa tu bandeja para el enlace de recuperación', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0F0A1E']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.heading}>Recuperar contraseña</Text>
                    <Text style={s.sub}>Te enviaremos un enlace a tu email</Text>
                    <Controller control={control} name="email"
                        rules={{ required: 'Email obligatorio', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email no válido' } }}
                        render={({ field: { onChange, value } }) => (
                            <Input label="Email" placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none"
                                onChangeText={onChange} value={value} error={errors.email?.message}
                                leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />} />
                        )} />
                    <Button title="Enviar enlace" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth style={{ marginTop: Spacing.sm }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { flexGrow: 1, padding: Spacing['2xl'], paddingTop: 70 },
    back: { marginBottom: Spacing.xl },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
    sub: { fontSize: FontSizes.base, color: Colors.textSecondary, marginBottom: Spacing['2xl'] },
});
