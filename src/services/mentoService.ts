import { Mento } from '@mento-protocol/mento-sdk';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  decodeEventLog,
  WalletClient,
  PublicClient,
  Account,
  Chain,
  Transport,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoAlfajores } from 'viem/chains';
import config from '../configs/config';
import { ethers } from 'ethers';

class MentoService {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private account?: Account;
  private ethersSigner?: ethers.Signer;
  private mento?: Mento;
  private chain: Chain;

  constructor() {
    this.chain = config.IS_TESTNET ? celoAlfajores : celo;
    const rpcUrl =
      config.CELO_NODE_URL ||
      (config.IS_TESTNET
        ? 'https://alfajores-forno.celo-testnet.org'
        : 'https://forno.celo.org');

    // Fix 1: Explicitly type the transport
    const transport = http(rpcUrl) as Transport;

    // Fix 2: Create public client with explicit typing
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport,
    }) as PublicClient;

    if (config.PRIVATE_KEY) {
      this.account = privateKeyToAccount(config.PRIVATE_KEY as `0x${string}`);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: this.chain,
        transport,
      }) as WalletClient;

      const ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      this.ethersSigner = new ethers.Wallet(
        config.PRIVATE_KEY as `0x${string}`,
        ethersProvider,
      );
    }
  }

  private async initialize(): Promise<void> {
    if (!this.mento && this.walletClient) {
      this.mento = await Mento.create(this.ethersSigner!);
    } else if (!this.walletClient) {
      throw new Error(
        'MentoService: Wallet client not initialized. Private key required for this service.',
      );
    }
  }

  private ensureWalletClient(): void {
    if (!this.walletClient || !this.account) {
      throw new Error(
        'Wallet client not initialized. Private key required for write operations.',
      );
    }
  }

  // Helper function to convert BigNumber to bigint
  private bigNumberToBigInt(value: any): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    // If it's a BigNumber from ethers, convert it
    if (value && typeof value.toString === 'function') {
      return BigInt(value.toString());
    }
    // If it's already a string or number
    return BigInt(value);
  }

  // Fixed helper function to convert ethers transaction object to viem format
  private ethersToViemTx(ethersTx: any): any {
    const viemTx: any = {};

    if (ethersTx.to) viemTx.to = ethersTx.to as `0x${string}`;
    if (ethersTx.data) viemTx.data = ethersTx.data as `0x${string}`;
    if (ethersTx.value) viemTx.value = this.bigNumberToBigInt(ethersTx.value);
    if (ethersTx.gasLimit)
      viemTx.gas = this.bigNumberToBigInt(ethersTx.gasLimit);
    if (ethersTx.nonce) viemTx.nonce = Number(ethersTx.nonce);

    // Handle transaction type and gas pricing properly
    if (
      ethersTx.type === 2 ||
      (ethersTx.maxFeePerGas && ethersTx.maxPriorityFeePerGas)
    ) {
      // EIP-1559 transaction
      viemTx.type = 'eip1559';
      if (ethersTx.maxFeePerGas)
        viemTx.maxFeePerGas = this.bigNumberToBigInt(ethersTx.maxFeePerGas);
      if (ethersTx.maxPriorityFeePerGas)
        viemTx.maxPriorityFeePerGas = this.bigNumberToBigInt(
          ethersTx.maxPriorityFeePerGas,
        );
    } else {
      // Legacy transaction
      viemTx.type = 'legacy';
      if (ethersTx.gasPrice)
        viemTx.gasPrice = this.bigNumberToBigInt(ethersTx.gasPrice);
    }

    return viemTx;
  }

  public async getSwapQuote(
    tokenInAddr: `0x${string}`,
    tokenOutAddr: `0x${string}`,
    amountInString: string,
  ): Promise<{ quote: string; quoteBigInt: bigint }> {
    await this.initialize();
    // Assuming both tokens have 18 decimals as per your script.
    // For a more robust solution, you might want to fetch decimals for each token.
    const tokenUnits = 18;
    const amountIn = parseUnits(amountInString, tokenUnits);

    const quoteAmountOut = await this.mento!.getAmountOut(
      tokenInAddr,
      tokenOutAddr,
      amountIn,
    );

    // Convert BigNumber to bigint
    const quoteAmountOutBigInt = this.bigNumberToBigInt(quoteAmountOut);

    return {
      quote: formatUnits(quoteAmountOutBigInt, tokenUnits),
      quoteBigInt: quoteAmountOutBigInt,
    };
  }

  public async swap(
    tokenInAddr: `0x${string}`,
    tokenOutAddr: `0x${string}`,
    amountInString: string,
    slippagePercentage: number = 1, // Default 1% slippage
  ): Promise<{
    allowanceTxHash?: `0x${string}`;
    swapTxHash: `0x${string}`;
  }> {
    this.ensureWalletClient();
    await this.initialize();

    const tokenUnits = 18;
    const amountIn = parseUnits(amountInString, tokenUnits);

    const allowanceTxObj = await this.mento!.increaseTradingAllowance(
      tokenInAddr,
      amountIn,
    );

    // Convert ethers transaction object to viem format
    const viemAllowanceTx = this.ethersToViemTx(allowanceTxObj);

    const allowanceTxHash = await this.walletClient!.sendTransaction({
      ...viemAllowanceTx,
      account: this.account!,
      chain: this.walletClient!.chain,
    });
    const allowanceReceipt = await this.publicClient.waitForTransactionReceipt({
      hash: allowanceTxHash,
    });

    if (allowanceReceipt.status !== 'success') {
      throw new Error('Allowance approval transaction failed');
    }

    const quoteAmountOut = await this.mento!.getAmountOut(
      tokenInAddr,
      tokenOutAddr,
      amountIn,
    );

    // Convert BigNumber to bigint before calculations
    const quoteAmountOutBigInt = this.bigNumberToBigInt(quoteAmountOut);

    // Apply slippage
    const slippageFactor = BigInt(100 - slippagePercentage);
    const expectedAmountOut = (quoteAmountOutBigInt * slippageFactor) / 100n;

    const swapTxObj = await this.mento!.swapIn(
      tokenInAddr,
      tokenOutAddr,
      amountIn,
      expectedAmountOut,
    );

    // Convert ethers transaction object to viem format
    const viemSwapTx = this.ethersToViemTx(swapTxObj);

    const swapTxHash = await this.walletClient!.sendTransaction({
      ...viemSwapTx,
      account: this.account!,
      chain: this.walletClient!.chain,
    });
    const swapTxReceipt = await this.publicClient.waitForTransactionReceipt({
      hash: swapTxHash,
    });

    return { allowanceTxHash, swapTxHash };
  }
}

export const mentoService = new MentoService();
