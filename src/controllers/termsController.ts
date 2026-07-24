import { NextFunction, Request, Response } from 'express';
import { TermsService } from '../services/termsService';
import { TermsType } from '../models/termsModel';

function extractId(req: Request, param = 'id'): string {
  const value = req.params[param];
  return Array.isArray(value) ? value[0] : value;
}

export class TermsController {
  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const terms = await TermsService.createTerms(req.body);
      res.status(201).json({ status: 'success', data: { terms } });
    } catch (error) {
      next(error);
    }
  };

  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const isActive =
        req.query.isActive === undefined
          ? undefined
          : req.query.isActive === 'true';
      const type = req.query.type as TermsType | undefined;

      const result = await TermsService.getTermsList(page, limit, isActive, type);
      res.status(200).json({
        status: 'success',
        results: result.terms.length,
        total: result.total,
        data: { terms: result.terms },
      });
    } catch (error) {
      next(error);
    }
  };

  static getCurrent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const terms = await TermsService.getActiveTerms(req.query.type as TermsType);
      res.status(200).json({ status: 'success', data: { terms } });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = extractId(req);
      const terms = await TermsService.getTermsById(id);
      res.status(200).json({ status: 'success', data: { terms } });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = extractId(req);
      const terms = await TermsService.updateTerms(id, req.body);
      res.status(200).json({ status: 'success', data: { terms } });
    } catch (error) {
      next(error);
    }
  };

  static delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = extractId(req);
      await TermsService.deleteTerms(id);
      res.status(200).json({
        status: 'success',
        message: 'Terms and conditions deleted',
      });
    } catch (error) {
      next(error);
    }
  };
}
