require("dotenv").config();

async function setupMetadata() {
  console.log("Setting up metadata URI for deployed contract...");
  
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress || contractAddress === "PASTE_CONTRACT_ADDRESS_HERE") {
    console.error("❌ CONTRACT_ADDRESS not set in environment variables");
    console.log("Please deploy contract first and set CONTRACT_ADDRESS");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Подключаемся к развернутому контракту
  const contract = await ethers.getContractAt("PharosRussia", contractAddress);
  
  // Получаем URL вашего Replit приложения
  const replitUrl = process.env.REPLIT_URL || "https://YOUR-REPLIT-APP.replit.app";
  const baseURI = `${replitUrl}/metadata/`;
  
  console.log("Setting baseURI to:", baseURI);
  
  try {
    // Устанавливаем baseURI
    const tx = await contract.setBaseURI(baseURI);
    console.log("Transaction hash:", tx.hash);
    
    // Ждем подтверждения
    await tx.wait();
    console.log("✅ BaseURI successfully set!");
    console.log("Now your NFTs will use metadata from:", baseURI + "{tokenId}.json");
    
    // Проверяем, что все работает
    console.log("\nTesting metadata URL for token #1:");
    console.log("URL:", baseURI + "1");
    
  } catch (error) {
    console.error("❌ Error setting baseURI:", error.message);
    
    if (error.message.includes("Ownable")) {
      console.log("💡 Make sure you're using the same account that deployed the contract");
    }
  }
}

setupMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });