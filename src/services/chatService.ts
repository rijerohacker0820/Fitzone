import * as signalR from "@microsoft/signalr";
import storage from "../utils/secureStorage";
import apiClient from "../api/apiClient";
import { ENV } from "../config/env";

const HUB_URL = ENV.USE_PRODUCTION
  ? "http://Fitzone-Development.somee.com/chathub"
  : ENV.API_URL.replace("/api", "/chathub");

export interface ChatMessagePayload {
  text: string;
  type?: "text" | "routine" | "exercise" | "image";
  routineId?: string;
  routineName?: string;
  exerciseName?: string;
  exercises?: any[];
  sets?: number;
  reps?: number;
  imageUrl?: string;
}

export interface ChatMessageDto {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  sentAt: string;
  senderName: string;
  senderImage?: string;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private messageCallback: ((msg: ChatMessageDto) => void) | null = null;
  private statusCallback: ((status: ConnectionStatus) => void) | null = null;
  private _status: ConnectionStatus = "disconnected";
  private retryCount: number = 0;
  private maxRetries: number = 5;

  public get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status;
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusCallback = callback;
  }

  public async connect(
    groupId: string,
    onMessage: (msg: ChatMessageDto) => void,
  ) {
    if (this.connection) {
      await this.disconnect();
    }

    this.messageCallback = onMessage;
    this.retryCount = 0;
    const token = await storage.getItem("auth_token");

    this.setStatus("connecting");

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => token || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Handle incoming messages
    this.connection.on("ReceiveMessage", (data: ChatMessageDto) => {
      if (this.messageCallback) {
        this.messageCallback(data);
      }
    });

    // Handle connection state changes
    this.connection.onreconnecting(() => {
      console.log("[ChatHub] Reconnecting...");
      this.setStatus("reconnecting");
    });

    this.connection.onreconnected(() => {
      console.log("[ChatHub] Reconnected successfully");
      this.setStatus("connected");
      // Rejoin group after reconnection
      if (this.connection) {
        this.connection.invoke("JoinGroup", groupId).catch((err) => {
          console.error("[ChatHub] Failed to rejoin group after reconnect:", err);
        });
      }
    });

    this.connection.onclose((error) => {
      console.log("[ChatHub] Connection closed", error?.message);
      this.setStatus("disconnected");
    });

    try {
      await this.connection.start();
      console.log("[ChatHub] Connected successfully!");
      this.setStatus("connected");

      await this.connection.invoke("JoinGroup", groupId);
      console.log("[ChatHub] Joined group:", groupId);
    } catch (error) {
      console.error("[ChatHub] Connection Error:", error);
      this.setStatus("disconnected");

      // Auto-retry with backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
        console.log(`[ChatHub] Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => {
          if (this.messageCallback) {
            this.connect(groupId, this.messageCallback);
          }
        }, delay);
      } else {
        throw error;
      }
    }
  }

  public async sendMessage(groupId: string, payload: ChatMessagePayload) {
    if (!this.connection || this._status !== "connected") {
      console.error("[ChatHub] No active connection to ChatHub");
      throw new Error("No hay conexión al chat. Intenta de nuevo.");
    }

    try {
      // We stringify the payload to send rich data via the single 'content' string parameter
      const contentString = JSON.stringify(payload);
      await this.connection.invoke("SendMessage", groupId, contentString);
      console.log("[ChatHub] Message sent successfully.");
    } catch (error) {
      console.error("[ChatHub] Error sending message:", error);
      throw error;
    }
  }

  public async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.connection = null;
      this.messageCallback = null;
      this.setStatus("disconnected");
      console.log("[ChatHub] Disconnected");
    }
  }

  public async getMessageHistory(groupId: string): Promise<ChatMessageDto[]> {
    try {
      const response = await apiClient.get<ChatMessageDto[]>(
        `/groups/${groupId}/messages`,
      );
      return response.data;
    } catch (error) {
      console.error("[ChatHub] Failed to get message history", error);
      return [];
    }
  }
}

export const chatService = new ChatService();
