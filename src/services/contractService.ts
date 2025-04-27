// src/services/contractService.ts
import { ContractKit, newKit } from '@celo/contractkit';
import { AbiItem } from 'web3-utils';
import dotenv from 'dotenv';
import abi from '../abi/dezenmartAbi.json';
import config from '../configs/config';
import { BlockNumber } from 'web3-core';

dotenv.config();

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
    // const nodeUrl = 'https://forno.celo.org'; // Mainnet

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

  // Register seller
  async registerSeller() {
    const contract = await this.getContract();
    const tx = await contract.methods.registerSeller();

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Create trade with ETH
  async createTradeWithETH(
    seller: string,
    productCost: string, // in wei
    logisticsProvider: string,
    logisticsCost: string, // in wei
  ) {
    const contract = await this.getContract();

    // Calculate total amount based on contract logic
    const useUSDT = false;
    const baseCost = this.kit.web3.utils
      .toBN(productCost)
      .add(this.kit.web3.utils.toBN(logisticsCost));
    const feeMultiplier = this.kit.web3.utils.toBN(250); // 2.5%
    const basisPoints = this.kit.web3.utils.toBN(10000);
    const escrowFee = baseCost.mul(feeMultiplier).div(basisPoints);
    const totalAmount = baseCost.add(escrowFee).toString();

    const tx = await contract.methods.createTrade(
      seller,
      productCost,
      logisticsProvider,
      logisticsCost,
      useUSDT,
    );

    const receipt = await this.sendTransaction(tx, totalAmount);
    return receipt;
  }

  // Create trade with USDT
  async createTradeWithUSDT(
    seller: string,
    productCost: string, // in smallest USDT units
    logisticsProvider: string,
    logisticsCost: string, // in smallest USDT units
  ) {
    const contract = await this.getContract();
    const useUSDT = true;

    // First, approve the contract to spend USDT
    const baseCost = this.kit.web3.utils
      .toBN(productCost)
      .add(this.kit.web3.utils.toBN(logisticsCost));
    const feeMultiplier = this.kit.web3.utils.toBN(250); // 2.5%
    const basisPoints = this.kit.web3.utils.toBN(10000);
    const escrowFee = baseCost.mul(feeMultiplier).div(basisPoints);
    const totalAmount = baseCost.add(escrowFee).toString();

    // Approve USDT spending
    await this.approveUSDT(totalAmount);

    // Create trade
    const tx = await contract.methods.createTrade(
      seller,
      productCost,
      logisticsProvider,
      logisticsCost,
      useUSDT,
    );

    const receipt = await this.sendTransaction(tx);
    return receipt;
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
      this.usdtAddress,
    );

    const tx = await usdtContract.methods.approve(this.contractAddress, amount);
    await this.sendTransaction(tx);
  }

  // Confirm delivery (buyer only)
  async confirmDelivery(tradeId: number) {
    const contract = await this.getContract();
    const tx = await contract.methods.confirmDelivery(tradeId);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Cancel trade (buyer only)
  async cancelTrade(tradeId: number) {
    const contract = await this.getContract();
    const tx = await contract.methods.cancelTrade(tradeId);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Raise dispute
  async raiseDispute(tradeId: number) {
    const contract = await this.getContract();
    const tx = await contract.methods.raiseDispute(tradeId);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Resolve dispute (admin only)
  async resolveDispute(tradeId: number, winner: string) {
    const contract = await this.getContract();
    const tx = await contract.methods.resolveDispute(tradeId, winner);

    const receipt = await this.sendTransaction(tx);
    return receipt;
  }

  // Get trade details
  async getTrade(tradeId: number) {
    const contract = await this.getContract();
    const trade = await contract.methods.trades(tradeId).call();

    return {
      buyer: trade.buyer,
      seller: trade.seller,
      logisticsProvider: trade.logisticsProvider,
      productCost: trade.productCost,
      logisticsCost: trade.logisticsCost,
      escrowFee: trade.escrowFee,
      totalAmount: trade.totalAmount,
      logisticsSelected: trade.logisticsSelected,
      delivered: trade.delivered,
      completed: trade.completed,
      disputed: trade.disputed,
      isUSDT: trade.isUSDT,
    };
  }

  // Helper function to send transactions
  private async sendTransaction(tx: any, value = '0') {
    try {
      const accounts = await this.kit.web3.eth.getAccounts();
      const from = this.kit.defaultAccount || accounts[0];

      const gasEstimate = await tx.estimateGas({ from, value });

      const receipt = await tx.send({
        from,
        gas: Math.round(gasEstimate * 1.2), // Add 20% buffer
        value,
      });

      return receipt;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  // --- Stop polling ---
  public stopListening() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped event polling.');
    }
  }

  // Listen for events
  async listenForEvents() {
    // Stop any existing polling first
    this.stopListening();

    const contract = await this.getContract();
    const pollingFrequencyMs = 30000;

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
          console.log(
            `Polling: No new blocks since ${this.lastCheckedBlock}. Current: ${currentBlock}`,
          );
          return;
        }

        // If fromBlock was 'latest', we only query the currentBlock now
        const effectiveFromBlock =
          fromBlock === 'latest' ? currentBlock : fromBlock;

        // --- Poll for specific events ---

        const tradeCreatedEvents = await contract.getPastEvents(
          'TradeCreated',
          {
            fromBlock: effectiveFromBlock,
            toBlock: currentBlock,
          },
        );

        for (const event of tradeCreatedEvents) {
          console.log('[Poll] TradeCreated:', event.returnValues);
        }

        const deliveryConfirmedEvents = await contract.getPastEvents(
          'DeliveryConfirmed',
          {
            fromBlock: effectiveFromBlock,
            toBlock: currentBlock,
          },
        );

        for (const event of deliveryConfirmedEvents) {
          console.log('[Poll] DeliveryConfirmed:', event.returnValues);
        }

        this.lastCheckedBlock = currentBlock;
      } catch (error) {
        console.error('Error during event polling:', error);
      }
    };

    // Listen for TradeCreated events
    // contract.events
    //   .TradeCreated()
    //   .on('data', (event: any) => {
    //     console.log('New trade created:', event.returnValues);
    //   })
    //   .on('error', console.error);

    // Listen for DeliveryConfirmed events
    // contract.events
    //   .DeliveryConfirmed()
    //   .on('data', (event: any) => {
    //     console.log(
    //       'Delivery confirmed for trade:',
    //       event.returnValues.tradeId,
    //     );
    //   })
    //   .on('error', console.error);

    //TODO: Add more event listeners as needed
  }
}
