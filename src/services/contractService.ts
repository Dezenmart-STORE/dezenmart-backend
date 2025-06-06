import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  getContract,
  Address,
  Hash,
  TransactionReceipt,
  WatchEventReturnType,
  decodeEventLog,
  parseAbiItem,
  GetLogsReturnType,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores } from 'viem/chains';
import dotenv from 'dotenv';
import abi from '../abi/dezenmartAbi.json';
import config from '../configs/config';
import { StringDecoder } from 'string_decoder';

dotenv.config();

// Define types to match the contract structure
export interface Purchase {
  purchaseId: bigint;
  tradeId: bigint;
  buyer: Address;
  quantity: bigint;
  totalAmount: bigint;
  delivered: boolean;
  confirmed: boolean;
  disputed: boolean;
  chosenLogisticsProvider: Address;
  logisticsCost: bigint;
}

export interface Trade {
  seller: Address;
  logisticsProviders: Address[];
  logisticsCosts: bigint[];
  productCost: bigint;
  escrowFee: bigint;
  totalQuantity: bigint;
  remainingQuantity: bigint;
  active: boolean;
  purchaseIds: bigint[];
}

export interface ContractConfig {
  contractAddress: Address;
  usdtAddress: Address;
  privateKey?: `0x${string}`;
  isTestnet?: boolean;
  rpcUrl?: string;
}

// USDT Contract ABI (minimal for approve and allowance)
const USDT_ABI = [
  {
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export class DezenMartContractService {
  private publicClient;
  private walletClient;
  private account;
  // private configure: ContractConfig;
  private contract;
  private usdtContract;
  private eventUnsubscribers: (() => void)[] = [];

  constructor() {
    // Choose the appropriate chain
    const chain = config.IS_TESTNET ? celoAlfajores : celo;
    const rpcUrl =
      config.CELO_NODE_URL ||
      (config.IS_TESTNET
        ? 'https://alfajores-forno.celo-testnet.org'
        : 'https://forno.celo.org');

    // Create public client for reading
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Create wallet client if private key is provided
    if (config.PRIVATE_KEY) {
      this.account = privateKeyToAccount(config.PRIVATE_KEY as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain,
        transport: http(rpcUrl),
      });
    }

    // Initialize contract instances
    this.contract = getContract({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    });

    this.usdtContract = getContract({
      address: config.USDT_ADDRESS as `0x${string}`,
      abi: USDT_ABI,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    });
  }

  // Helper method to ensure wallet client exists
  private ensureWalletClient() {
    if (!this.walletClient || !this.account) {
      throw new Error(
        'Wallet client not initialized. Private key required for write operations.',
      );
    }
  }

  // Helper to perform contract reads
  private async readContract(functionName: string, args: any[] = []) {
    return await this.publicClient.readContract({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      functionName,
      args,
    });
  }

  // Helper to perform contract writes
  private async writeContract(functionName: string, args: any[] = []) {
    this.ensureWalletClient();
    return await this.walletClient!.writeContract({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      functionName,
      args,
    });
  }

  // Helper to perform USDT reads
  private async readUSDTContract(
    functionName: 'allowance' | 'balanceOf',
    args: readonly [`0x${string}`, `0x${string}`] | readonly [`0x${string}`]
  ): Promise<bigint> {
    return await this.publicClient.readContract({
      address: config.USDT_ADDRESS as `0x${string}`,
      abi: USDT_ABI,
      functionName,
      args: args as any,
    });
  }

  // Helper to perform USDT writes
  private async writeUSDTContract(
    functionName: 'approve',
    args: [`0x${string}`, bigint]) {
    this.ensureWalletClient();
    return await this.walletClient!.writeContract({
      address: config.USDT_ADDRESS as `0x${string}`,
      abi: USDT_ABI,
      functionName,
      args,
    });
  }

  // --- Registration Functions ---

  async registerLogisticsProvider(providerAddress: Address): Promise<Hash> {
    return await this.writeContract('registerLogisticsProvider', [
      providerAddress,
    ]);
  }

  async registerBuyer(): Promise<Hash> {
    return await this.writeContract('registerBuyer');
  }

  async registerSeller(): Promise<Hash> {
    return await this.writeContract('registerSeller');
  }

  // --- Read Functions ---

  async getLogisticsProviders(): Promise<Address[]> {
    return (await this.readContract('getLogisticsProviders')) as Address[];
  }

  async getTrade(tradeId: number): Promise<Trade> {
    const trade = (await this.readContract('getTrade', [tradeId])) as any;
    return {
      seller: trade.seller,
      logisticsProviders: trade.logisticsProviders,
      logisticsCosts: trade.logisticsCosts,
      productCost: trade.productCost,
      escrowFee: trade.escrowFee,
      totalQuantity: trade.totalQuantity,
      remainingQuantity: trade.remainingQuantity,
      active: trade.active,
      purchaseIds: trade.purchaseIds,
    };
  }

  async getPurchase(purchaseId: bigint): Promise<Purchase> {
    const purchase = (await this.readContract('getPurchase', [
      purchaseId,
    ])) as any;
    return {
      purchaseId: purchase.purchaseId,
      tradeId: purchase.tradeId,
      buyer: purchase.buyer,
      quantity: purchase.quantity,
      totalAmount: purchase.totalAmount,
      delivered: purchase.delivered,
      confirmed: purchase.confirmed,
      disputed: purchase.disputed,
      chosenLogisticsProvider: purchase.chosenLogisticsProvider,
      logisticsCost: purchase.logisticsCost,
    };
  }

  async getBuyerPurchases(): Promise<Purchase[]> {
    const purchases = (await this.readContract('getBuyerPurchases')) as any[];
    return purchases.map((p) => ({
      purchaseId: p.purchaseId,
      tradeId: p.tradeId,
      buyer: p.buyer,
      quantity: p.quantity,
      totalAmount: p.totalAmount,
      delivered: p.delivered,
      confirmed: p.confirmed,
      disputed: p.disputed,
      chosenLogisticsProvider: p.chosenLogisticsProvider,
      logisticsCost: p.logisticsCost,
    }));
  }

  async getSellerTrades(): Promise<Trade[]> {
    const trades = (await this.readContract('getSellerTrades')) as any[];
    return trades.map((t) => ({
      seller: t.seller,
      logisticsProviders: t.logisticsProviders,
      logisticsCosts: t.logisticsCosts,
      productCost: t.productCost,
      escrowFee: t.escrowFee,
      totalQuantity: t.totalQuantity,
      remainingQuantity: t.remainingQuantity,
      active: t.active,
      purchaseIds: t.purchaseIds,
    }));
  }

  async getProviderTrades(): Promise<Purchase[]> {
    const purchases = (await this.readContract('getProviderTrades')) as any[];
    return purchases.map((p) => ({
      purchaseId: p.purchaseId,
      tradeId: p.tradeId,
      buyer: p.buyer,
      quantity: p.quantity,
      totalAmount: p.totalAmount,
      delivered: p.delivered,
      confirmed: p.confirmed,
      disputed: p.disputed,
      chosenLogisticsProvider: p.chosenLogisticsProvider,
      logisticsCost: p.logisticsCost,
    }));
  }

  // --- USDT Functions ---

  async getUSDTBalance(address: Address): Promise<bigint> {
    return (await this.readUSDTContract('balanceOf', [address])) as bigint;
  }

  async getUSDTAllowance(owner: Address, spender: Address): Promise<bigint> {
    return (await this.readUSDTContract('allowance', [
      owner,
      spender,
    ])) as bigint;
  }

  async approveUSDT(amount: bigint): Promise<Hash> {
    return await this.writeUSDTContract('approve', [
      config.CONTRACT_ADDRESS as `0x${string}`,
      amount,
    ]);
  }

  // --- Trade Functions ---

  async createTrade(
    productCostInUSDT: string,
    logisticsProviders: Address[],
    logisticsCostsInUSDT: string[],
    totalQuantity: bigint,
  ): Promise<{ hash: Hash; tradeId: bigint }> {
    // Convert USDT amounts to Gwei (assuming 6 decimals for USDT)
    const productCost = parseUnits(productCostInUSDT, 18);
    const logisticsCosts = logisticsCostsInUSDT.map((cost) =>
      parseUnits(cost, 18),
    );

    const hash = await this.writeContract('createTrade', [
      productCost,
      logisticsProviders,
      logisticsCosts,
      totalQuantity,
    ]);

    // Wait for transaction receipt to get the trade ID from events
    const receipt = await this.getTransactionReceipt(hash);

    // Find the TradeCreated event in the receipt
    const tradeCreatedEvent = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: abi.DEZENMART_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'TradeCreated';
      } catch {
        return false;
      }
    });

    if (!tradeCreatedEvent) {
      throw new Error('TradeCreated event not found in transaction receipt');
    }

    const decoded = decodeEventLog({
      abi: abi.DEZENMART_ABI,
      data: tradeCreatedEvent.data,
      topics: tradeCreatedEvent.topics,
    });

    const tradeId = (decoded.args as any).tradeId as bigint;

    return { hash, tradeId };
  }

  async buyTrade(
    tradeId: number,
    quantity: bigint,
    logisticsProvider: Address,
  ): Promise<{ hash: Hash; purchaseId: bigint }> {
    this.ensureWalletClient();

    // Get trade details to calculate required approval
    const trade = await this.getTrade(tradeId);

    // Find the logistics cost for the chosen provider
    const providerIndex = trade.logisticsProviders.findIndex(
      (provider) => provider.toLowerCase() === logisticsProvider.toLowerCase(),
    );

    if (providerIndex === -1) {
      throw new Error('Invalid logistics provider');
    }

    const logisticsCost = trade.logisticsCosts[providerIndex];
    const totalCost = (trade.productCost + logisticsCost) * quantity;

    // Check current allowance
    const currentAllowance = await this.getUSDTAllowance(
      this.account!.address,
      config.CONTRACT_ADDRESS as `0x${string}`,
    );

    // Approve USDT if needed
    if (currentAllowance < totalCost) {
      const approvalHash = await this.approveUSDT(totalCost);

      // Wait for approval transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const approvalReceipt = await this.getTransactionReceipt(approvalHash);
      if (!approvalReceipt.status) throw new Error('USDT approval transaction failed');
    }

    const hash = await this.writeContract('buyTrade', [
      tradeId,
      quantity,
      logisticsProvider,
    ]);

    // Wait for transaction receipt to get the purchase ID from events
    const receipt = await this.getTransactionReceipt(hash);

    // Find the PurchaseCreated event in the receipt
    const purchaseCreatedEvent = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: abi.DEZENMART_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'PurchaseCreated';
      } catch {
        return false;
      }
    });

    if (!purchaseCreatedEvent) {
      throw new Error('PurchaseCreated event not found in transaction receipt');
    }

    const decoded = decodeEventLog({
      abi: abi.DEZENMART_ABI,
      data: purchaseCreatedEvent.data,
      topics: purchaseCreatedEvent.topics,
    });

    const purchaseId = (decoded.args as any).purchaseId as bigint;

    return { hash, purchaseId };
  }

  // --- Purchase Management Functions ---

  async confirmDelivery(purchaseId: string): Promise<Hash> {
    return await this.writeContract('confirmDelivery', [purchaseId]);
  }

  async confirmPurchase(purchaseId: string): Promise<Hash> {
    return await this.writeContract('confirmPurchase', [purchaseId]);
  }

  async cancelPurchase(purchaseId: bigint): Promise<Hash> {
    return await this.writeContract('cancelPurchase', [purchaseId]);
  }

  // --- Dispute Functions ---

  async raiseDispute(purchaseId: bigint): Promise<Hash> {
    return await this.writeContract('raiseDispute', [purchaseId]);
  }

  async resolveDispute(purchaseId: bigint, winner: Address): Promise<Hash> {
    return await this.writeContract('resolveDispute', [purchaseId, winner]);
  }

  // --- Admin Functions ---

  async withdrawEscrowFees(): Promise<Hash> {
    return await this.writeContract('withdrawEscrowFees');
  }

  // --- Event Listening ---

  async watchTradeCreated(
    callback: (args: {
      tradeId: bigint;
      seller: Address;
      productCost: bigint;
      totalQuantity: bigint;
    }) => void,
  ): Promise<() => void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      eventName: 'TradeCreated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          try {
            const decoded = decodeEventLog({
              abi: abi.DEZENMART_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TradeCreated') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding TradeCreated event:', error);
          }
        });
      },
    });

    this.eventUnsubscribers.push(unwatch);
    return unwatch;
  }

  async watchPurchaseCreated(
    callback: (args: {
      purchaseId: bigint;
      tradeId: bigint;
      buyer: Address;
      quantity: bigint;
    }) => void,
  ): Promise<() => void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      eventName: 'PurchaseCreated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          try {
            const decoded = decodeEventLog({
              abi: abi.DEZENMART_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TradeCreated') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding TradeCreated event:', error);
          }
        });
      },
    });

    this.eventUnsubscribers.push(unwatch);
    return unwatch;
  }

  async watchDeliveryConfirmed(
    callback: (args: { purchaseId: bigint }) => void,
  ): Promise<() => void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      eventName: 'DeliveryConfirmed',
      onLogs: (logs) => {
        logs.forEach((log) => {
          try {
            const decoded = decodeEventLog({
              abi: abi.DEZENMART_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TradeCreated') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding TradeCreated event:', error);
          }
        });
      },
    });

    this.eventUnsubscribers.push(unwatch);
    return unwatch;
  }

  async watchDisputeRaised(
    callback: (args: { purchaseId: bigint; initiator: Address }) => void,
  ): Promise<() => void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      eventName: 'DisputeRaised',
      onLogs: (logs) => {
        logs.forEach((log) => {
          try {
            const decoded = decodeEventLog({
              abi: abi.DEZENMART_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TradeCreated') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding TradeCreated event:', error);
          }
        });
      },
    });

    this.eventUnsubscribers.push(unwatch);
    return unwatch;
  }

  async watchDisputeResolved(
    callback: (args: { purchaseId: bigint; winner: Address }) => void,
  ): Promise<() => void> {
    const unwatch = this.publicClient.watchContractEvent({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      abi: abi.DEZENMART_ABI,
      eventName: 'DisputeResolved',
      onLogs: (logs) => {
        logs.forEach((log) => {
          try {
            const decoded = decodeEventLog({
              abi: abi.DEZENMART_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TradeCreated') {
              callback(decoded.args as any); // ✅ Works!
            }
          } catch (error) {
            console.error('Error decoding TradeCreated event:', error);
          }
        });
      },
    });

    this.eventUnsubscribers.push(unwatch);
    return unwatch;
  }

  // --- Historical Event Queries ---

  async getTradeCreatedEvents(
    fromBlock?: bigint,
    toBlock?: bigint,
  ): Promise<GetLogsReturnType> {
    return await this.publicClient.getLogs({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      event: parseAbiItem(
        'event TradeCreated(uint256 indexed tradeId, address indexed seller, uint256 productCost, uint256 totalQuantity)',
      ),
      fromBlock: fromBlock || 'earliest',
      toBlock: toBlock || 'latest',
    });
  }

  async getPurchaseCreatedEvents(
    fromBlock?: bigint,
    toBlock?: bigint,
  ): Promise<GetLogsReturnType> {
    return await this.publicClient.getLogs({
      address: config.CONTRACT_ADDRESS as `0x${string}`,
      event: parseAbiItem(
        'event PurchaseCreated(uint256 indexed purchaseId, uint256 indexed tradeId, address indexed buyer, uint256 quantity)',
      ),
      fromBlock: fromBlock || 'earliest',
      toBlock: toBlock || 'latest',
    });
  }

  // --- Utility Functions ---

  formatUSDT(amount: bigint): string {
    return formatUnits(amount, 6);
  }

  parseUSDT(amount: string): bigint {
    return parseUnits(amount, 6);
  }

  async getTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  // Clean up event listeners
  stopAllEventListeners(): void {
    this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.eventUnsubscribers = [];
  }

  // Get account address
  getAccountAddress(): Address | undefined {
    return this.account?.address;
  }
}

// Factory function for easy initialization
// export function createDezenMartService(
//   config: ContractConfig,
// ): DezenMartContractService {
//   return new DezenMartContractService(config);
// }

// Usage example:
/*
const contractService = createDezenMartService({
  contractAddress: '0x...',
  usdtAddress: '0x...',
  privateKey: '0x...',
  isTestnet: true,
});

// Register as seller
await contractService.registerSeller();

// Create a trade and get both transaction hash and trade ID
const { hash: tradeHash, tradeId } = await contractService.createTrade(
  '100', // 100 USDT product cost
  ['0x...'], // logistics provider addresses
  ['10'], // 10 USDT logistics cost
  BigInt(50) // 50 items
);

console.log(`Trade ${tradeId} created with hash: ${tradeHash}`);

// Buy a trade and get both transaction hash and purchase ID
const { hash: purchaseHash, purchaseId } = await contractService.buyTrade(
  tradeId,
  BigInt(5), // quantity
  '0x...' // logistics provider
);

console.log(`Purchase ${purchaseId} created with hash: ${purchaseHash}`);

// Listen for events
contractService.watchTradeCreated(({ tradeId, seller, productCost, totalQuantity }) => {
  console.log(`New trade created: ${tradeId} by ${seller}`);
});
*/
