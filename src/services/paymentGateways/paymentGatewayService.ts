import { CustomError } from '../../middlewares/errorHandler';
import { paystackService } from './paystackService';
import { flutterwaveService } from './flutterwaveService';

export type PaymentProvider = 'paystack' | 'flutterwave';

export interface IBank {
  name: string;
  code: string;
}

export interface IInitializeChargeInput {
  amount: number;
  email: string;
  reference: string;
  currency: string;
  callbackUrl?: string;
}

export interface IInitializeChargeResult {
  authorizationUrl: string;
  reference: string;
  raw: unknown;
}

export type IChargeStatus = 'success' | 'failed' | 'pending';

export interface IVerifyChargeResult {
  status: IChargeStatus;
  amount: number;
  currency: string;
  raw: unknown;
}

export interface IResolveAccountResult {
  accountName: string;
}

export interface ICreateTransferRecipientInput {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}

export interface ICreateTransferRecipientResult {
  recipientCode: string;
}

export interface IInitiateTransferInput {
  amount: number;
  currency: string;
  recipientCode: string;
  accountNumber: string;
  bankCode: string;
  reference: string;
  reason: string;
}

export type ITransferStatus = 'success' | 'failed' | 'pending';

export interface IInitiateTransferResult {
  transferReference: string;
  status: ITransferStatus;
  raw: unknown;
}

export interface IPaymentGatewayService {
  initializeCharge(input: IInitializeChargeInput): Promise<IInitializeChargeResult>;
  verifyCharge(reference: string): Promise<IVerifyChargeResult>;
  resolveAccountNumber(accountNumber: string, bankCode: string): Promise<IResolveAccountResult>;
  getBanks(): Promise<IBank[]>;
  createTransferRecipient(
    input: ICreateTransferRecipientInput,
  ): Promise<ICreateTransferRecipientResult>;
  initiateTransfer(input: IInitiateTransferInput): Promise<IInitiateTransferResult>;
  verifyTransfer(transferReference: string): Promise<{ status: ITransferStatus; raw: unknown }>;
  verifyWebhookSignature(rawBody: Buffer | undefined, headers: Record<string, unknown>): boolean;
}

export function getPaymentGateway(provider: PaymentProvider): IPaymentGatewayService {
  switch (provider) {
    case 'paystack':
      return paystackService;
    case 'flutterwave':
      return flutterwaveService;
    default:
      throw new CustomError(`Unsupported payment provider: ${provider}`, 400, 'fail');
  }
}
