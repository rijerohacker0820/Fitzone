import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 20, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#DC2626', marginBottom: 10 }}>Something went wrong.</Text>
                    <ScrollView style={{ flex: 1, marginTop: 20 }}>
                        <Text style={{ color: '#991B1B', fontWeight: 'bold', marginBottom: 5 }}>Error:</Text>
                        <Text style={{ color: '#991B1B', fontFamily: 'monospace', marginBottom: 20 }}>{this.state.error?.toString()}</Text>
                        <Text style={{ color: '#991B1B', fontWeight: 'bold', marginBottom: 5 }}>Component Stack:</Text>
                        <Text style={{ color: '#991B1B', fontFamily: 'monospace', fontSize: 12 }}>{this.state.errorInfo?.componentStack}</Text>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}
