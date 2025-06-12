import { useRef, useCallback, useState } from 'react';
import WebView from 'react-native-webview';
import { StyleSheet, View, Dimensions } from 'react-native';
import type { koraConfig } from '../types/Ikoraprops';

export const useKoraCheckout = ({
  paymentDetails,
  onClose,
  onSuccess,
  onFailed,
}: {
  paymentDetails: koraConfig;
  onClose?: () => void;
  onSuccess?: (data: any) => void;
  onFailed?: (data: any) => void;
}) => {
  const webViewRef = useRef<WebView | null>(null);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  const injectedJavaScript = `
  (function() {
    const script = document.createElement('script');
    script.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js';
    script.async = true;

    script.onload = function () {
      if (window.Korapay) {
        window.ReactNativeWebView.postMessage('SCRIPT_LOADED');
        try {
          window.Korapay.initialize({
            key: "${paymentDetails.publicKey}",
            reference: "${paymentDetails.reference}",
            amount: ${paymentDetails.amount},
            currency: "${paymentDetails.currency}",
            customer: {
              name: "${paymentDetails.customer.name}",
              email: "${paymentDetails.customer.email}"
            },
            onClose: function () {
              window.ReactNativeWebView.postMessage('PAYMENT_CLOSED');
            },
            onSuccess: function (data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data }));
            },
            onFailed: function (data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FAILED', data }));
            }
          });
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            data: { message: err.message }
          }));
        }
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ERROR',
          data: { message: 'Korapay not found after script load' }
        }));
      }
    };

    script.onerror = function () {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        data: { message: 'Failed to load Kora script' }
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
        }
        #payment-root {
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div id="payment-root"></div>
    </body>
    </html>
  `;

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const message = event.nativeEvent.data;

      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'SUCCESS') {
          setIsCheckoutVisible(false);
          onSuccess?.(parsedMessage.data);
        } else if (parsedMessage.type === 'FAILED') {
          setIsCheckoutVisible(false);
          onFailed?.(parsedMessage.data);
        } else if (parsedMessage.type === 'ERROR') {
          onFailed?.(parsedMessage.data);
        }
      } catch (e) {
        if (message === 'PAYMENT_CLOSED') {
          setIsCheckoutVisible(false);
          onClose?.();
        }
      }
    },
    [onClose, onSuccess, onFailed]
  );

  const initiatePayment = useCallback(() => {
    setIsCheckoutVisible(true);
  }, []);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
          />
        </View>
      ) : null,
    [htmlContent, injectedJavaScript, handleMessage, isCheckoutVisible, styles]
  );

  return {
    CheckoutComponent,
    initiatePayment,
  };
};
