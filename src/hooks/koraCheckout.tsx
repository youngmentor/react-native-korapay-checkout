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
      console.log('Starting Kora script injection...');
      
      function loadKoraScript() {
        return new Promise((resolve, reject) => {
          // Check if script already exists
          const existingScript = document.querySelector('script[src*="kora-collections"]');
          if (existingScript) {
            console.log('Kora script already exists, removing...');
            existingScript.remove();
          }

          const script = document.createElement('script');
          script.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/kora-collections.min.js';
          script.async = true;
          script.crossOrigin = 'anonymous';
          
          // Add timeout for script loading
          const timeout = setTimeout(() => {
            reject(new Error('Script loading timeout'));
          }, 10000); // 10 second timeout
          
          script.onload = function() {
            console.log('Kora script loaded successfully');
            clearTimeout(timeout);
            window.ReactNativeWebView.postMessage('SCRIPT_LOADED');
            resolve();
          };
          
          script.onerror = function(error) {
            console.error('Script loading error:', error);
            clearTimeout(timeout);
            reject(new Error('Failed to load kora script'));
          };
          
          document.head.appendChild(script); // Use head instead of body
        });
      }

      async function initializeKora() {
        try {
          console.log('Initializing Kora...');
          
          // Wait a bit for the script to fully initialize
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (!window.kora) {
            throw new Error('Kora object not found on window');
          }

          console.log('Kora object found, initializing payment...');
          
          const config = {
            key: "${paymentDetails.publicKey}",
            reference: "${paymentDetails.reference}",
            amount: ${paymentDetails.amount},
            currency: "${paymentDetails.currency}",
            customer: {
              name: "${paymentDetails.customer.name}",
              email: "${paymentDetails.customer.email}"
            },
            onClose: function () {
              console.log('Payment closed');
              window.ReactNativeWebView.postMessage('PAYMENT_CLOSED');
            },
            onSuccess: function (data) {
              console.log('Payment success:', data);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data }));
            },
            onFailed: function (data) {
              console.log('Payment failed:', data);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FAILED', data }));
            }
          };

          console.log('Config:', config);
          window.kora.initialize(config);
          window.ReactNativeWebView.postMessage('KORA_INITIALIZED');
          
        } catch (error) {
          console.error('Kora initialization error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            data: { message: error.message, stack: error.stack }
          }));
        }
      }

      // Start the process
      loadKoraScript()
        .then(() => initializeKora())
        .catch(error => {
          console.error('Loading error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            data: { message: error.message }
          }));
        });
    })();
    true;
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';">
      <title>Kora Payment</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }
        
        #payment-root {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .loading {
          color: white;
          text-align: center;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div id="payment-root">
        <div class="loading">Loading payment...</div>
      </div>
      <script>
        console.log('HTML loaded, waiting for injection...');
        
        // Global error handler
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          console.error('Global error:', msg, url, lineNo, columnNo, error);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              data: { message: msg, url, lineNo, columnNo }
            }));
          }
          return false;
        };
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', function(event) {
          console.error('Unhandled promise rejection:', event.reason);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              data: { message: 'Unhandled promise rejection: ' + event.reason }
            }));
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const message = event.nativeEvent.data;
      console.log('WebView message received:', message);

      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'SUCCESS') {
          console.log('Payment successful:', parsedMessage.data);
          setIsCheckoutVisible(false);
          onSuccess?.(parsedMessage.data);
        } else if (parsedMessage.type === 'FAILED') {
          console.log('Payment failed:', parsedMessage.data);
          setIsCheckoutVisible(false);
          onFailed?.(parsedMessage.data);
        } else if (parsedMessage.type === 'ERROR') {
          console.error('Payment error:', parsedMessage.data);
          setIsCheckoutVisible(false);
          onFailed?.(parsedMessage.data);
        }
      } catch (e) {
        // Handle non-JSON messages
        if (message === 'PAYMENT_CLOSED') {
          console.log('Payment closed by user');
          setIsCheckoutVisible(false);
          onClose?.();
        } else if (message === 'SCRIPT_LOADED') {
          console.log('Kora script loaded successfully');
        } else if (message === 'KORA_INITIALIZED') {
          console.log('Kora initialized successfully');
        } else {
          console.log('Unhandled message:', message);
        }
      }
    },
    [onClose, onSuccess, onFailed]
  );

  const initiatePayment = useCallback(() => {
    console.log('Initiating payment with details:', paymentDetails);
    setIsCheckoutVisible(true);
  }, [paymentDetails]);

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
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="compatibility"
            onError={(error) => {
              console.error('WebView error:', error);
              onFailed?.({ message: 'WebView error', error });
            }}
            onHttpError={(error) => {
              console.error('WebView HTTP error:', error);
              onFailed?.({ message: 'HTTP error', error });
            }}
            onLoadStart={() => console.log('WebView load started')}
            onLoadEnd={() => console.log('WebView load ended')}
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
  };
};
