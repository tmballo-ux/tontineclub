import { useRouter } from 'expo-router';

/**
 * Hook de navigation "retour" fiable, y compris après un rafraîchissement
 * de page (F5) sur le web.
 *
 * router.back() d'expo-router s'appuie sur l'historique interne du
 * routeur. Après un F5 sur une page profonde (ex: /tontine/123), cet
 * historique est vide même si l'utilisateur "vient" logiquement d'un
 * écran parent — le bouton retour ne fait alors plus rien.
 *
 * useSafeGoBack renvoie une fonction qui utilise router.back() quand
 * c'est possible, et se replie sur une route de secours sinon.
 */
export function useSafeGoBack(fallbackRoute: string) {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };
}
