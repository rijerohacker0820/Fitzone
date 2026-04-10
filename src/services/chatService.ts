import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

const IS_LOCAL = false; // Set to false to use production backend
const HUB_URL = IS_LOCAL ? 'http://SU_DIRECCION_IP:5062/chathub' : 'http://Fitzone-Development.somee.com/chathub';

export interface ChatMessagePayload {
    text: string;
    type?: 'text' | 'routine' | 'exercise';
    routineId?: string;
    routineName?: string;
    exerciseName?: string;
    sets?: number;
    reps?: number;
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
        const token = await AsyncStorage.getItem('user_token');

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
