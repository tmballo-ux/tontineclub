// Native implementation: Uses react-native-iap for Google Play Billing
// Only works in EAS development/production builds (NOT Expo Go)

let RNIap: any = null;
try {
  RNIap = require('react-native-iap');
} catch (e) {
  console.log('[TontineClub] react-native-iap not available (expected in Expo Go)');
}

export const IAP_AVAILABLE = !!RNIap;

export const initIAP = async (): Promise<void> => {
  if (!RNIap) return;
  try {
    await RNIap.initConnection();
    console.log('[TontineClub] IAP connection initialized');
  } catch (err: any) {
    console.log('[TontineClub] IAP init error (normal in Expo Go):', err.message);
  }
};

export const endIAP = (): void => {
  if (!RNIap) return;
  try {
    RNIap.endConnection();
  } catch (e) {}
};

export const purchaseSubscription = async (productId: string): Promise<{ purchaseToken: string } | null> => {
  if (!RNIap) {
    console.log('[TontineClub] IAP not available, cannot purchase');
    return null;
  }
  
  // Get subscription products from Google Play
  const subscriptions = await RNIap.getSubscriptions({ skus: [productId] });
  
  if (!subscriptions || subscriptions.length === 0) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  // Request purchase from Google Play (Google handles trial + payment UI)
  const purchase = await RNIap.requestSubscription({
    sku: productId,
    ...(subscriptions[0]?.subscriptionOfferDetails?.[0]?.offerToken
      ? { subscriptionOffers: [{ sku: productId, offerToken: subscriptions[0].subscriptionOfferDetails[0].offerToken }] }
      : {}),
  });

  if (purchase) {
    const purchaseToken = purchase.purchaseToken || purchase.transactionReceipt;
    return { purchaseToken };
  }
  return null;
};

export const acknowledgeSubscription = async (token: string): Promise<void> => {
  if (!RNIap) return;
  try {
    await RNIap.acknowledgePurchaseAndroid({ token });
  } catch (err) {
    console.log('[TontineClub] Acknowledge error (may already be acknowledged):', err);
  }
};
