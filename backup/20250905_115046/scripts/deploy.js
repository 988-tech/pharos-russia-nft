async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Nft = await ethers.getContractFactory("PharosRussia");
  const nft = await Nft.deploy();
  await nft.waitForDeployment();

  const addr = await nft.getAddress();
  console.log("PharosRussia deployed at:", addr);

  // Пример: сразу прописать baseURI (ваш Replit или IPFS)
  // await (await nft.setBaseURI("https://YOUR-REPLIT-APP.replit.app/metadata/" )).wait();
  
  console.log("\nNext steps:");
  console.log("1. Set CONTRACT_ADDRESS environment variable to:", addr);
  console.log("2. Set baseURI using setBaseURI function");
  console.log("3. Upload metadata files to IPFS or configure hosting");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
