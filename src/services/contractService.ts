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

// Payment token mapping - symbol to contract address
// Define testnet and mainnet token addresses
const TESTNET_TOKENS = {
  cUSD: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
  USDT: '0x803700bD991d293306D6e7dCcF2B49F9137b437e',
  cEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
  cREAL: '0xE4D517785D091D3c54818832dB6094bcc2744545',
  cKES: '0x1E0433C1769271ECcF4CFF9FDdD515eefE6CdF92',
  PUSO: '0x5E0E3c9419C42a1B04e2525991FB1A2C467AB8bF',
  cCOP: '0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4',
  eXOF: '0xB0FA15e002516d0301884059c0aaC0F0C72b019D',
  cNGN: '0x4a5b03B8b16122D330306c65e4CA4BC5Dd6511d0',
  cJPY: '0x2E51F41238cA36a421C9B8b3e189e8Cc7653FE67',
  cCHF: '0xADC57C2C34aD021Df4421230a6532F4e2E1dCE4F',
  cZAR: '0x1e5b44015Ff90610b54000DAad31C89b3284df4d',
  cGBP: '0x47f2Fb88105155a18c390641C8a73f1402B2BB12',
  cAUD: '0x84CBD49F5aE07632B6B88094E81Cce8236125Fe0',
  cCAD: '0x02EC9E0D2Fd73e89168C1709e542a48f58d7B133',
  cGHS: '0x295B66bE7714458Af45E6A6Ea142A5358A6cA375',
  G$: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
} as const;

const MAINNET_TOKENS = {
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
  cKES: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0',
  PUSO: '0x105d4A9306D2E55a71d2Eb95B81553AE1dC20d7B',
  cCOP: '0x8a567e2ae79ca692bd748ab832081c45de4041ea',
  eXOF: '0x73F93dcc49cB8A239e2032663e9475dd5ef29A08',
  cNGN: '0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71',
  cJPY: '0xc45eCF20f3CD864B32D9794d6f76814aE8892e20',
  cCHF: '0xb55a79F398E759E43C95b979163f30eC87Ee131D',
  cZAR: '0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6',
  cGBP: '0xCCF663b1fF11028f0b19058d0f7B674004a40746',
  cAUD: '0x7175504C455076F15c04A2F90a8e352281F492F9',
  cCAD: '0xff4Ab19391af240c311c54200a492233052B6325',
  cGHS: '0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313',
  G$: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A',
} as const;

export const PAYMENT_TOKENS =
  process.env.NODE_ENV === 'production' ? MAINNET_TOKENS : TESTNET_TOKENS;

export type PaymentTokenSymbol = keyof typeof PAYMENT_TOKENS;

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

// Generic ERC20 Contract ABI (for approve, allowance, balanceOf)
const ERC20_ABI = [
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
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export class DezenMartContractService {
  private publicClient;
  private walletClient;
  private account;
  private contract;
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
  }

  // Helper method to get token contract instance
  private getTokenContract(tokenAddress: Address) {
    return getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
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

  // Helper to perform token reads
  private async readTokenContract(
    tokenAddress: Address,
    functionName: 'allowance' | 'balanceOf' | 'decimals',
    args:
      | readonly [`0x${string}`, `0x${string}`]
      | readonly [`0x${string}`]
      | readonly [] = [],
  ): Promise<bigint | number> {
    return await this.publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName,
      args: args as any,
    });
  }

  // Helper to perform token writes
  private async writeTokenContract(
    tokenAddress: Address,
    functionName: 'approve',
    args: [`0x${string}`, bigint],
  ) {
    this.ensureWalletClient();
    return await this.walletClient!.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
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

  // --- Token Functions ---

  async getTokenBalance(
    tokenAddress: Address,
    userAddress: Address,
  ): Promise<bigint> {
    const balance = await this.readTokenContract(tokenAddress, 'balanceOf', [
      userAddress,
    ]);
    return BigInt(balance);
  }

  async getTokenAllowance(
    tokenAddress: Address,
    owner: Address,
    spender: Address,
  ): Promise<bigint> {
    const allowance = await this.readTokenContract(tokenAddress, 'allowance', [
      owner,
      spender,
    ]);
    return BigInt(allowance);
  }

  async getTokenDecimals(tokenAddress: Address): Promise<number> {
    try {
      // First, try to get decimals from the token contract
      const decimals = await this.readTokenContract(tokenAddress, 'decimals');
      return Number(decimals);
    } catch (error) {
      console.warn(
        `Could not fetch decimals for token ${tokenAddress}. Error: ${error}`,
      );

      const usdtAddress = this.getTokenAddress('USDT');
      if (tokenAddress.toLowerCase() === usdtAddress.toLowerCase()) {
        return 6;
      }

      return 18;
    }
  }

  async approveToken(tokenAddress: Address, amount: bigint): Promise<Hash> {
    return await this.writeTokenContract(tokenAddress, 'approve', [
      config.CONTRACT_ADDRESS as `0x${string}`,
      amount,
    ]);
  }

  // --- Legacy USDT Functions (for backward compatibility) ---

  async getUSDTBalance(address: Address): Promise<bigint> {
    return await this.getTokenBalance(config.USDT_ADDRESS as Address, address);
  }

  async getUSDTAllowance(owner: Address, spender: Address): Promise<bigint> {
    return await this.getTokenAllowance(
      config.USDT_ADDRESS as Address,
      owner,
      spender,
    );
  }

  async approveUSDT(amount: bigint): Promise<Hash> {
    return await this.approveToken(config.USDT_ADDRESS as Address, amount);
  }

  // --- Trade Functions ---

  async createTrade(
    sellerWalletAddress: Address,
    productCostInToken: string,
    totalQuantity: bigint,
    tokenAddress: Address,
  ): Promise<{ hash: Hash; tradeId: bigint }> {
    // Get token decimals for proper conversion
    const decimals = await this.getTokenDecimals(tokenAddress);

    // Convert token amounts to wei (using token's decimals)
    const productCost = parseUnits(productCostInToken, decimals);

    const hash = await this.writeContract('createTrade', [
      sellerWalletAddress, // Pass seller address to the contract
      productCost,
      totalQuantity,
      tokenAddress, // Pass token address to the contract
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
    tokenAddress: Address,
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

    const TOKEN_ADDRESS = tokenAddress as Address;

    // Check current allowance
    const currentAllowance = await this.getTokenAllowance(
      TOKEN_ADDRESS,
      this.account!.address,
      config.CONTRACT_ADDRESS as `0x${string}`,
    );

    // Approve token if needed
    if (BigInt(currentAllowance) < totalCost) {
      const approvalHash = await this.approveToken(TOKEN_ADDRESS, totalCost);

      // Wait for approval transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const approvalReceipt = await this.getTransactionReceipt(approvalHash);
      if (!approvalReceipt.status)
        throw new Error('Token approval transaction failed');
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

  async confirmDeliveryAndPurchase(purchaseId: string): Promise<Hash> {
    return await this.writeContract('confirmDeliveryAndPurchase', [purchaseId]);
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
            if (decoded.eventName === 'PurchaseCreated') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding PurchaseCreated event:', error);
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
            if (decoded.eventName === 'DeliveryConfirmed') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding DeliveryConfirmed event:', error);
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
            if (decoded.eventName === 'DisputeRaised') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding DisputeRaised event:', error);
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
            if (decoded.eventName === 'DisputeResolved') {
              callback(decoded.args as any);
            }
          } catch (error) {
            console.error('Error decoding DisputeResolved event:', error);
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

  formatToken(amount: bigint, decimals: number): string {
    return formatUnits(amount, decimals);
  }

  parseToken(amount: string, decimals: number): bigint {
    return parseUnits(amount, decimals);
  }

  // Legacy functions for backward compatibility
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

  // Get available payment tokens
  getPaymentTokens(): Record<string, Address> {
    return PAYMENT_TOKENS;
  }

  // Get token address by symbol
  getTokenAddress(symbol: PaymentTokenSymbol): Address {
    return PAYMENT_TOKENS[symbol];
  }

  // Validate if token symbol is supported
  isValidPaymentToken(symbol: string): symbol is PaymentTokenSymbol {
    return Object.keys(PAYMENT_TOKENS).includes(symbol);
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
