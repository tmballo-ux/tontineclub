import { Alert, Platform } from 'react-native';

/**
 * Boîte de dialogue de confirmation compatible web + natif.
 *
 * Alert.alert() de React Native ne fonctionne correctement que sur
 * iOS/Android. Sur le web, react-native-web ne gère pas de façon fiable
 * les alertes avec plusieurs boutons personnalisés (le dialogue ne
 * s'affiche pas), ce qui rendait les boutons de confirmation silencieux.
 *
 * Cette fonction utilise window.confirm() sur le web et Alert.alert()
 * sur mobile natif.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel: string,
  onConfirm: () => void | Promise<void>
) {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
