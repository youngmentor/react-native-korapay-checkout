export interface KorapayCustomer {
  name: string;
  email: string;
}

export interface KorapayMetadata {
  [key: string]: string;
}

export interface KorapayConfig {
  publicKey: string;
  reference: string;
  amount: number;
  currency?: string;
  customer: KorapayCustomer;
  notification_url?: string;
  narration?: string;
  channels?: string[];
  default_channel?: string;
  metadata?: KorapayMetadata;
  containerId?: string;
  merchant_bears_cost?: boolean;
}

export interface KorapayCallbacks {
  onClose?: () => void;
  onSuccess?: (data: any) => void;
  onFailed?: (data: any) => void;
  onTokenized?: (data: any) => void;
  onPending?: (data: any) => void;
}
