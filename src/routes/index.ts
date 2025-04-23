import express from 'express';
import authRoute from './authRoute';
import userRoute from './userRoute';
import productRoute from './productRoute';
import orderRoute from './orderRoute';
import reviewRoute from './reviewRoute';
import rewardRoute from './rewardRoute';
import watchlistRoute from './watchlistRoute';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/products', productRoute);
router.use('/orders', orderRoute);
router.use('/reviews', reviewRoute);
router.use('/rewards', rewardRoute);
router.use('/watchlist', watchlistRoute);

export default router;
