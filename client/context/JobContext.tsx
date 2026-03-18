import { useState, ReactNode, useEffect } from 'react';

import { JobContext, useJob } from './job.context';
import { Job } from './job.types';

export function JobProvider({ children }: { children: ReactNode }) {
    const [currentJob, setCurrentJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('simulateon:currentJob');
            if (stored) {
                setCurrentJob(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('Failed to load job from storage', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const selectJob = (job: Job) => {
        setCurrentJob(job);
        try {
            localStorage.setItem('simulateon:currentJob', JSON.stringify(job));
        } catch (e) {
            console.warn('Failed to save job to storage', e);
        }
    };

    const clearJob = () => {
        setCurrentJob(null);
        try {
            localStorage.removeItem('simulateon:currentJob');
        } catch (e) {
            console.warn('Failed to clear job from storage', e);
        }
    };

    return (
        <JobContext.Provider value={{ currentJob, selectJob, clearJob, isLoading }}>
            {children}
        </JobContext.Provider>
    );
}


