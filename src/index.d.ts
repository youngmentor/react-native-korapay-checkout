declare module 'react-native-kora-checkout' {
  export interface koraCustomer {
    name: string;
    email: string;
  }

  export interface koraConfig {
    publicKey: string;
    reference: string;
    amount: number;
    currency: string;
    customer: koraCustomer;
  }

  export interface koraCallbacks {
    onClose?: () => void;
    onSuccess?: (data: any) => void;
    onFailed?: (data: any) => void;
  }

  export function usekoraCheckout(params: {
    paymentDetails: koraConfig;
    onClose?: () => void;
    onSuccess?: (data: any) => void;
    onFailed?: (data: any) => void;
  }): {
    CheckoutComponent: () => JSX.Element | null;
    initiatePayment: () => void;
  };
}
