import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface UserCardProps {
    user: User;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
}

export const UserCard: React.FC<UserCardProps> = ({ user, subtitle, onPress, rightElement }) => {
    const Wrapper: any = onPress ? TouchableOpacity : View;
    return (
        <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.75}>
            {user.avatar_url
                ? <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>{user.full_name?.[0] ?? '?'}</Text>
                    </View>
                )
            }
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{user.full_name}</Text>
                {subtitle
                    ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    : <Text style={styles.subtitle} numberOfLines={1}>{user.email}</Text>
                }
            </View>
            {rightElement ?? (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />)}
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
    avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: Colors.border },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
    avatarInitial: { color: Colors.primary, fontWeight: '800', fontSize: FontSizes.base },
    info: { flex: 1 },
    name: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.base },
    subtitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 1 },
});
