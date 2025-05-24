import config from './configs/config';
import app from './configs/app';
import { createServer } from 'http';
import { WebSocketService } from './services/webSocketService';
import { NotificationService } from './services/notificationService';
import { OrderService } from './services/orderService';
import { RewardService } from './services/rewardService';
import { DezenMartContractService } from './services/contractService';

const PORT = config.PORT;

const server = createServer(app);
const webSocketService = new WebSocketService(server);

NotificationService.initialize(webSocketService);
RewardService.initialize(webSocketService);

export const contractService = new DezenMartContractService();

// contractService.listenForEvents().catch((error) => {
//   console.error('Error listening for events:', error);
// });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost: ${PORT}`);
  console.log(`Contact Service connected for address: ${config.CONTRACT_ADDRESS}`);
});
