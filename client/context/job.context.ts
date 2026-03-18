import { createContext, useContext } from 'react';

import { Job } from './job.types';

export interface JobContextType {
    currentJob: Job | null;
    selectJob: (job: Job) => void;
    clearJob: () => void;
    isLoading: boolean;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function useJob() {
    const context = useContext(JobContext);
    if (context === undefined) {
        throw new Error('useJob must be used within a JobProvider');
    }
    return context;
}

export { JobContext };