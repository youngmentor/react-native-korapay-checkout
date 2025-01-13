declare module 'react-native-korapay-checkout' {
  export interface KorapayCustomer {
    name: string;
    email: string;
  }

  export interface KorapayConfig {
    publicKey: string;
    reference: string;
    amount: number;
    currency: string;
    customer: KorapayCustomer;
  }

  export interface KorapayCallbacks {
    onClose?: () => void;
    onSuccess?: (data: any) => void;
    onFailed?: (data: any) => void;
  }

  export function useKorapayCheckout(params: {
    paymentDetails: KorapayConfig;
    onClose?: () => void;
    onSuccess?: (data: any) => void;
    onFailed?: (data: any) => void;
  }): {
    CheckoutComponent: () => JSX.Element | null;
    initiatePayment: () => void;
  };
}
