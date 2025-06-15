// index.d.ts
// Type definitions for react-native-kora-checkout
declare module 'react-native-kora-checkout' {
  export interface koraCustomer {
    name: string;
    email: string;
  }

  export interface koraMetadata {
    [key: string]: string;
  }

  export type KoraPaymentChannel =
    | 'card'
    | 'bank_transfer'
    | 'mobile_money'
    | 'pay_with_bank'
    | 'ussd';

  export type MobileMoneyCurrency = 'KES' | 'GHS' | 'XAF' | 'XOF' | 'EGP';

  export interface koraConfig {
    publicKey: string;
    reference: string;
    amount: number;
    currency?: string;
    customer: koraCustomer;
    notification_url?: string;
    narration?: string;
    channels?: KoraPaymentChannel[];
    default_channel?: KoraPaymentChannel;
    metadata?: koraMetadata;
    containerId?: string;
    merchant_bears_cost?: boolean;
  }

  export interface koraCallbacks {
    onClose?: () => void;
    onSuccess?: (data: any) => void;
    onFailed?: (data: any) => void;
    onTokenized?: (data: any) => void;
    onPending?: (data: any) => void;
  }

  export const createMobileMoneyConfig: (
    baseConfig: Omit<koraConfig, 'channels' | 'default_channel'>,
    currency: MobileMoneyCurrency
  ) => koraConfig;

  export const MOBILE_MONEY_CONFIGS: {
    readonly KENYA: {
      currency: MobileMoneyCurrency;
      supportedNetworks: string[];
    };
    readonly GHANA: {
      currency: MobileMoneyCurrency;
      supportedNetworks: string[];
    };
    readonly CAMEROON: {
      currency: MobileMoneyCurrency;
      supportedNetworks: string[];
    };
    readonly EGYPT: {
      currency: MobileMoneyCurrency;
      supportedNetworks: string[];
    };
    readonly IVORY_COAST: {
      currency: MobileMoneyCurrency;
      supportedNetworks: string[];
    };
  };

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
