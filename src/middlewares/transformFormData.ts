import express from 'express';

// Middleware to transform form-data fields from strings to their correct types
const transformProductFormData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const body = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  // Convert numeric strings to numbers
  if (body.price) body.price = parseFloat(body.price);
  if (body.stock) body.stock = parseInt(body.stock, 10);

  // Convert boolean strings to booleans
  if (typeof body.useUSDT === 'string') body.useUSDT = body.useUSDT.toLowerCase() === 'true';
  if (typeof body.isSponsored === 'string') body.isSponsored = body.isSponsored.toLowerCase() === 'true';
  if (typeof body.isActive === 'string') body.isActive = body.isActive.toLowerCase() === 'true';

  try {
    // Parse JSON string fields into arrays/objects
    if (body.type && typeof body.type === 'string') body.type = JSON.parse(body.type);

    if (!Array.isArray(body.logisticsProviders) && body.logisticsProviders) {
      body.logisticsProviders = Array.isArray(body.logisticsProviders)
        ? body.logisticsProviders
        : [body.logisticsProviders];
    }

    if (!Array.isArray(body.logisticsCost) && body.logisticsCost) {
      body.logisticsCost = Array.isArray(body.logisticsCost)
        ? body.logisticsCost
        : [body.logisticsCost];
    }
  } catch (e: any) {
    const error = new Error(`Invalid JSON string for a form field (type, logisticsProviders, or logisticsCost): ${e.message}`);
    (error as any).status = 400;
    return next(error);
  }

  // Handle images from req.files (example placeholder)
  if (files && files.length > 0) {
    body.images = files.map(file => `uploads/images/${file.filename}`); // Replace with your actual path/URL generation
  } else if (!body.images) {
    body.images = []; // Ensure images is an array if not provided
  }
  next();
};

export default transformProductFormData;