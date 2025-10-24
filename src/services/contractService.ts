import { PublicKey } from "@solana/web3.js";
import { CustomError } from "../middlewares/errorHandler";
import { CHAINENUMS, DezenMartContractService, SOLANA_TOKENS } from "./chainsContracts/contractService";
import { DezenMartSolanaService } from "./chainsContracts/solana";
import { Address } from 'viem';
import { generateUniqueNumericalId, generateUUID } from "../utils/helpers/generate-unique-dummy-orderId";
let EthereumService = new DezenMartContractService()
let SolanaService = new DezenMartSolanaService()
export class DezenMartContractAPIService {


  static async  createTrade(data:any){
      const {
      price,
      stock,
      chain,
      logisticsProviders,
      logisticsCost,
      useUSDT,
      paymentToken,
      sellerWalletAddress,
    } = data;


    console.log(data.chain)
    switch (data?.chain){
        case CHAINENUMS.solana:{
            
            console.log(paymentToken)
           let tokenMint = (SOLANA_TOKENS as any)[paymentToken]
           console.log(tokenMint)
           console.log(sellerWalletAddress)
let tradeId =  generateUniqueNumericalId()
let structuredata = {
    seller:new PublicKey(sellerWalletAddress),
    tradeId,
    productCost:price,
    logisticsProviders:logisticsProviders.map((e:any)=>{
        return new PublicKey(e)
    }),
    logisticsCosts:logisticsCost,
    totalQuantity:stock,
    tokenMint:new PublicKey(tokenMint),


}

console.log(structuredata)
// return
   

let v =await SolanaService.createTrade(structuredata)
console.log(v,"vvvvvvvvvv")
if(v.tradeId){
    v.tradeId.toNumber()
    v.chain = data.chain
    v.tokenMint=tokenMint
}

return v

}
default :{



    if (
      !logisticsProviders ||
      !Array.isArray(logisticsProviders) ||
      !logisticsProviders.every(
        (lp) => typeof lp === 'string' && lp.startsWith('0x'),
      )
    ) {
      throw new CustomError(
        'logisticsProviders must be an array of strings, each representing a valid wallet address (starting with "0x").',
        400,
        'fail',
      );
    }



    //   Validate paymentToken against the list of supported tokens in contractService
    if (!paymentToken || !EthereumService.isValidPaymentToken(paymentToken)) {
      throw new CustomError(
        `Invalid or missing paymentToken. Supported tokens are: ${Object.keys(EthereumService.getPaymentTokens()).join(', ')}`,
        400,
        'fail',
      );
    }
    
       const productCostStr = price.toString();
           const tokenAddress = EthereumService.getTokenAddress(paymentToken);
        let tradeReceipt =  await EthereumService.createTrade(

            {
                  sellerWalletAddress: sellerWalletAddress as Address,
                  productCostInToken: productCostStr,
                   logisticsProviders:   data.logisticsProviders as `0x${string}`[],
                //   logisticsProviders: data.logisticsProviders as any[],
                //   logisticsCostsInToken: data.logisticsCost,
                       logisticsCostsInToken: data.logisticsCost.map((cost:any) => cost.toString()),
                  totalQuantity: BigInt(stock),
                  tokenAddress:  tokenAddress,
                //   paymentToken,
                //   chain: chain as CHAINENUMS,
                }
        )
return tradeReceipt
        //  if (tradeReceipt && tradeReceipt.events) {
        //       if (Array.isArray(tradeReceipt.events.LogisticsSelected) &&
        //           tradeReceipt.events.LogisticsSelected.length > 0) {
        //         tradeId = tradeReceipt.events.LogisticsSelected[0].returnValues.tradeId.toString();
        //       }
        //       else if (tradeReceipt.events.LogisticsSelected &&
        //           tradeReceipt.events.LogisticsSelected.returnValues &&
        //           tradeReceipt.events.LogisticsSelected.returnValues.tradeId) {
        //         tradeId = tradeReceipt.events.LogisticsSelected.returnValues.tradeId.toString();
        //       }
        //       else if (tradeReceipt.events.TradeCreated &&
        //                tradeReceipt.events.TradeCreated.returnValues &&
        //                tradeReceipt.events.TradeCreated.returnValues.tradeId) {
        //         tradeId = tradeReceipt.events.TradeCreated.returnValues.tradeId.toString();
        //       }
        //       else {
        //         for (const eventName in tradeReceipt.events) {
        //           const event = tradeReceipt.events[eventName];
        
        //           if (Array.isArray(event) && event.length > 0 && event[0].returnValues && event[0].returnValues.tradeId) {
        //             tradeId = event[0].returnValues.tradeId.toString();
        //             break;
        //           }
        //           else if (typeof event === 'object' && event.returnValues && event.returnValues.tradeId) {
        //             tradeId = event.returnValues.tradeId.toString();
        //             break;
        //           }
        //         }
        //       }
        //     }

    }
    }

    }
 
}

// Usage example:
/*
const contractService = new DezenMartContractService();

// Register as seller
await contractService.registerSeller();

// Create a trade with USDC token
const usdcAddress = contractService.getTokenAddress('USDC');
const { hash: tradeHash, tradeId } = await contractService.createTrade(
  '100', // 100 USDC product cost
  ['0x...'], // logistics provider addresses
  ['10'], // 10 USDC logistics cost
  BigInt(50), // 50 items
  usdcAddress // USDC token address
);

console.log(`Trade ${tradeId} created with hash: ${tradeHash}`);

// Buy a trade with USDC
const { hash: purchaseHash, purchaseId } = await contractService.buyTrade(
  Number(tradeId),
  BigInt(5), // quantity
  '0x...', // logistics provider
  usdcAddress // USDC token address
);

console.log(`Purchase ${purchaseId} created with hash: ${purchaseHash}`);
*/
