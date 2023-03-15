/* eslint-disable @typescript-eslint/naming-convention */
import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, constants, ethers, BigNumber } from "ethers";
import { Configuration, OpenAIApi } from "openai";
import { NFTStorage, File } from "nft.storage";
import Chance from "chance";
import axios, { AxiosError } from "axios";

const MAX_RANGE = 100;
const MAX_REQUESTS = 10;
const NFT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function revealNft(uint256 tokenId, string memory tokenURI) external",
  "function tokenURI(uint256 tokenId) public view returns (string memory) ",
  "function tokenIds() public view returns(uint256)",
  "function tokenIdByUser(address) public view returns(uint256)",
  "function nightTimeByToken(uint256) public view returns(bool)",
  "function mint(bool _isNight) external",
  "event MintEvent(uint256 _tokenId)"
];
const NOT_REVEALED_URI = "ipfs://bafyreicwi7sbomz7lu5jozgeghclhptilbvvltpxt3hbpyazz5zxvqh62m/metadata.json";

function generateNftProperties(seed: string, isNight:boolean) {
   const timeSelected = isNight ? 'at night' : 'at sunset';



  const description = `A cute robot eating an icecream with Dubai background ${timeSelected} in a cyberpunk art, 3D, video game, and pastel salmon colors`;
  return {
    description,
    attributes: [
      { trait_type: "Place", value: "Eth Dubai" },
      { trait_type: "Eating", value: "Gelato" },
      { trait_type: "Powered", value: "Web 3 Functions" },
    ],
  };
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, secrets, provider } = context;

  const nftAddress = userArgs.nftAddress;
  if (!nftAddress) throw new Error("Missing userArgs.nftAddress");
  const nft = new Contract(nftAddress as string, NFT_ABI, provider);

  const lastTokenId = parseInt((await storage.get("lastTokenId")) ?? "0");

  let currentTokenId = await nft.tokenIds();

  if (currentTokenId.eq(BigNumber.from(lastTokenId))) {
    return { canExec: false, message: "No New Tokens" };
  }

  let tokenId = lastTokenId + 1;
  const tokenURI = await nft.tokenURI(tokenId);
  const isNight = await nft.nightTimeByToken(tokenId);

  if (tokenURI == NOT_REVEALED_URI) {
    // Generate NFT properties
    const nftProps = generateNftProperties(`${currentTokenId}_${lastTokenId}`,isNight);
    console.log(`Open AI prompt: ${nftProps.description}`);
    let timeNow = Date.now();
    // Generate NFT image with OpenAI (Dall-E)
    const openAiApiKey = await secrets.get("OPEN_AI_API_KEY");
    if (!openAiApiKey) throw new Error("Missing secrets.OPEN_AI_API_KEY");
    const openai = new OpenAIApi(new Configuration({ apiKey: openAiApiKey }));
    let imageUrl: string;
    try {
      const response = await openai.createImage({
        prompt: nftProps.description,
        size: "512x512",
      });
      imageUrl = response.data.data[0].url as string;
      console.log(`Open AI generated image: ${imageUrl}`);
    } catch (_err) {
      const openAiError = _err as AxiosError;
      const errrorMessage = openAiError.response
        ? `${openAiError.response.status}: ${openAiError.response.data}`
        : openAiError.message;
      return { canExec: false, message: `OpenAI error: ${errrorMessage}` };
    }

    let timeafter = Date.now();

    console.log((timeafter - timeNow) / 1000);
    // Publish NFT metadata on IPFS
    const imageBlob = (await axios.get(imageUrl, { responseType: "blob" })).data;
    const nftStorageApiKey = await secrets.get("NFT_STORAGE_API_KEY");
    if (!nftStorageApiKey) throw new Error("Missing secrets.NFT_STORAGE_API_KEY");
    const client = new NFTStorage({ token: nftStorageApiKey });
    const imageFile = new File([imageBlob], `gelato_bot_${tokenId}.png`, { type: "image/png" });
    timeafter = Date.now();

    console.log((timeafter - timeNow) / 1000);

    const metadata = await client.store({
      name: `Eth Dubai GelatoBot #${tokenId}`,
      description: nftProps.description,
      image: imageFile,
      attributes: nftProps.attributes,
      collection: { name: "EthDubai-GelatoBots", family: "ethdubai-gelatobots" },
    });
    console.log("IPFS Metadata:", metadata.url);

    await storage.set("lastTokenId", tokenId.toString());

    return {
      canExec: true,
      callData: nft.interface.encodeFunctionData("revealNft", [tokenId, metadata.url]),
    };
  } else {
    console.log(`#${tokenId} already minted!`);
    await storage.set("lastTokenId", tokenId.toString());
    return { canExec: false, message: "Token already Minted" };
  }
});
