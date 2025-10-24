import { Request, Response, NextFunction } from 'express';
import { LogisticsService } from '../services/logisticsService';
import { CustomError } from '../middlewares/errorHandler';

export class LogisticsController {
  static async createLogistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const logisticsProvider = await LogisticsService.createLogistics(
        req.body,
      );
      res.status(201).json({
        status: 'success',
        data: {
          logisticsProvider,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllLogistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const logisticsProviders = await LogisticsService.getAllLogistics(req.query);
      res.status(200).json({
        status: 'success',
        results: logisticsProviders.length,
        data: {
          logisticsProviders,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLogisticsById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const logisticsProvider = await LogisticsService.getLogisticsById(
        req.params.id,
      );

      if (!logisticsProvider) {
        return next(
          new CustomError(
            'No logistics provider found with that ID',
            404,
            'fail',
          ),
        );
      }

      res.status(200).json({
        status: 'success',
        data: {
          logisticsProvider,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLogistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const logisticsProvider = await LogisticsService.updateLogistics(
        req.params.id,
        req.body,
      );

      if (!logisticsProvider) {
        return next(
          new CustomError(
            'No logistics provider found with that ID',
            404,
            'fail',
          ),
        );
      }

      res.status(200).json({
        status: 'success',
        data: {
          logisticsProvider,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLogistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const logisticsProvider = await LogisticsService.deleteLogistics(
        req.params.id,
      );

      if (!logisticsProvider) {
        return next(
          new CustomError(
            'No logistics provider found with that ID',
            404,
            'fail',
          ),
        );
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
