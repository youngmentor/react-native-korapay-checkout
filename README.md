# react-native-kora-checkout

A React Native SDK for integrating the kora payment gateway, enabling secure and seamless payment processing in mobile applications. This SDK provides an easy-to-use interface for initializing payments, managing transaction events, and customizing payment options, including multiple payment channels and customer details.

## Installation

```sh
npm install react-native-kora-checkout
```

## Usage

```js
import { usekoraCheckout } from 'react-native-kora-checkout';

// ...

 const { CheckoutComponent, initiatePayment } = usekoraCheckout(
    {
      paymentDetails: {
        publicKey: 'pk_test_***************************Ghx', /// log on to merchant.korapay.com to get your own APi key
        reference: 'Generate random key for the refrence',
        amount: 3000,
        currency: 'NGN',
        customer: {
          name: 'John Doe',
          email: 'john@doe.com'
        }
      },
      onClose: () => console.log('Payment closed'),
      onSuccess: (data: any) => console.log('Payment successful:', data),
      onFailed: (data: any) => console.log('Payment failed:', data)
    }
  );

  then call the checkout component in the Jsx

  where you want to display the checkout modal

  <CheckoutComponent/>
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
