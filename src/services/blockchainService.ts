import { ContractKit, newKit } from '@celo/contractkit';
import { AbiItem } from 'web3-utils';
import { BlockNumber } from 'web3-core';
import dotenv from 'dotenv';
import config from '../configs/config';
import abi from '../abi/dezenmartAbi.json';

dotenv.config();

// Define types for our trade structure to match the contract
export interface Trade {
  buyer: string;
  seller: string;
  logisticsProviders: string[];
  logisticsCosts: string[];
  chosenLogisticsProvider: string;
  productCost: string;
  logisticsCost: string;
  escrowFee: string;
  totalAmount: string;
  totalQuantity: string;
  remainingQuantity: string;
  logisticsSelected: boolean;
  delivered: boolean;
  completed: boolean;
  disputed: boolean;
  isUSDT: boolean;
  parentTradeId: string;
}

export class DezenMartContractService {
  private kit: ContractKit;
  private contractAddress: string;
  private usdtAddress: string;

  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheckedBlock: BlockNumber = 'latest';

  constructor() {
    // Connect to Celo network (Mainnet or Testnet)
    const nodeUrl =
      config.CELO_NODE_URL || 'https://alfajores-forno.celo-testnet.org'; // Testnet for now

    this.kit = newKit(nodeUrl);
    this.contractAddress = config.CONTRACT_ADDRESS || '';
    this.usdtAddress = config.USDT_ADDRESS || '';

    // Set default account if provided
    if (config.PRIVATE_KEY) {
      const account = this.kit.web3.eth.accounts.privateKeyToAccount(
        config.PRIVATE_KEY,
      );
      this.kit.addAccount(account.privateKey);
      this.kit.defaultAccount = account.address as `0x${string}`;
    }
  }

  // Get contract instance
  private async getContract() {
    return new this.kit.web3.eth.Contract(
      abi.DEZENMART_ABI as AbiItem[],
      this.contractAddress,
    );
  }

  // Register logistics provider (admin only)
  async registerLogisticsProvider(providerAddress: string) {
    const contract = await this.getContract();
    const tx =
      await contract.methods.registerLogisticsProvider(providerAddress);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  async getLogisticsProviders(): Promise<string[]> {
    const contract = await this.getContract();
    const providers: string[] = await contract.methods.getLogisticsProviders().call();
    return providers;
  }

  // Register seller
  async registerSeller() {
    const contract = await this.getContract();
    const tx = await contract.methods.registerSeller();

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Create trade (seller)
  async createTrade(
    productCost: string, // in smallest units (wei or USDT units)
    logisticsProviders: string[], // array of provider addresses
    logisticsCosts: string[], // array of logistics costs

    totalQuantity: string,
  ) {
    if (logisticsProviders.length !== logisticsCosts.length) {
      throw new Error('Providers and costs arrays must have the same length');
    }

    const contract = await this.getContract();

    // Ensure all parameters are properly formatted
    const formattedProviders = logisticsProviders.map((provider) => {
      if (!provider.startsWith('0x')) {
        throw new Error(`Invalid provider address: ${provider}`);
      }
      return provider;
    });

    if (!Array.isArray(logisticsCosts)) {
      logisticsCosts = [logisticsCosts];
    }

    const formattedCosts = logisticsCosts.map((cost) => {
      if (!/^\d+$/.test(cost)) {
        throw new Error(`Invalid cost: ${cost}`);
      }
      return cost;
    });

    if (!/^\d+$/.test(totalQuantity) || parseInt(totalQuantity) <= 0) {
      throw new Error('Total quantity must be a positive number');
    }

    const tx = await contract.methods.createTrade(
      productCost,
      formattedProviders,
      formattedCosts,
      totalQuantity,
    );

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Buy trade (buyer)
  async buyTrade(
    tradeId: string,
    quantity: string,
    logisticsProvider: string,
  ) {
    const contract = await this.getContract();

    // Get the trade details to calculate the required payment
    const trade = await this.getTrade(tradeId);

    if (parseInt(trade.remainingQuantity) < parseInt(quantity)) {
      throw new Error('Insufficient quantity available');
    }

    if (!trade.logisticsProviders || !Array.isArray(trade.logisticsProviders)) {
      throw new Error('Logistics providers data is invalid or missing');
    }
    
    if (!trade.logisticsCosts || !Array.isArray(trade.logisticsCosts)) {
      throw new Error('Logistics costs data is invalid or missing');
    }

    // Calculate payment amount
    // if (logisticsProviderIndex < 0 || logisticsProviderIndex >= trade.logisticsProviders.length) {
    //   throw new Error(`Invalid logistics provider index: ${logisticsProviderIndex}. Available indices: 0 to ${trade.logisticsProviders.length - 1}`);
    // }

    // if (trade.logisticsCosts.length !== trade.logisticsProviders.length) {
    //   throw new Error(`Mismatch between logistics providers (${trade.logisticsProviders.length}) and costs (${trade.logisticsCosts.length})`);
    // }

    // const chosenLogisticsCost = trade.logisticsCosts[logisticsProvider];
    // if (!chosenLogisticsCost) {
    //   throw new Error(`Invalid logistics cost ${logisticsProvider}: ${chosenLogisticsCost}`);
    // }
    // const providerIndex = trade.logisticsProviders.indexOf(logisticsProvider);
    // if (providerIndex === -1) {
    //   throw new Error(`Logistics provider address not found: ${logisticsProvider}`);
    // }

    // if (trade.logisticsCosts.length !== trade.logisticsProviders.length) {
    //   throw new Error(`Mismatch between logistics providers (${trade.logisticsProviders.length}) and costs (${trade.logisticsCosts.length})`);
    // }

    // const chosenLogisticsCost = trade.logisticsCosts[providerIndex];
    // if (!chosenLogisticsCost) {
    //   throw new Error(`Invalid logistics cost at index ${providerIndex}: ${chosenLogisticsCost}`);
    // }

    // const totalProductCost = this.kit.web3.utils
    //   .toBN(trade.productCost)
    //   .mul(this.kit.web3.utils.toBN(quantity))
    //   .toString();
    // // const totalLogisticsCost = this.kit.web3.utils
    // //   .toBN(chosenLogisticsCost)
    // //   .mul(this.kit.web3.utils.toBN(quantity))
    // //   .toString();

    // // Calculate escrow fees (2.5%)
    // const productEscrowFee = this.kit.web3.utils
    //   .toBN(totalProductCost)
    //   .mul(this.kit.web3.utils.toBN(250))
    //   .div(this.kit.web3.utils.toBN(10000))
    //   .toString();
    // // const logisticsEscrowFee = this.kit.web3.utils
    // //   .toBN(totalLogisticsCost)
    // //   .mul(this.kit.web3.utils.toBN(250))
    // //   .div(this.kit.web3.utils.toBN(10000))
    // //   .toString();

    // // Calculate total payment amount
    // const totalAmount = this.kit.web3.utils
    //   .toBN(totalProductCost)
    //   // .add(this.kit.web3.utils.toBN(totalLogisticsCost))
    //   .add(this.kit.web3.utils.toBN(productEscrowFee))
    //   // .add(this.kit.web3.utils.toBN(logisticsEscrowFee))
    //   .toString();


      await this.approveUSDT('10000000000000000000');

      const tx = await contract.methods.buyTrade(
        tradeId,
        quantity,
        logisticsProvider,
      );
      const buyTradeReceipt = await this.sendTransaction(tx)
      return buyTradeReceipt;
      // return await this.sendTransaction(tx);
    // }
  }

  // Approve USDT spending
  private async approveUSDT(amount: string) {
    // USDT ABI (just the approve function)
    const usdtAbi = [
      {
        constant: false,
        inputs: [
          { name: '_spender', type: 'address' },
          { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];

    const usdtContract = new this.kit.web3.eth.Contract(
      usdtAbi as AbiItem[],
      config.USDT_ADDRESS,
    );

    const tx = await usdtContract.methods.approve(
      config.CONTRACT_ADDRESS,
      amount,
    );
    const receipt = await this.sendTransaction(tx);

    // Check if approval was successful
    const approvalSuccess = receipt.status;

    return receipt;
  }

  // Confirm delivery (buyer only)
  async confirmDelivery(tradeId: string) {
    const contract = await this.getContract();
    const tx = await contract.methods.confirmDelivery(tradeId);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Cancel trade (buyer only)
  async cancelTrade(tradeId: string) {
    const contract = await this.getContract();
    const tx = await contract.methods.cancelTrade(tradeId);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Raise dispute
  async raiseDispute(tradeId: string) {
    const contract = await this.getContract();
    const tx = await contract.methods.raiseDispute(tradeId);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Resolve dispute (admin only)
  async resolveDispute(tradeId: string, winner: string) {
    const contract = await this.getContract();
    const tx = await contract.methods.resolveDispute(tradeId, winner);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Get trade details
  async getTrade(tradeId: string): Promise<Trade> {
    const contract = await this.getContract();
    try {
      const trade = await contract.methods.trades(tradeId).call();

      // Format the response to match our Trade interface
      return {
        buyer: trade.buyer,
        seller: trade.seller,
        logisticsProviders: Array.isArray(trade.logisticsProviders)
          ? trade.logisticsProviders
          : [],
        logisticsCosts: Array.isArray(trade.logisticsCosts)
          ? trade.logisticsCosts
          : [],
        chosenLogisticsProvider: trade.chosenLogisticsProvider,
        productCost: trade.productCost,
        logisticsCost: trade.logisticsCost,
        escrowFee: trade.escrowFee,
        totalAmount: trade.totalAmount,
        totalQuantity: trade.totalQuantity,
        remainingQuantity: trade.remainingQuantity,
        logisticsSelected: trade.logisticsSelected,
        delivered: trade.delivered,
        completed: trade.completed,
        disputed: trade.disputed,
        isUSDT: trade.isUSDT,
        parentTradeId: trade.parentTradeId,
      };
    } catch (error) {
      console.error('Error fetching trade:', error);
      throw new Error(`Failed to get trade with ID ${tradeId}`);
    }
  }

  // Get all trades for the current buyer
  async getTradesByBuyer(): Promise<Trade[]> {
    const contract = await this.getContract();
    try {
      const trades = await contract.methods.getTradesByBuyer().call({
        from: this.kit.defaultAccount,
      });
      return trades;
    } catch (error) {
      console.error('Error fetching buyer trades:', error);
      throw new Error('Failed to get buyer trades');
    }
  }

  // Get all trades for the current seller
  async getTradesBySeller(): Promise<Trade[]> {
    const contract = await this.getContract();
    try {
      const trades = await contract.methods.getTradesBySeller().call({
        from: this.kit.defaultAccount,
      });
      return trades;
    } catch (error) {
      console.error('Error fetching seller trades:', error);
      throw new Error('Failed to get seller trades');
    }
  }

  // Admin withdraw ETH fees
  async withdrawEscrowFeesETH() {
    const contract = await this.getContract();
    const tx = await contract.methods.withdrawEscrowFeesETH();

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Admin withdraw USDT fees
  async withdrawEscrowFeesUSDT() {
    const contract = await this.getContract();
    const tx = await contract.methods.withdrawEscrowFeesUSDT();

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Helper function to send transactions
  private async sendTransaction(tx: any, value = '0') {
    try {
      const accounts = await this.kit.web3.eth.getAccounts();
      const from = this.kit.defaultAccount || accounts[0];
      if (!from) {
        throw new Error(
          'No default account found. Please set a default account.',
        );
      }

      // Log transaction details for debugging
      if (tx._method) {
        console.log('Transaction method:', tx._method.name);
        console.log('Transaction parameters:', tx._method.inputs);
      }

      // Estimate gas with a buffer to avoid out-of-gas errors
      let gasEstimate;
      try {
        gasEstimate = await tx.estimateGas({ from, value });
      } catch (error) {
        console.error('Gas estimation error:', error);
      }

      // Send the transaction with a gas buffer
      const receipt = await tx.send({
        from,
        gas: Math.round(gasEstimate * 1.2), // Add 20% buffer
        value,
      });

      return receipt;
    } catch (error) {
      console.error('Transaction error:', error);
    }
  }

  // --- Event listening ---

  // Stop polling
  public stopListening() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Listen for events
  async listenForEvents(
    eventCallbacks: {
      onTradeCreated?: (event: any) => void;
      // onTradePurchased?: (event: any) => void;
      onDeliveryConfirmed?: (event: any) => void;
      onDisputeRaised?: (event: any) => void;
    } = {},
  ) {
    // Stop any existing polling first
    this.stopListening();

    const contract = await this.getContract();
    const pollingFrequencyMs = 30000; // 30 seconds

    const poll = async () => {
      try {
        // Determine the block range to query
        const fromBlock =
          typeof this.lastCheckedBlock === 'number'
            ? this.lastCheckedBlock + 1
            : 'latest';
        const currentBlock = await this.kit.web3.eth.getBlockNumber();

        // Avoid querying if fromBlock would be greater than currentBlock
        if (typeof fromBlock === 'number' && fromBlock > currentBlock) {
          return;
        }

        // If fromBlock was 'latest', we only query the currentBlock now
        const effectiveFromBlock =
          fromBlock === 'latest' ? currentBlock : fromBlock;

        // --- Poll for specific events ---

        // TradeCreated events
        const tradeCreatedEvents = await contract.getPastEvents(
          'TradeCreated',
          {
            fromBlock: effectiveFromBlock,
            toBlock: currentBlock,
          },
        );

        for (const event of tradeCreatedEvents) {
          if (eventCallbacks.onTradeCreated) {
            eventCallbacks.onTradeCreated(event);
          }
        }

        // TradePurchased events
        // const tradePurchasedEvents = await contract.getPastEvents(
        //   'TradePurchased',
        //   {
        //     fromBlock: effectiveFromBlock,
        //     toBlock: currentBlock,
        //   },
        // );

        // for (const event of tradePurchasedEvents) {
        //   console.log('[Poll] TradePurchased:', event.returnValues);
        //   if (eventCallbacks.onTradePurchased) {
        //     eventCallbacks.onTradePurchased(event);
        //   }
        // }

        // DeliveryConfirmed events
        const deliveryConfirmedEvents = await contract.getPastEvents(
          'DeliveryConfirmed',
          {
            fromBlock: effectiveFromBlock,
            toBlock: currentBlock,
          },
        );

        for (const event of deliveryConfirmedEvents) {
          if (eventCallbacks.onDeliveryConfirmed) {
            eventCallbacks.onDeliveryConfirmed(event);
          }
        }

        // DisputeRaised events
        const disputeRaisedEvents = await contract.getPastEvents(
          'DisputeRaised',
          {
            fromBlock: effectiveFromBlock,
            toBlock: currentBlock,
          },
        );

        for (const event of disputeRaisedEvents) {
          if (eventCallbacks.onDisputeRaised) {
            eventCallbacks.onDisputeRaised(event);
          }
        }

        this.lastCheckedBlock = currentBlock;
      } catch (error) {
        console.error('Error during event polling:', error);
      }
    };

    // Start polling
    await poll(); // Run immediately once
    this.pollingInterval = setInterval(poll, pollingFrequencyMs);
    console.log(`Started event polling every ${pollingFrequencyMs}ms`);
  }
}
