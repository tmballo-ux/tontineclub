import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTontineStore, Invitation } from '@/src/store/tontineStore';
import { colors } from '@/src/theme/colors';
import { Card } from '@/src/components/Card';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Button } from '@/src/components/Button';

export default function InvitationsScreen() {
  const { invitations, fetchInvitations, acceptInvitation, rejectInvitation, isLoading } = useTontineStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    await fetchInvitations();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (invitation: Invitation) => {
    setLoadingId(invitation.id);
    try {
      await acceptInvitation(invitation.id);
      Alert.alert('Succès', 'Invitation acceptée!');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = (invitation: Invitation) => {
    Alert.alert(
      'Refuser l\'invitation',
      `Voulez-vous vraiment refuser l'invitation pour "${invitation.tontine_name}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            setLoadingId(invitation.id);
            try {
              await rejectInvitation(invitation.id);
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const otherInvitations = invitations.filter((inv) => inv.status !== 'pending');

  const renderInvitation = ({ item }: { item: Invitation }) => (
    <Card style={styles.invitationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons
            name={item.status === 'pending' ? 'mail-unread' : 'mail'}
            size={24}
            color={item.status === 'pending' ? colors.warning : colors.textSecondary}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.tontineName}>{item.tontine_name}</Text>
          <Text style={styles.inviterText}>Invitation de {item.inviter_name}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
        <StatusBadge status={item.status} size="sm" />
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            title="Accepter"
            onPress={() => handleAccept(item)}
            variant="primary"
            size="sm"
            loading={loadingId === item.id}
            style={styles.acceptButton}
          />
          <Button
            title="Refuser"
            onPress={() => handleReject(item)}
            variant="outline"
            size="sm"
            disabled={loadingId === item.id}
          />
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Invitations</Text>
        {pendingInvitations.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingInvitations.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={[...pendingInvitations, ...otherInvitations]}
        keyExtractor={(item) => item.id}
        renderItem={renderInvitation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="mail-outline" size={64} color={colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Aucune invitation</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore reçu d'invitation à rejoindre une tontine.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  badge: {
    marginLeft: 8,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  invitationCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  tontineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  inviterText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acceptButton: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
