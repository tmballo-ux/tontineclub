import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type PaymentStatus = 'not_announced' | 'announced' | 'confirmed' | 'contested';
type TontineStatus = 'draft' | 'active' | 'completed';
type InvitationStatus = 'pending' | 'accepted' | 'rejected';

type Status = PaymentStatus | TontineStatus | InvitationStatus;

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const getStatusConfig = (status: Status) => {
  switch (status) {
    // Payment statuses
    case 'not_announced':
      return { label: 'Non annoncé', color: colors.statusNotAnnounced, bg: '#F1F5F9' };
    case 'announced':
      return { label: 'Annoncé', color: colors.statusAnnounced, bg: '#FEF3C7' };
    case 'confirmed':
      return { label: 'Confirmé', color: colors.statusConfirmed, bg: '#D1FAE5' };
    case 'contested':
      return { label: 'Contesté', color: colors.statusContested, bg: '#FEE2E2' };
    // Tontine statuses
    case 'draft':
      return { label: 'Brouillon', color: colors.textSecondary, bg: '#F1F5F9' };
    case 'active':
      return { label: 'Active', color: colors.success, bg: '#D1FAE5' };
    case 'completed':
      return { label: 'Terminée', color: colors.primary, bg: '#DBEAFE' };
    // Invitation statuses
    case 'pending':
      return { label: 'En attente', color: colors.warning, bg: '#FEF3C7' };
    case 'accepted':
      return { label: 'Acceptée', color: colors.success, bg: '#D1FAE5' };
    case 'rejected':
      return { label: 'Refusée', color: colors.error, bg: '#FEE2E2' };
    default:
      return { label: status, color: colors.textSecondary, bg: '#F1F5F9' };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }, size === 'sm' && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 12,
  },
});
