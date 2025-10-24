// import * as anchor from "@project-serum/anchor";
// import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
// import { BN } from "bn.js";
// import idl from "./idl.json"; // Anchor-generated IDL
// // import {
// //   TOKEN_PROGRAM_ID,
// //   getAssociatedTokenAddress,
// //   createAssociatedTokenAccountInstruction,
// //   createApproveInstruction,
// //   getAccount,
// // } from "@solana/spl-token";
// type Address = PublicKey;
// type Hash = string; // Solana tx signature

// export class DezenMartSolanaService {
//   private provider: anchor.AnchorProvider;
//   private program: anchor.Program;
//   private wallet: Keypair;
//   private globalStatePda: PublicKey;

//   constructor(wallet?: Keypair) {
//     this.wallet = wallet 
//     // || Keypair.generate();

//     this.provider = new anchor.AnchorProvider(
//       new anchor.web3.Connection("https://api.devnet.solana.com"),
//       new anchor.Wallet(this.wallet),
//       { preflightCommitment: "processed" }
//     );

//     this.program = new anchor.Program(idl, new PublicKey(idl.metadata.address), this.provider);
//   }

//   // --- Global State ---
//   async initGlobalState() {
//     [this.globalStatePda] = await PublicKey.findProgramAddress(
//       [Buffer.from("global-state")],
//       this.program.programId
//     );

//     await this.program.methods
//       .initialize()
//       .accounts({
//         globalState: this.globalStatePda,
//         admin: this.wallet.publicKey,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([this.wallet])
//       .rpc();

//     console.log("Global state initialized at:", this.globalStatePda.toBase58());
//   }

//   // --- Registration ---
//   async registerBuyer(): Promise<Hash> {
//     return await this.program.methods
//       .registerBuyer()
//       .accounts({
//         globalState: this.globalStatePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async registerSeller(): Promise<Hash> {
//     return await this.program.methods
//       .registerSeller()
//       .accounts({
//         globalState: this.globalStatePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async registerLogisticsProvider(provider: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .registerLogisticsProvider(provider)
//       .accounts({
//         globalState: this.globalStatePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   // --- Trade Functions ---
//   async createTrade(
//     productCost: BN,
//     logisticsProviders: PublicKey[],
//     logisticsCosts: BN[],
//     totalQuantity: BN,
//     tokenMint: PublicKey
//   ): Promise<Hash> {
//     return await this.program.methods
//       .createTrade(productCost, logisticsCosts, totalQuantity)
//       .accounts({
//         globalState: this.globalStatePda,
//         seller: this.wallet.publicKey,
//         systemProgram: SystemProgram.programId,
//         tokenMint,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async buyTrade(tradePda: PublicKey, quantity: BN, logisticsProvider: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .buyTrade(quantity, logisticsProvider)
//       .accounts({
//         globalState: this.globalStatePda,
//         trade: tradePda,
//         buyer: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   // --- Purchase Management ---
//   async confirmDeliveryAndPurchase(purchasePda: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .confirmDeliveryAndPurchase()
//       .accounts({
//         globalState: this.globalStatePda,
//         purchase: purchasePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async confirmPurchase(purchasePda: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .confirmPurchase()
//       .accounts({
//         globalState: this.globalStatePda,
//         purchase: purchasePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async cancelPurchase(purchasePda: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .cancelPurchase()
//       .accounts({
//         globalState: this.globalStatePda,
//         purchase: purchasePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async raiseDispute(purchasePda: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .raiseDispute()
//       .accounts({
//         globalState: this.globalStatePda,
//         purchase: purchasePda,
//         user: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   async resolveDispute(purchasePda: PublicKey, winner: PublicKey): Promise<Hash> {
//     return await this.program.methods
//       .resolveDispute(winner)
//       .accounts({
//         globalState: this.globalStatePda,
//         purchase: purchasePda,
//         admin: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   // --- Withdraw Escrow Fees ---
//   async withdrawEscrowFees(): Promise<Hash> {
//     return await this.program.methods
//       .withdrawEscrowFees()
//       .accounts({
//         globalState: this.globalStatePda,
//         admin: this.wallet.publicKey,
//       })
//       .signers([this.wallet])
//       .rpc();
//   }

//   // --- Read / Query Functions ---
//   async getTrade(tradePda: PublicKey) {
//     return await this.program.account.trade.fetch(tradePda);
//   }

//   async getPurchase(purchasePda: PublicKey) {
//     return await this.program.account.purchase.fetch(purchasePda);
//   }

//   async getBuyerPurchases(user: PublicKey) {
//     return await this.program.account.purchase.all([
//       { memcmp: { offset: 32, bytes: user.toBase58() } }, // assuming buyer stored at offset 32
//     ]);
//   }

//   async getSellerTrades(user: PublicKey) {
//     return await this.program.account.trade.all([
//       { memcmp: { offset: 0, bytes: user.toBase58() } }, // assuming seller stored at offset 0
//     ]);
//   }

//   // --- Event-like Listeners ---
//   watchEvent<T>(
//     eventName: string,
//     callback: (event: T) => void
//   ): number {
//     return this.program.addEventListener(eventName, callback);
//   }

//   removeEventListener(listenerId: number) {
//     this.program.removeEventListener(listenerId);
//   }

//   // --- Utility ---
//   getWalletAddress(): PublicKey {
//     return this.wallet.publicKey;
//   }
// }

// import * as anchor from "@project-serum/anchor";
import * as anchor from "@coral-xyz/anchor";

import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createApproveInstruction,
  getAccount,createMint,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  Account
} from "@solana/spl-token";
// import idl from "../../../../dezenmart_rust_smart_contract/target/idl/dezenmart_logistics.json"; 
import idl from "../../abi/dezenmart_logistics.json" 
// import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import fs from "fs";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { EventEmitterClass } from "../emitter";
const IDL = idl as unknown  as anchor.Idl;
const PROGRAM_ADDRESS = new anchor.web3.PublicKey(idl.address);
const SOLANAPROGRAMID = anchor.web3.SystemProgram.programId
// const TOKENPROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXuAYJkmXvzJvmfK57a")
const TOKENPROGRAM = TOKEN_PROGRAM_ID;
export const TESTTOKENMINT = new PublicKey("Do1mZe9KZxnn4XdEQm53srKvbpSo8ae7BitH4L9UEXv9")
export const TESTTOKENACCOUNT = new PublicKey("5EHhG8Pd4HA4myMgQ4wFTqhRvvrMSAsTCqNFJfhh32mk")
export const TESTACCOUNT = new PublicKey("BTd1DEeDRkfFV6K1BXPTJG6PXxLhS3tMsiSYoJtoidv5")
console.log(SOLANAPROGRAMID)
const keypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("/Users/apple/.config/solana/id.json", "utf-8")))
);
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const wallet = new anchor.Wallet(keypair);
export const DefaultProvider =new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
// export const DefaultProvider = anchor.AnchorProvider.local();
const DefaultProgram = new anchor.Program(IDL, DefaultProvider);
const DefaultWallet = DefaultProvider.wallet
const defaultTokenDecimals = 9;

// DefaultProgram.programId


interface ISolanaSeviceConfig{provider?: anchor.AnchorProvider, program?: anchor.Program}
export class DezenMartSolanaService extends EventEmitterClass {
  public provider: anchor.AnchorProvider;
  public program: anchor.Program;
  public wallet: anchor.Wallet;
  public globalStatePda: any;

  constructor(data?:ISolanaSeviceConfig) {
    super()
    this.provider = data?.provider||DefaultProvider;
    this.wallet = (data?.provider||DefaultProvider).wallet as NodeWallet  ;
    this.program = data?.program||DefaultProgram;






    const [globalStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("global_state")],
  this.program.programId

  
  
);


this.globalStatePda =globalStatePda

  }

  async test(){
    try {
              const [logisticsProviderPDA,bump] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("logistics_provider")
    ,
    this.wallet.publicKey.toBuffer()
  ],
  this.program.programId

  
  
);

// const mint = await createMint(
//   DefaultProvider.connection,
//   DefaultWallet, // payer
//   DefaultWallet.publicKey, // mint authority
//   null, // freeze authority (optional)
//   9 // decimals
// );
      console.log("✅ Connected to Solana cluster!");
    // const version = await this.provider.connection.getVersion();
    const data = await this.initliaze()
    // const data = await ((this.program.account as any)?.logisticsProviderAccount.fetch(logisticsProviderPDA))
// const data_ = await this.createTrade({seller:this.wallet.publicKey,tradeId:2,productCost:3,logisticsProviders:[this.wallet.publicKey],logisticsCosts:[100],totalQuantity:12,tokenMint:TESTTOKENMINT})
// const data__ = await this.buyTrade({
//   tokenMint:TESTTOKENMINT,
//   tradeId:2,
//   quantity:1,
//   logisticsProvider:this.wallet.publicKey,
//   buyerTokenAccount:TESTTOKENACCOUNT,
//   buyer:this.wallet.publicKey,
//   purchaseId:2


// })
// const data = await this.confirmDeliveryAndPurchase({
//   tokenMint:TESTTOKENMINT,
//   tradeId:1,

//   logisticsProvider:this.wallet.publicKey,
//   sellerAccount:TESTTOKENACCOUNT,
//   sellerTokenAccount:TESTTOKENACCOUNT,
//   buyer:this.wallet.publicKey,
//   purchaseId:1


// })
// const data = await this.cancelPurchase({
//   tokenMint:TESTTOKENMINT,
//   tradeId:2,

//   // logisticsProvider:this.wallet.publicKey,
//   buyerAccount:TESTTOKENACCOUNT,
//   buyerTokenAccount:TESTTOKENACCOUNT,
//   buyer:this.wallet.publicKey,
//   purchaseId:2


// })
    console.log("✅ Connected to Solana cluster!");
    console.log("RPC Version: gotten data", data);
  } catch (err) {
    console.error("❌ Failed to connect to Solana cluster:", err);
  }
  }
async initliaze (){
  try {
    console.log(this.program.programId,"Dddd")
    const txSig = await this.program.methods
      .initialize()
      .accounts({
        globalState: this.globalStatePda,
        admin: this.wallet.publicKey,
        systemProgram: SOLANAPROGRAMID,
      })
      .signers([]) // wallet is already your provider signer
      .rpc();

    console.log("✅ Initialize successful!");
    console.log("Transaction signature:", txSig);
    console.log("Global state PDA:", this.globalStatePda.toBase58());
  } catch (err) {
    console.error("❌ Initialize failed:", err);
  }

}

// async seed(){
// await this.seedDefaultLogisticProvider()
// }
  // ================== Registration ==================
  
// logistics_provider
  async registerLogisticsProvider(provider:PublicKey): Promise<string> {
        const [logisticsProviderPDA,bump] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("logistics_provider")
    ,
    provider.toBuffer()
  ],
  this.program.programId

  
  
);
  // productCost = productCost * defaultTokenDecimals
console.log("PDA:", logisticsProviderPDA.toBase58(), "Bump:", bump);
    return await this.program.methods
      .registerLogisticsProvider()
      .accounts({
        // admin,
        providerAccount:logisticsProviderPDA,
        provider,
        systemProgram: SOLANAPROGRAMID,
      })
      .rpc();
  }


  // async seedDefaultLogisticProvider(){

  //   let logistics = [
  //     {
  //       provider: this.wallet.publicKey
        
  //     }
  //   ]

  //  return await  Promise.all(logistics.map(async (e)=>{
  //   try{

  //     await this.registerLogisticsProvider(e.provider)
  //   }catch(e:any){
  //     console.log(e)

  //   }
  //   }))

  // }

  async registerBuyer(): Promise<string> {
    return await this.program.methods
      .registerBuyer()
      .accounts({
        buyer: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async registerSeller(): Promise<string> {
    return await this.program.methods
      .registerSeller()
      .accounts({
        seller: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ================== Trade & Purchase Reads ==================

  async getTrade(tradeId: PublicKey) {
    // return await this.program.account.trade.fetch(tradeId);
  }

  async getPurchase(purchaseId: PublicKey) {
    // return await this.program.account.purchase.fetch(purchaseId);
  }

  async getBuyerPurchases(buyer: PublicKey) {
    // return await this.program.account.purchase.all([
    //   { memcmp: { offset: 8, bytes: buyer.toBase58() } },
    // ]);
  }

  async getSellerTrades(seller: PublicKey) {
    // return await this.program.account.trade.all([
    //   { memcmp: { offset: 8, bytes: seller.toBase58() } },
    // ]);
  }

  async getProviderTrades(provider: PublicKey) {
    // return await this.program.account.purchase.all([
    //   { memcmp: { offset: 40, bytes: provider.toBase58() } },
    // ]);
  }

  // ================== Purchase Management ==================



  async confirmPurchase(purchase: PublicKey) {
    return await this.program.methods
      .confirmPurchase()
      .accounts({
        buyer: this.wallet.publicKey,
        purchase,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // async cancelPurchase(purchase: PublicKey) {
  //   return await this.program.methods
  //     .cancelPurchase()
  //     .accounts({
  //       buyer: this.wallet.publicKey,
  //       purchase,
  //       systemProgram: SystemProgram.programId,
  //     })
  //     .rpc();
  // }

  // ================== Dispute ==================

  async raiseDispute(purchase: PublicKey) {
    return await this.program.methods
      .raiseDispute()
      .accounts({
        buyer: this.wallet.publicKey,
        purchase,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async resolveDispute(purchase: PublicKey, winner: PublicKey) {
    return await this.program.methods
      .resolveDispute(winner)
      .accounts({
        admin: this.wallet.publicKey,
        purchase,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ================== Admin ==================

  async withdrawEscrowFees() {
    return await this.program.methods
      .withdrawEscrowFees()
      .accounts({
        admin: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ================== SPL Token Helpers ==================

  async getTokenBalance(tokenMint: PublicKey, owner: PublicKey) {
    const ata = await getAssociatedTokenAddress(tokenMint, owner);
    try {
      const account = await getAccount(this.provider.connection, ata);
      return account.amount;
    } catch {
      return 0n; // account does not exist
    }
  }

  async approveToken(
    tokenMint: PublicKey,
    delegate: PublicKey,
    amount: bigint
  ) {
    const ata = await getAssociatedTokenAddress(tokenMint, this.wallet.publicKey);
    const tx = new Transaction().add(
      createApproveInstruction(
        ata,
        delegate,
        this.wallet.publicKey,
        amount
      )
    );
    return await this.provider.sendAndConfirm(tx);
  }

  async getTokenAllowance(
    _tokenMint: PublicKey,
    _owner: PublicKey,
    _delegate: PublicKey
  ) {
    // SPL tokens don't have allowance in the ERC20 sense; use getAccount and check delegate/amount
    const ata = await getAssociatedTokenAddress(_tokenMint, _owner);
    const account = await getAccount(this.provider.connection, ata);
    if (account.delegate?.equals(_delegate)) return account.delegatedAmount;
    return 0n;
  }

  // ================== Event Listening ==================

  watchTradeCreated(callback?: (trade: any) => void) {
     this.program.addEventListener("TradeCreated", (event, slot)=>{
      console.log("dddddd")
      let id  =  (event as any)?.data?.tradeId
      if(id){

        this.emit(`tradeCreated_${id}`,(event as any)?.data)
        
      }

    });
     this.program.addEventListener("tradeCreated", (event, slot)=>{
      console.log("dddddd")
      let id  =  (event as any)?.data?.tradeId
      if(id){

        this.emit(`tradeCreated_${id}`,(event as any)?.data)
        
      }

    });
     this.program.addEventListener("tradecreated", (event, slot)=>{
      console.log("dddddd")
      let id  =  (event as any)?.data?.tradeId
      if(id){

        this.emit(`tradeCreated_${id}`,(event as any)?.data)
        
      }

    });
     this.program.addEventListener("*", (event, slot)=>{
      console.log("dddddd")
      let id  =  (event as any)?.data?.tradeId
      if(id){

        this.emit(`tradeCreated_${id}`,(event as any)?.data)
        
      }

    });
  }

  watchPurchaseCreated(callback: (purchase: any) => void) {
    return this.program.addEventListener("PurchaseCreated", callback);
  }

  watchDisputeRaised(callback: (dispute: any) => void) {
    return this.program.addEventListener("DisputeRaised", callback);
  }

  watchDisputeResolved(callback: (dispute: any) => void) {
    return this.program.addEventListener("DisputeResolved", callback);
  }

  // ================== Utility ==================
 u64ToBufferLE(num: number | bigint): Buffer {
  const buf = Buffer.alloc(8); // 8 bytes for u64
  buf.writeBigUInt64LE(BigInt(num), 0);
  return buf;
}




 isValidSolanaAddress(address: string): boolean {
    if (!address) {
        return false;
    }
    try {
        // Attempt to create a PublicKey from the string.
        // This will throw an error if the string is not valid Base58 or the wrong length.
        const pk = new PublicKey(address);
        
        // Optional: Check if the key is the zero key, which is rarely valid for an input.
        if (pk.toBase58() === PublicKey.default.toBase58()) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

 isValidTokenAccountAddress(tokenAccountAddress: string): boolean {
    // Since a Token Account address is simply a Public Key, the validation mechanism is identical.
    return this.isValidSolanaAddress(tokenAccountAddress);
}
  async createTrade(
{    seller,
    tradeId,
    productCost,
    logisticsProviders,
    logisticsCosts,
    totalQuantity,
    tokenMint}:{    seller: PublicKey,
    tradeId: number,
    productCost: number,
    logisticsProviders: PublicKey[],
    logisticsCosts: number[],
    totalQuantity: number,
    tokenMint: PublicKey}
  ) {

    //  productCost = pow (productCost , defaultTokenDecimals)
// const tradeIdBuffer = Buffer.alloc(8);
// tradeIdBuffer.writeBigUInt64LE(BigInt(2));
            const [tradePDA,bump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("trade")
    ,
    
    // Buffer.from()
this.u64ToBufferLE(tradeId)
// tradeIdBuffer
// new anchor.BN(891).toArray('le', 8)
    // Buffer.from(new BigUint64Array([BigInt(productId.toString())]).buffer)
  ],
  this.program.programId

  
  
);



console.log(tradePDA,"mmmnmbf")



    let tx = await this.program.methods
      .createTrade(new anchor.BN(tradeId),new anchor.BN(productCost), logisticsProviders, logisticsCosts.map(e=>new anchor.BN(e)), new anchor.BN(totalQuantity))
     
     
      .accounts({
        admin:this.wallet.publicKey,
        seller:seller,
        tokenMint,
        tradeAccount:tradePDA,
        systemProgram: SOLANAPROGRAMID,
        globalState:this.globalStatePda,
        // tradeId:productId,
      }) 
      //  .instructionArgs({ tradeId: productId })
      .rpc();
console.log(tx)
      // return await this.getEvent("TradeCreated",tx)

      let d = await this.getEvent("tradeCreated",tx)
      // console.log(d.tradeId.toNumber())
      return d
  }
  async getEvent (event_:string,tx:string){
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const txDetails = await this.provider.connection.getTransaction(
    tx, 
    { commitment: "confirmed" }
);
    const logs = txDetails?.meta?.logMessages || [];
const eventParser = new anchor.EventParser(this.program.programId, this.program.coder);
const events = eventParser.parseLogs(logs);

for (const event of events) {

    if (event.name === event_) {
     
        // console.log("Trade ID from logs:", event.data.tradeId.toNumber());
        // console.log("Trade PDA from logs:", event.data.tradePda.toBase58());
        // const event__ = this.program.coder.events?.decode("tradeCreated");
        // Handle your event data
        return event.data
    }
}

  

  }


  async  findOrCreateATA(
    // connection: Connection,
    {payer,mintAddress,ownerAddress}:
    {payer?: Keypair,
    mintAddress: PublicKey,
    ownerAddress: PublicKey}
): Promise<Account> {
    console.log(`Checking ATA for owner ${ownerAddress.toBase58()} and mint ${mintAddress.toBase58()}...`);
    
    // getOrCreateAssociatedTokenAccount handles the following steps automatically:
    // 1. Calculates the deterministic ATA address.
    // 2. Checks if the account exists on the network.
    // 3. If it doesn't exist, it builds and sends the transaction to create it.
    // 4. Returns the final, validated Account object.
    
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.provider.connection,
        payer||this.wallet.payer, // The Keypair that signs and pays the rent (e.g., the buyer)
        mintAddress,
        ownerAddress,
        // The last two are standard and usually not changed:
        false, // allowOwnerOffCurve: false for standard user wallets
        'confirmed',
        {},
        TOKENPROGRAM,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log(`✅ Token Account (ATA) Address: ${tokenAccount.address.toBase58()}`);
    return tokenAccount;
}

// --- Example Usage in Your Test File ---

// async function exampleUsage(program: anchor.Program, provider: anchor.Provider, buyer: Keypair, mintAccountPDA: PublicKey) {
//     // 1. Get the final, confirmed ATA object
//     const buyerATA = await findOrCreateATA(
//         provider.connection,
//         buyer,            // payer is the buyer's keypair
//         mintAccountPDA,   // the token you are trading
//         buyer.publicKey   // the owner of the tokens
//     );

//     // 2. Extract the address to use in the Anchor instruction
//     const buyerTokenAccountAddress = buyerATA.address;

//     // 3. Now you can use this address in your CPI-based instruction:
//     const tx = await program.methods.buyTrade(...)
//         .accounts({
//             // ...
//             buyerTokenAccount: buyerTokenAccountAddress,
//             buyer: buyer.publicKey,
//             // ...
//         })
//         .signers([buyer])
//         .rpc();
        
//     console.log("Transaction sent successfully.");
// }

  async confirmDeliveryAndPurchase({sellerTokenAccount,tokenMint,sellerAccount,tradeId,purchaseId,buyer,logisticsProvider}:{purchaseId:number,tradeId:number,buyer:PublicKey,
    logisticsProvider:PublicKey,
    sellerTokenAccount:PublicKey,
    sellerAccount:PublicKey,
    tokenMint:PublicKey,
  
  }) {
                const [purchasePDA,purchaseBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("purchase")
    ,
    

this.u64ToBufferLE(purchaseId)

  ],
  this.program.programId

  
  
);
                const [tradePDA,Bump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("trade")
    ,
    

this.u64ToBufferLE(tradeId)

  ],
  this.program.programId

  
  
);
                const [escrowPDA,escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow")
    ,
    tokenMint.toBuffer()
   
  ],
  this.program.programId

  
  
);

let logisticsTokenAccount  = await this.findOrCreateATA({
  mintAddress:tokenMint,
  ownerAddress:logisticsProvider


})
 sellerTokenAccount  = sellerTokenAccount ||await this.findOrCreateATA({
  mintAddress:tokenMint,
  ownerAddress:sellerAccount


})

console.log(
  logisticsTokenAccount.address

)
console.log(
  sellerTokenAccount

)
console.log(this.program.methods
      .confirmDeliveryAndPurchase)
// return;
    let tx =  await this.program.methods
      .confirmDeliveryAndPurchase(new anchor.BN(purchaseId))
      .accounts({
        buyer:buyer,
        tradeAccount:tradePDA,
        purchaseAccount:purchasePDA,

        logisticsTokenAccount:logisticsTokenAccount.address,
        sellerTokenAccount,

        escrowTokenAccount:escrowPDA,
        tokenMint,
     
      //  globalState:this.globalStatePda,
        // systemProgram: SOLANAPROGRAMID,
        tokenProgram:TOKENPROGRAM
      })
      .rpc();


      return await this.getEvent("purchaseCompletedAndConfirmed",tx)
  }
  async cancelPurchase({buyerTokenAccount,tokenMint,buyerAccount,tradeId,purchaseId,buyer}:{purchaseId:number,tradeId:number,buyer:PublicKey,
    // logisticsProvider:PublicKey,
    buyerTokenAccount:PublicKey,
    buyerAccount:PublicKey,
    tokenMint:PublicKey,
  
  }) {
                const [purchasePDA,purchaseBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("purchase")
    ,
    

this.u64ToBufferLE(purchaseId)

  ],
  this.program.programId

  
  
);
                const [tradePDA,Bump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("trade")
    ,
    

this.u64ToBufferLE(tradeId)

  ],
  this.program.programId

  
  
);
                const [escrowPDA,escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow")
    ,
    tokenMint.toBuffer()
   
  ],
  this.program.programId

  
  
);


 buyerTokenAccount  = buyerTokenAccount ||await this.findOrCreateATA({
  mintAddress:tokenMint,
  ownerAddress:buyerAccount


})


console.log(
  buyerTokenAccount

)
console.log(this.program.methods
      .confirmDeliveryAndPurchase)
// return;
    let tx =  await this.program.methods
      .cancelPurchase(new anchor.BN(purchaseId))
      .accounts({
        purchaseAccount:purchasePDA,
        tradeAccount:tradePDA,
        escrowTokenAccount:escrowPDA,
        buyerTokenAccount,

       
        
        tokenMint,
        buyer:buyer,
     
      //  globalState:this.globalStatePda,
        // systemProgram: SOLANAPROGRAMID,
        tokenProgram:TOKENPROGRAM
      })
      .rpc();

return tx
      // return await this.getEvent("purchaseCompletedAndConfirmed",tx)
  }

  async buyTrade(
   {tradeId,purchaseId,buyer,quantity,logisticsProvider
    ,
    tokenMint,
    buyerTokenAccount
  
  }:{ tradeId:number,
    buyer: PublicKey,
    purchaseId:number,
    quantity: number,
    logisticsProvider: PublicKey,
    tokenMint: PublicKey
    buyerTokenAccount: PublicKey
  }
  ) {

                const [tradePDA,bump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("trade")
    ,
    
    // Buffer.from()
this.u64ToBufferLE(tradeId)
// tradeIdBuffer
// new anchor.BN(891).toArray('le', 8)
    // Buffer.from(new BigUint64Array([BigInt(productId.toString())]).buffer)
  ],
  this.program.programId

  
  
);
                const [purchasePDA,purchaseBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("purchase")
    ,
    

this.u64ToBufferLE(purchaseId)

  ],
  this.program.programId

  
  
);
                const [buyerPDA,buyerBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("buyer")
    ,
    buyer.toBuffer()
   
  ],
  this.program.programId

  
  
);
                const [escrowPDA,escrowBump] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("escrow")
    ,
    tokenMint.toBuffer()
   
  ],
  this.program.programId

  
  
);

    let tx = await this.program.methods
      .buyTrade(new anchor.BN(tradeId),new anchor.BN(purchaseId) ,new anchor.BN(quantity), logisticsProvider)
      .accounts({
        buyer: buyer,
        // trade,
        tokenMint,

            //  admin:this.wallet.publicKey,
        // seller:seller,
    buyerTokenAccount:buyerTokenAccount,
        tradeAccount:tradePDA,
        buyerAccount:buyerPDA,
        escrowTokenAccount:escrowPDA,
        purchaseAccount:purchasePDA,
        globalState:this.globalStatePda,
        systemProgram: SOLANAPROGRAMID,
        tokenProgram:TOKENPROGRAM
    
        
      })
      .rpc();

let d = await this.getEvent("purchaseCreated",tx)


return d
  }


  async gettest(){
//     const escrowTokenAccountInfo = await this.provider.connection.getTokenAccountBalance(
//     escrowPDA // The PDA address of the escrow
// );

// const finalBalance = parseInt(escrowTokenAccountInfo.value.amount);
// const finalBalanceUI = escrowTokenAccountInfo.value.uiAmount;

// console.log(`\n✅ ESCROW BALANCE CHECK:`);
// // console.log(`   Expected Amount (Raw): ${EXPECTED_AMOUNT}`);
// console.log(`   Final Escrow Balance (Raw): ${finalBalance}`);
// console.log(`   Final Escrow Balance (UI): ${finalBalanceUI}`);






// const requiredAmountBN = tradeAccountData.productCost;
// console.log(requiredAmountBN)

// // Convert the Anchor BN (Big Number) to a regular JavaScript number for display
// const requiredAmountRaw = requiredAmountBN.toNumber(); 

// // console.log("\n💰 TRADE ACCOUNT DATA CHECK:");
// // console.log(`   Seller: ${tradeAccountData.seller.toBase58()}`);
// console.log(`   Required Raw Amount (Price): ${requiredAmountRaw}`);
  }
}


let f = async ()=>{
  let v = new DezenMartSolanaService()
    await new Promise((resolve) => setTimeout(resolve, 5000));
  await v.test()

}

f()