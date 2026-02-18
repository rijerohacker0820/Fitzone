import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserGroups, Group } from '../services/groupService';

// Re-export or redefine types if needed. 
// For now, let's map Group Service types to Squad types or align them.
// Service Group: id, name, description, streak, memberCount...
// Squad: id, name, members, membersList, loggedToday, streak, activity, image, color, icon.

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
    activity: string;
    image: any;
    color: string;
    icon?: string;
    description?: string;
}

interface SquadContextType {
    squads: Squad[];
    updateSquad: (id: string, updates: Partial<Squad>) => void;
    getSquad: (id: string) => Squad | undefined;
    refreshSquads: () => Promise<void>;
}

const SquadContext = createContext<SquadContextType | undefined>(undefined);

export const SquadProvider = ({ children }: { children: ReactNode }) => {
    const [squads, setSquads] = useState<Squad[]>([]);

    const refreshSquads = async () => {
        const groups = await getUserGroups();
        // Map backend Group to Frontend Squad
        const mappedSquads: Squad[] = groups.map(g => ({
            id: g.id,
            name: g.name,
            members: g.memberCount,
            membersList: [], // We don't have member list in simple group DTO yet
            loggedToday: 0, // Not in DTO
            streak: g.streak,
            activity: g.activityLevel,
            image: null,
            color: g.color || '#EFF6FF',
            icon: g.icon || '👥',
            description: g.description
        }));
        setSquads(mappedSquads);
    };

    useEffect(() => {
        refreshSquads();
    }, []);

    const updateSquad = (id: string, updates: Partial<Squad>) => {
        setSquads(prev => prev.map(squad =>
            squad.id === id ? { ...squad, ...updates } : squad
        ));
    };

    const getSquad = (id: string) => {
        return squads.find(squad => squad.id === id);
    };

    return (
        <SquadContext.Provider value={{ squads, updateSquad, getSquad, refreshSquads }}>
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
