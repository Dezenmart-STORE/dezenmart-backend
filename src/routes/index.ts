import express from 'express';
import userRoute from './userRoute';
import productRoute from './productRoute';
import orderRoute from './orderRoute';

const router = express.Router();

router.use('/users', userRoute);
router.use('/products', productRoute);
router.use('/orders', orderRoute);

export default router;
