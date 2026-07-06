import { Terms } from '../models/termsModel';
import { CustomError } from '../middlewares/errorHandler';

export interface CreateTermsInput {
  title: string;
  content: string;
  version?: string;
  isActive?: boolean;
}

export interface UpdateTermsInput {
  title?: string;
  content?: string;
  version?: string;
  isActive?: boolean;
}

export class TermsService {
  private static async deactivateAll() {
    await Terms.updateMany({ isActive: true }, { isActive: false });
  }

  static async createTerms(input: CreateTermsInput) {
    if (input.isActive) {
      await this.deactivateAll();
    }

    const terms = new Terms({
      title: input.title,
      content: input.content,
      version: input.version ?? '1.0.0',
      isActive: input.isActive ?? false,
    });

    return terms.save();
  }

  static async getTermsList(page = 1, limit = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const filter = isActive === undefined ? {} : { isActive };

    const [terms, total] = await Promise.all([
      Terms.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Terms.countDocuments(filter),
    ]);

    return { terms, total, page, limit };
  }

  static async getActiveTerms() {
    const terms = await Terms.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!terms) {
      throw new CustomError('No active terms and conditions found', 404, 'fail');
    }
    return terms;
  }

  static async getTermsById(id: string) {
    const terms = await Terms.findById(id);
    if (!terms) {
      throw new CustomError('Terms and conditions not found', 404, 'fail');
    }
    return terms;
  }

  static async updateTerms(id: string, updates: UpdateTermsInput) {
    const terms = await Terms.findById(id);
    if (!terms) {
      throw new CustomError('Terms and conditions not found', 404, 'fail');
    }

    if (updates.isActive === true) {
      await this.deactivateAll();
    }

    Object.assign(terms, updates);
    return terms.save();
  }

  static async deleteTerms(id: string) {
    const terms = await Terms.findById(id);
    if (!terms) {
      throw new CustomError('Terms and conditions not found', 404, 'fail');
    }

    await terms.deleteOne();
    return { success: true };
  }
}
