import { useRef, useCallback, useState } from 'react';
import WebView from 'react-native-webview';
import { StyleSheet, View, Dimensions } from 'react-native';
import type { koraConfig } from '../types/Ikoraprops';

export const useKoraCheckout = ({
  paymentDetails,
  onClose,
  onSuccess,
  onFailed,
  onPending,
  onTokenized,
}: {
  paymentDetails: koraConfig;
  onClose?: () => void;
  onSuccess?: (data: any) => void;
  onFailed?: (data: any) => void;
  onPending?: (data: any) => void;
  onTokenized?: (data: any) => void;
}) => {
  const webViewRef = useRef<WebView | null>(null);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  // Helper function to safely stringify values for injection
  const safeStringify = (value: any) => {
    if (value === undefined || value === null) return 'undefined';
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
    return JSON.stringify(value);
  };

  const injectedJavaScript = `
  (function() {
    const script = document.createElement('script');
    script.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js';
    script.async = true;

    script.onload = function () {
      if (window.Korapay) {
        window.ReactNativeWebView.postMessage('SCRIPT_LOADED');
        try {
          const koraConfig = {
            key: ${safeStringify(paymentDetails.publicKey)},
            reference: ${safeStringify(paymentDetails.reference)},
            amount: ${paymentDetails.amount},
            currency: ${safeStringify(paymentDetails.currency || 'NGN')},
            customer: {
              name: ${safeStringify(paymentDetails.customer.name)},
              email: ${safeStringify(paymentDetails.customer.email)}
            },
            ${paymentDetails.notification_url ? `notification_url: ${safeStringify(paymentDetails.notification_url)},` : ''}
            ${paymentDetails.narration ? `narration: ${safeStringify(paymentDetails.narration)},` : ''}
            ${paymentDetails.channels ? `channels: ${JSON.stringify(paymentDetails.channels)},` : ''}
            ${paymentDetails.default_channel ? `default_channel: ${safeStringify(paymentDetails.default_channel)},` : ''}
            ${paymentDetails.metadata ? `metadata: ${JSON.stringify(paymentDetails.metadata)},` : ''}
            ${paymentDetails.containerId ? `containerId: ${safeStringify(paymentDetails.containerId)},` : ''}
            ${paymentDetails.merchant_bears_cost !== undefined ? `merchant_bears_cost: ${paymentDetails.merchant_bears_cost},` : ''}
            onClose: function () {
              window.ReactNativeWebView.postMessage('PAYMENT_CLOSED');
            },
            onSuccess: function (data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data }));
            },
            onFailed: function (data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FAILED', data }));
            },
            onPending: function (data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PENDING', data }));
            },
            onTokenized: function (data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOKENIZED', data }));
            }
          };

          // Remove undefined properties
          Object.keys(koraConfig).forEach(key => {
            if (koraConfig[key] === undefined) {
              delete koraConfig[key];
            }
          });

          window.Korapay.initialize(koraConfig);
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            data: { message: err.message, stack: err.stack }
          }));
        }
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ERROR',
          data: { message: 'Korapay not found after script load' }
        }));
      }
    };

    script.onerror = function (err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        data: { message: 'Failed to load Kora script', error: err.toString() }
      }));
    };

    document.body.appendChild(script);
  })();
  true;
`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #payment-root {
          width: 100%;
          height: 100%;
          position: relative;
        }
        /* Loading indicator */
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: white;
          font-size: 16px;
        }
        .spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div id="payment-root">
        <div class="loading">
          <div class="spinner"></div>
          Loading payment options...
        </div>
      </div>
    </body>
    </html>
  `;

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const message = event.nativeEvent.data;

      try {
        const parsedMessage = JSON.parse(message);

        switch (parsedMessage.type) {
          case 'SUCCESS':
            setIsCheckoutVisible(false);
            onSuccess?.(parsedMessage.data);
            break;
          case 'FAILED':
            setIsCheckoutVisible(false);
            onFailed?.(parsedMessage.data);
            break;
          case 'PENDING':
            onPending?.(parsedMessage.data);
            break;
          case 'TOKENIZED':
            onTokenized?.(parsedMessage.data);
            break;
          case 'ERROR':
            console.error('Kora Payment Error:', parsedMessage.data);
            setIsCheckoutVisible(false);
            onFailed?.(parsedMessage.data);
            break;
          default:
            console.log('Unknown message type:', parsedMessage.type);
        }
      } catch (e) {
        if (message === 'PAYMENT_CLOSED') {
          setIsCheckoutVisible(false);
          onClose?.();
        } else if (message === 'SCRIPT_LOADED') {
          console.log('Kora script loaded successfully');
        } else {
          console.log('Unhandled message:', message);
        }
      }
    },
    [onClose, onSuccess, onFailed, onPending, onTokenized]
  );

  const initiatePayment = useCallback(() => {
    setIsCheckoutVisible(true);
  }, []);

  const closePayment = useCallback(() => {
    setIsCheckoutVisible(false);
    onClose?.();
  }, [onClose]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    webview: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
      backgroundColor: 'transparent',
    },
  });

  const CheckoutComponent = useCallback(
    () =>
      isCheckoutVisible ? (
        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            style={styles.webview}
            scrollEnabled={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={false}
            bounces={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              onFailed?.({
                message: 'WebView failed to load',
                description: nativeEvent.description,
              });
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error: ', nativeEvent);
              onFailed?.({
                message: 'HTTP error occurred',
                statusCode: nativeEvent.statusCode,
              });
            }}
          />
        </View>
      ) : null,
    [
      htmlContent,
      injectedJavaScript,
      handleMessage,
      isCheckoutVisible,
      styles,
      onFailed,
    ]
  );

  return {
    CheckoutComponent,
    initiatePayment,
    closePayment,
    isCheckoutVisible,
  };
};
