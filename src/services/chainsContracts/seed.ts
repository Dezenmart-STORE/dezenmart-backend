import { LogisticsService } from "../logisticsService"
import { DefaultProvider, DezenMartSolanaService } from "./solana"

const solanaWallet = DefaultProvider.wallet

// DezenMartSolanaService
let SolanaChainService  = new DezenMartSolanaService()
let logisticsService = new LogisticsService()





export const  seedDefaultLogistics = async ()=>{

      let logistics = [
      {
        wallet: solanaWallet.publicKey,
        chain:"solana",
        name:"Dezenmart Logistics",
        walletAddress:solanaWallet.publicKey.toString()


        
      }
    ]

   return await  Promise.all(logistics.map(async (e)=>{
    try{

        

    //  let tx = await SolanaChainService.registerLogisticsProvider(e.wallet)
    //  console.log(tx)
   let data = await LogisticsService.createLogistics(e)
   console.log(data,"dataaaa")
    }catch(e:any){
      console.log(e)

    }
    }))
    
}

export  const  seedChain = async ()=>{


await seedDefaultLogistics()


}

// seedChain()