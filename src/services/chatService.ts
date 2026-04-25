import * as signalR from '@microsoft/signalr';
import storage from '../utils/secureStorage';
import apiClient from '../api/apiClient';
import { ENV } from '../config/env';

const HUB_URL = ENV.USE_PRODUCTION
    ? 'http://Fitzone-Development.somee.com/chathub'
    : ENV.API_URL.replace('/api', '/chathub');

export interface ChatMessagePayload {
    text: string;
    type?: 'text' | 'routine' | 'exercise' | 'image';
    routineId?: string;
    routineName?: string;
    exerciseName?: string;
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

class ChatService {
    private connection: signalR.HubConnection | null = null;
    private messageCallback: ((msg: ChatMessageDto) => void) | null = null;

    public async connect(groupId: string, onMessage: (msg: ChatMessageDto) => void) {
        if (this.connection) {
            await this.disconnect();
        }

        this.messageCallback = onMessage;
        const token = await storage.getItem('auth_token');

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token || ''
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.on('ReceiveMessage', (data: ChatMessageDto) => {
            if (this.messageCallback) {
                this.messageCallback(data);
            }
        });

        try {
            await this.connection.start();
            console.log('Connected to ChatHub successfully!');
            await this.connection.invoke('JoinGroup', groupId);
            console.log('Joined group:', groupId);
        } catch (error) {
            console.error('SignalR Connection Error: ', error);
            throw error;
        }
    }

    public async sendMessage(groupId: string, payload: ChatMessagePayload) {
        if (!this.connection) {
            console.error('No connection to ChatHub');
            return;
        }

        try {
            // We stringify the payload to send rich data via the single 'content' string parameter
            const contentString = JSON.stringify(payload);
            await this.connection.invoke('SendMessage', groupId, contentString);
            console.log('Message sent securely via SignalR.');
        } catch (error) {
            console.error('Error sending message: ', error);
            throw error;
        }
    }

    public async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.messageCallback = null;
            console.log('Disconnected from ChatHub');
        }
    }

    public async getMessageHistory(groupId: string): Promise<ChatMessageDto[]> {
        try {
            const response = await apiClient.get<ChatMessageDto[]>(`/groups/${groupId}/messages`);
            return response.data;
        } catch (error) {
            console.error('Failed to get message history', error);
            return [];
        }
    }
}

export const chatService = new ChatService();
