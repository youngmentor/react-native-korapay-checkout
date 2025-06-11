export interface koraCustomer {
  name: string;
  email: string;
}

export interface koraMetadata {
  [key: string]: string;
}

export interface koraConfig {
  publicKey: string;
  reference: string;
  amount: number;
  currency?: string;
  customer: koraCustomer;
  notification_url?: string;
  narration?: string;
  channels?: string[];
  default_channel?: string;
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
