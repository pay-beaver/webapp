# Abstract Wallet - subscriptions in erc-4337

A erc-4337 based wallet that allows users to make periodic payments while keeping funds in full self custody.

Try out the wallet at https://abstract-wallet.onrender.com.

## Usage guide

To use the wallet, go to https://abstract-wallet.onrender.com, log in with google / github and create a password. That's it.

Select the chain in the top left corner (currently Base Mainnet and base Goerli are supported). You can find your address in the top right corner.

Send ETH / ERC20 tokens to that address to top up the wallet. If a token is not shown, click "Import token" button an enter the token's address.

To transfer a token, click "Send" near a token. To see history of your token transfers and other actions, go to "Activity" page.

<img width="540" alt="image" src="https://github.com/Abstract-Wallet/abstract-wallet-extension/assets/63492346/43b0f4e6-8d42-4845-844f-5e136f0096e3">


## Subscriptions

The key feature of Abstract Wallet is subscriptions. The goal is to establish an industry stnadard for wallets, dapps and centralized apps to talk to each other about subscriptions and provide such functionality to the end users.

It's not possible to interact with dapps yet, but what you can already do - is you can manually set up a periodic transfer of money. Go to "Subscriptions" page, click "Setup new subscription".

<img width="540" alt="image" src="https://github.com/Abstract-Wallet/abstract-wallet-extension/assets/63492346/5cf52bb5-31bc-41fa-8eeb-232188ad31fd">

Now fill out Subscription name, token to send, size of payments, frequency of payments and the recepient addres. Now click "Done" end enjoy seeing a user operation automatically produced every billing cycle (even if you don't open your wallet).

<img width="561" alt="image" src="https://github.com/Abstract-Wallet/abstract-wallet-extension/assets/63492346/9186dd90-c852-4ae8-aa13-7c2553ef6ac7">

## Subscriptions under the hood

You might be wondering: how is it possible to send a user operation (user operation is a erc-4337 version of transaction) while the wallet is closed? This means that my private key is transfered yo your server, right??? No! Your funds are always at your full custody.

What actually happens is that when you sign up for a subscription, a bunch of user operations (like 1000 operations) are generated and fully pre-signed locally in the browser. Then these user operations are transfered to our server and the server sends them to the blockchain at the right time. Since they are already signed, no other action from you, as a user, is needed to execute them.

But then it means you can execute all my 1000 pre-signed operations immediately after receiving them and drain all the funds from my wallet?? And again no! Abstract Wallet is a ERC-4337 wallet. ERC-4337 wallets are smart contracts. Being a smart contract allows to implement almost any security checks when executing a user operation. And this is exactly what we do. In every pre-signed user operation, a timestamp is included. The smart contract always checks this timestamp and if it's too early, doesn't allow execution. Which means that your funds remain in your wallet until it is the exact time to make a periodic payment.

## Technical side

Abstract Wallet is build on top of Zerodev's Kernel smart contract. Kernel is an audited an secure smart contract that is responsible for keeping your tokens under your and only your control. Subscriptions are implemented as a _plugin_ for Kernel. You can find the code for the plugin validator and executor in the [contracts repo](https://github.com/Abstract-Wallet/abstract-wallet-contracts).
