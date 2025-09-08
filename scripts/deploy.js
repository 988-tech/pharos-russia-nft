async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Nft = await ethers.getContractFactory("PharosRussia");
  const nft = await Nft.deploy();
  await nft.waitForDeployment();

  const addr = await nft.getAddress();
  console.log("PharosRussia deployed at:", addr);

  // При необходимости можно сразу задать baseURI на ваш домен
  // await (await nft.setBaseURI("https://YOUR-DOMAIN/metadata/")).wait();

  console.log("\nNext steps:");
  console.log("1. Set CONTRACT_ADDRESS environment variable to:", addr);
  console.log("2. Optionally set baseURI using setBaseURI");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


