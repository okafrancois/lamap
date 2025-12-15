import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useClerk } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const { userId, isSignedIn, clerkUser } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { clerkId: userId } : 'skip'
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Veuillez vous connecter</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Avatar
            name={user?.username || clerkUser?.username || 'User'}
            imageUrl={clerkUser?.imageUrl}
            size={80}
          />
          <Text style={styles.username}>
            {user?.username || clerkUser?.username || 'Utilisateur'}
          </Text>
          {user?.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalWins || 0}</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalLosses || 0}</Text>
              <Text style={styles.statLabel}>Défaites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user?.totalWins && user?.totalLosses
                  ? Math.round((user.totalWins / (user.totalWins + user.totalLosses)) * 100)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Taux de victoire</Text>
            </View>
          </View>
        </View>

        <View style={styles.koraSection}>
          <View style={styles.koraCard}>
            <Text style={styles.koraLabel}>Solde Kora</Text>
            <Text style={styles.koraAmount}>
              {user?.koraBalance?.toLocaleString() || 0}
            </Text>
            <Badge label="Kora" variant="kora" style={styles.badge} />
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Button
            title="Déconnexion"
            onPress={handleSignOut}
            variant="secondary"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.derived.blueDark,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.derived.white,
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    color: Colors.derived.blueLight,
    marginTop: 4,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.derived.white,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.derived.blueLight,
    textAlign: 'center',
  },
  koraSection: {
    marginBottom: 24,
  },
  koraCard: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary.gold,
  },
  koraLabel: {
    fontSize: 16,
    color: Colors.derived.blueLight,
    marginBottom: 8,
  },
  koraAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary.gold,
    marginBottom: 12,
  },
  badge: {
    marginTop: 8,
  },
  actionsSection: {
    marginTop: 24,
  },
  text: {
    color: Colors.derived.white,
  },
});

