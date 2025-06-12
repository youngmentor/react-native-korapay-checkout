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
  | 'ussd'
  | 'qr';

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

export const createMobileMoneyConfig = (
  baseConfig: Omit<koraConfig, 'channels' | 'default_channel'>,
  currency: MobileMoneyCurrency
): koraConfig => ({
  ...baseConfig,
  currency,
  channels: ['mobile_money'],
  default_channel: 'mobile_money',
});

export const MOBILE_MONEY_CONFIGS = {
  KENYA: {
    currency: 'KES' as MobileMoneyCurrency,
    supportedNetworks: ['M-Pesa', 'Airtel', 'Equitel'],
  },
  GHANA: {
    currency: 'GHS' as MobileMoneyCurrency,
    supportedNetworks: ['MTN Momo', 'Airtel Tigo', 'Vodafone'],
  },
  CAMEROON: {
    currency: 'XAF' as MobileMoneyCurrency,
    supportedNetworks: ['MTN', 'Orange'],
  },
  EGYPT: {
    currency: 'EGP' as MobileMoneyCurrency,
    supportedNetworks: ['MTN', 'Orange', 'Moov', 'Wave'],
  },
  IVORY_COAST: {
    currency: 'XOF' as MobileMoneyCurrency,
    supportedNetworks: ['Vodafone', 'Orange', 'Etisalat'],
  },
} as const;
