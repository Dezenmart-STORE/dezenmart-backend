import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Reward } from '../models/rewardModel';

interface CustomWebSocket extends WebSocket {
  userId?: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, CustomWebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: CustomWebSocket, req) => {
      const token = req.url?.split('token=')[1];

      if (!token) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
        };
        ws.userId = decoded.id;
        this.clients.set(decoded.id, ws);

        ws.on('close', () => {
          if (ws.userId) {
            this.clients.delete(ws.userId);
          }
        });

        ws.on('message', (message) => {
          this.handleMessage(ws, message.toString());
        });
      } catch (error) {
        ws.close(1008, 'Invalid token');
      }
    });
  }

  private handleMessage(ws: CustomWebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      // Handle different message types
      switch (data.type) {
        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
        // Add other message types as needed
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  public sendToUser(userId: string, message: any) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: any) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private async handleRewardNotification(userId: string, reward: any) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'REWARD_EARNED',
          data: {
            points: reward.points,
            action: reward.actionType,
            totalPoints: reward.user.totalPoints,
          },
        }),
      );
    }
  }

  public async notifyReward(rewardId: string) {
    const reward = await Reward.findById(rewardId).populate(
      'user',
      'totalPoints',
    );
    if (reward) {
      this.handleRewardNotification(reward.userId.toString(), reward);
    }
  }

  private async handleReferralNotification(userId: string, reward: any) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'REFERRAL_REWARD',
          data: {
            points: reward.points,
            action: reward.actionType,
            referredUser: reward.metadata?.referredUser,
          },
        }),
      );
    }
  }
}
