import { WorkoutRoutine } from '../types';

export type RootStackParamList = {
    MainTabs: undefined;
    ActiveWorkout: { routine: WorkoutRoutine };
    Schedule: undefined;
    WorkoutSummary: { log: WorkoutRoutine };
    SquadDetail: { squadId: string };
    SquadSettings: { squadId: string };
    Settings: undefined;
    Login: undefined;
};
