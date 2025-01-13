import { useRef, useCallback, useState } from 'react';
import WebView from 'react-native-webview';
import { StyleSheet, View, Dimensions } from 'react-native';
import type { KorapayConfig } from '../types/IKorapayprops';

export const useKorapayCheckout = ({
  paymentDetails,
  onClose,
  onSuccess,
  onFailed,
}: {
  paymentDetails: KorapayConfig;
  onClose?: () => void;
  onSuccess?: (data: any) => void;
  onFailed?: (data: any) => void;
}) => {
  const webViewRef = useRef<WebView | null>(null);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #payment-root {
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div id="payment-root"></div>
      <script>
        const initializeKorapay = () => {
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
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage('PAYMENT_CLOSED');
            },
            onSuccess: function (data) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data }));
            },
            onFailed: function (data) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FAILED', data }));
            }
          });
        }
        window.initializeKorapay = initializeKorapay;
      </script>
    </body>
    </html>
  `;

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const message = event.nativeEvent.data;

      if (message === 'PAYMENT_CLOSED') {
        setIsCheckoutVisible(false);
        onClose?.();
        return;
      }

      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'SUCCESS') {
          setIsCheckoutVisible(false);
          onSuccess?.(parsedMessage.data);
        } else if (parsedMessage.type === 'FAILED') {
          setIsCheckoutVisible(false);
          onFailed?.(parsedMessage.data);
        }
      } catch (error) {
        console.error('Error parsing WebView message:', error);
      }
    },
    [onClose, onSuccess, onFailed]
  );

  const initiatePayment = useCallback(() => {
    setIsCheckoutVisible(true);
    setTimeout(() => {
      webViewRef.current?.injectJavaScript('window.initializeKorapay(); true;');
    }, 1000);
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
            onMessage={handleMessage}
            style={styles.webview}
            scrollEnabled={false}
          />
        </View>
      ) : null,
    [htmlContent, handleMessage, isCheckoutVisible, styles]
  );

  return {
    CheckoutComponent,
    initiatePayment,
  };
};
