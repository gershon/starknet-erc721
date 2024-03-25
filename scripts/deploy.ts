import fs from "fs";
import { CallData, Contract, RpcProvider, Account, json } from "starknet";

export async function deployContract() {
  const { ACCOUNT_ADDRESS, ACCOUNT_PK } = process.env;

  if (!ACCOUNT_ADDRESS || !ACCOUNT_PK) {
    console.error("Please provide ACCOUNT_ADDRESS and ACCOUNT_PK env");
    process.exit(1);
  }

  const provider = new RpcProvider();
  const account = new Account(provider, ACCOUNT_ADDRESS, ACCOUNT_PK, "1");
  const sierra = json.parse(
    fs
      .readFileSync(
        "./contracts/target/dev/evrmg_FreeMintNFT.contract_class.json"
      )
      .toString("ascii")
  );
  const casm = json.parse(
    fs
      .readFileSync(
        "./contracts/target/dev/evrmg_FreeMintNFT.compiled_contract_class.json"
      )
      .toString("ascii")
  );

  const contractCallData = new CallData(sierra.abi);
  const contractConstructor = contractCallData.compile("constructor", {
    name: "EVRMG",
    symbol: "EVRMG",
  });

  const deployR = await account.declareAndDeploy({
    contract: sierra,
    casm,
    constructorCalldata: contractConstructor,
  });

  if (deployR.declare.transaction_hash) {
    await provider.waitForTransaction(deployR.declare.transaction_hash);
  }

  const nftContract = new Contract(
    sierra.abi,
    deployR.deploy.contract_address,
    provider
  );

  console.log(`https://testnet.starkscan.co/contract/${nftContract.address}`);
}

deployContract().catch((error) => console.log(error));
