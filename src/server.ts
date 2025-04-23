import app from './configs/app';
import config from './configs/config';
import { createServer } from 'http';
import { WebSocketService } from './services/webSocketService';
import { NotificationService } from './services/notificationService';

const PORT = config.PORT;

const server = createServer(app);
const webSocketService = new WebSocketService(server);
NotificationService.initialize(webSocketService);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
