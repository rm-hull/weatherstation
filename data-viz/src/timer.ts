import { useEffect } from 'react';

export function useRecurringTimer(fn: (...args: any[]) => void, timeout: number) {
    useEffect(() => {
        const timerId = setInterval(fn, timeout);
        return function cleanup() {
            clearInterval(timerId);
        };
    }, [fn, timeout]);
}