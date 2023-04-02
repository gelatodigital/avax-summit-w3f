/* eslint-disable @typescript-eslint/naming-convention */
import hre from "hardhat";
import { GelatoOpsSDK } from "@gelatonetwork/ops-sdk";

async function main() {
  // const chainId = hre.network.config.chainId as number;

  // Init GelatoOpsSDK
  const [signer] = await hre.ethers.getSigners();

  console.log(signer.address);

  const gelatoOps = new GelatoOpsSDK(80001, signer);
  const dedicatedMsgSender = await gelatoOps.getDedicatedMsgSender();
  console.log(`Dedicated msg.sender: ${dedicatedMsgSender.address} is deployed ${dedicatedMsgSender.isDeployed}`);

  const nonce = await signer.getTransactionCount();

  // Deploying NFT contract
  const nftFactory = await hre.ethers.getContractFactory("SwissDAONFT", signer);
  console.log("Deploying SwissDAONFT...");
  const swissDAONft = await nftFactory.deploy(dedicatedMsgSender.address, {
    nonce,
    gasPrice: 190000000000,
    gasLimit: 10000000,
  });
  await swissDAONft.deployed();

  console.log(`SwissDAONFT deployed to: ${swissDAONft.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
