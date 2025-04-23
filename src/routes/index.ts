import express from 'express';
import authRoute from './authRoute';
import userRoute from './userRoute';
import productRoute from './productRoute';
import orderRoute from './orderRoute';
import reviewRoute from './reviewRoute';
import rewardRoute from './rewardRoute';
import referralRoute from './referralRoute';
import watchlistRoute from './watchlistRoute';
import notificationRoute from './notificationRoute';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/products', productRoute);
router.use('/orders', orderRoute);
router.use('/reviews', reviewRoute);
router.use('/rewards', rewardRoute);
router.use('/referral', referralRoute);
router.use('/watchlist', watchlistRoute);
router.use('/notifications', notificationRoute);

export default router;
