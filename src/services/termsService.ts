import { Terms, TermsType } from '../models/termsModel';
import { CustomError } from '../middlewares/errorHandler';

export interface CreateTermsInput {
  type: TermsType;
  title: string;
  content: string;
  version?: string;
  isActive?: boolean;
}

export interface UpdateTermsInput {
  type?: TermsType;
  title?: string;
  content?: string;
  version?: string;
  isActive?: boolean;
}

export class TermsService {
  private static async deactivateType(type: TermsType, excludeId?: string) {
    await Terms.updateMany(
      {
        type,
        isActive: true,
        ...(excludeId && { _id: { $ne: excludeId } }),
      },
      { isActive: false },
    );
  }

  static async createTerms(input: CreateTermsInput) {
    if (input.isActive) {
      await this.deactivateType(input.type);
    }

    const terms = new Terms({
      type: input.type,
      title: input.title,
      content: input.content,
      version: input.version ?? '1.0.0',
      isActive: input.isActive ?? false,
    });

    return terms.save();
  }

  static async getTermsList(
    page = 1,
    limit = 10,
    isActive?: boolean,
    type?: TermsType,
  ) {
    const skip = (page - 1) * limit;
    const filter = {
      ...(isActive === undefined ? {} : { isActive }),
      ...(type && { type }),
    };

    const [terms, total] = await Promise.all([
      Terms.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Terms.countDocuments(filter),
    ]);

    return { terms, total, page, limit };
  }

  static async getActiveTerms(type: TermsType) {
    const terms = await Terms.findOne({ type, isActive: true }).sort({ updatedAt: -1 });
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

    const nextType = updates.type ?? terms.type;
    if (updates.isActive === true || (updates.type && terms.isActive)) {
      await this.deactivateType(nextType, id);
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
