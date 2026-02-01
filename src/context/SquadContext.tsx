import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SquadMember {
    id: string;
    name: string;
    profileImage: string | null;
    hasCompletedStreak: boolean;
}

export interface Squad {
    id: string;
    name: string;
    members: number;
    membersList: SquadMember[];
    loggedToday: number;
    streak: number;
    activity: string; // 'High' | 'Medium' | 'Low'
    image: any; // Using require for local or uri for remote
    color: string;
    icon?: string;
}

interface SquadContextType {
    squads: Squad[];
    updateSquad: (id: string, updates: Partial<Squad>) => void;
    getSquad: (id: string) => Squad | undefined;
}

const SquadContext = createContext<SquadContextType | undefined>(undefined);

const initialMockSquads: Squad[] = [
    {
        id: '1',
        name: 'Iron Squad',
        members: 3,
        membersList: [
            { id: 'm1', name: 'John', profileImage: 'https://i.pravatar.cc/150?u=1', hasCompletedStreak: true },
            { id: 'm2', name: 'Sarah', profileImage: 'https://i.pravatar.cc/150?u=2', hasCompletedStreak: true },
            { id: 'm3', name: 'Mike', profileImage: 'https://i.pravatar.cc/150?u=3', hasCompletedStreak: true }
        ],
        loggedToday: 3,
        streak: 5,
        activity: 'High',
        image: null,
        color: '#EFF6FF',
        icon: '👥'
    },
    {
        id: '2',
        name: 'Cardio Kings',
        members: 8,
        membersList: [
            { id: 'm4', name: 'Alice', profileImage: 'https://i.pravatar.cc/150?u=4', hasCompletedStreak: true },
            { id: 'm5', name: 'Bob', profileImage: 'https://i.pravatar.cc/150?u=5', hasCompletedStreak: false },
            { id: 'm6', name: 'Charlie', profileImage: null, hasCompletedStreak: false }
        ],
        loggedToday: 2,
        streak: 12,
        activity: 'Medium',
        image: null,
        color: '#FEF3C7',
        icon: '🏃'
    },
    {
        id: '3',
        name: 'Weekend Warriors',
        members: 15,
        membersList: [
            { id: 'm7', name: 'Dave', profileImage: null, hasCompletedStreak: false }
        ],
        loggedToday: 0,
        streak: 0,
        activity: 'Low',
        image: null,
        color: '#F1F5F9',
        icon: '🛌'
    }
];

export const SquadProvider = ({ children }: { children: ReactNode }) => {
    const [squads, setSquads] = useState<Squad[]>(initialMockSquads);

    const updateSquad = (id: string, updates: Partial<Squad>) => {
        setSquads(prev => prev.map(squad =>
            squad.id === id ? { ...squad, ...updates } : squad
        ));
    };

    const getSquad = (id: string) => {
        return squads.find(squad => squad.id === id);
    };

    return (
        <SquadContext.Provider value={{ squads, updateSquad, getSquad }}>
            {children}
        </SquadContext.Provider>
    );
};

export const useSquads = () => {
    const context = useContext(SquadContext);
    if (context === undefined) {
        throw new Error('useSquads must be used within a SquadProvider');
    }
    return context;
};
