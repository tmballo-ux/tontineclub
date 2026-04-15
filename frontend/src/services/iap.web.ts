// Web implementation: react-native-iap is NOT available on web
// Uses backend API directly for subscription management

export const IAP_AVAILABLE = false;

export const initIAP = async (): Promise<void> => {
  console.log('[TontineClub] IAP not available on web');
};

export const endIAP = (): void => {};

export const purchaseSubscription = async (_productId: string): Promise<{ purchaseToken: string } | null> => {
  console.log('[TontineClub] Google Play purchase not available on web');
  return null;
};

export const acknowledgeSubscription = async (_token: string): Promise<void> => {};
