import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useKorapayCheckout } from 'react-native-korapay-checkout';

export default function App() {
  const { CheckoutComponent, initiatePayment } = useKorapayCheckout({
    paymentDetails: {
      publicKey: 'pk_test_ky3qHK1NAS7heBBWWDCo1P4ypMZMusUyRjJPGFDc',
      reference: `key${Math.random()}`,
      amount: 3000,
      currency: 'NGN',
      customer: {
        name: 'John Doe',
        email: 'john@doe.com',
      },
      default_channel: 'card',
    },
    onClose: () => console.log('Payment closed'),
    onSuccess: (data: any) => console.log('Payment successful:', data),
    onFailed: (data: any) => console.log('Payment failed:', data),
  });
  return (
    <View style={styles.container}>
      <CheckoutComponent />
      <TouchableOpacity onPress={initiatePayment}>
        <Text>Pay now </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
