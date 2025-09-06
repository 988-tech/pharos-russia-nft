require("dotenv").config();

async function withdrawFunds() {
  console.log("Withdrawing PHRS funds from contract...");
  
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress || contractAddress === "PASTE_CONTRACT_ADDRESS_HERE") {
    console.error("❌ CONTRACT_ADDRESS not set in environment variables");
    process.exit(1);
  }

  // Адрес для вывода средств (замените на ваш кошелек)
  const withdrawAddress = process.env.WITHDRAW_ADDRESS || "YOUR_WALLET_ADDRESS_HERE";
  
  if (withdrawAddress === "YOUR_WALLET_ADDRESS_HERE") {
    console.error("❌ WITHDRAW_ADDRESS not set in environment variables");
    console.log("Please set WITHDRAW_ADDRESS in your .env file");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Подключаемся к контракту
  const contract = await ethers.getContractAt("PharosRussia", contractAddress);
  
  try {
    // Проверяем баланс контракта
    const balance = await ethers.provider.getBalance(contractAddress);
    console.log("Contract balance:", ethers.formatEther(balance), "PHRS");
    
    if (balance == 0) {
      console.log("❌ Contract balance is 0 PHRS");
      return;
    }
    
    console.log("Withdrawing to address:", withdrawAddress);
    
    // Выводим средства
    const tx = await contract.withdraw(withdrawAddress);
    console.log("Transaction hash:", tx.hash);
    
    // Ждем подтверждения
    await tx.wait();
    console.log("✅ Funds successfully withdrawn!");
    
    // Проверяем новый баланс
    const newBalance = await ethers.provider.getBalance(contractAddress);
    console.log("New contract balance:", ethers.formatEther(newBalance), "PHRS");
    
  } catch (error) {
    console.error("❌ Error withdrawing funds:", error.message);
    
    if (error.message.includes("Ownable")) {
      console.log("💡 Make sure you're using the same account that deployed the contract");
    }
  }
}

withdrawFunds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });