import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private docs: Map<string, Y.Doc> = new Map();

  handleConnection(client: Socket) {
    console.log(`🟢 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room }: { room: string },
  ) {
    client.join(room);
    console.log(`📥 ${client.id} joined room: ${room}`);

    // Create Y.Doc if it doesn't exist yet
    if (!this.docs.has(room)) {
      this.docs.set(room, new Y.Doc());
    }

    const doc = this.docs.get(room);
    if (!doc) return;
    const fullState = Y.encodeStateAsUpdate(doc);

    // Send current state to the newly joined client
    client.emit('doc-update', {
      room,
      update: Array.from(fullState), // Convert Uint8Array to Array<number> for transmission
    });
  }

  @SubscribeMessage('doc-update')
  onDocUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room, update }: { room: string; update: number[] },
  ) {
    const doc = this.docs.get(room);
    if (!doc) return;

    try {
      const updateBuffer = new Uint8Array(update);
      Y.applyUpdate(doc, updateBuffer);

      // Broadcast to all *other* clients in the room
      client.to(room).emit('doc-update', {
        room,
        update: Array.from(updateBuffer),
      });

      console.log(`✅ Update applied to room: ${room}`);
    } catch (error) {
      console.error('❌ Error applying Yjs update:', error);
    }
  }
}
