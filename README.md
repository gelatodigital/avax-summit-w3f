# EthDubai Gelato Bots NFT

## Summary

NFT powered by Open AI & Web3 functions:
- Each uer can mint 1 NFT
- A Web3 function is listening to every new mint and generate a new art using Open Ai (Dall-E)
- The NFT pic is published on IPFS and revealed on-chain via Gelato Automate

## Demo
- Polygon:
  - Mint website: https://eth-dubai-nft.web.app/ 
  - Smart Contract: https://polygonscan.com/address/0xd47c74228038e8542a38e3e7fb1f4a44121ee14e
  - Web3 Function: https://beta.app.gelato.network/task/0xce305033e53322a7e32f58b429ce0ff9a8c314b2163851dd12a75e5a4ed1e85e?chainId=137
  - Open Sea NFTs: https://opensea.io/collection/eth-dubai-gelato-bots-1

## How to run

1. Install project dependencies:
```
yarn install
```

2. Create a `.env` file with your private config:
```
cp .env.example .env
```
You will need to create free accounts and get Api Keys from [OpenAI](https://platform.openai.com/) and [Nft.Storage](https://nft.storage/)

3. Test the Open AI NFT web3 function on polygon:
```
npx w3f test web3-functions/open-ai-nft/index.ts --show-logs --user-args=nftAddress:0xd47c74228038e8542a38e3e7fb1f4a44121ee14e
```

## Deploy your smart contract and web3 function
```
yarn run deploy --network goerli
```

```
npx w3f deploy web3-functions/open-ai-nft/index.ts
```
## Verify
```
npx hardhat verify CONTRACT_ADDRESS DEDICATED_MSG_SENDER --network goerli
```
```ts
npx hardhat node --network hardhat 
```

```ts
npx hardhat run  scripts/deploy-contract.ts
```