export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'NOTIFICATION';
  data: {
    _id: string;
    type: string;
    message: string;
    metadata?: any;
    createdAt: Date;
  };
}

export interface OrderUpdateMessage extends WebSocketMessage {
  type: 'ORDER_UPDATE';
  data: {
    orderId: string;
    status: string;
  };
}

export interface ChatMessage extends WebSocketMessage {
  type: 'CHAT_MESSAGE';
  data: {
    sender: string;
    content: string;
    timestamp: Date;
  };
}
