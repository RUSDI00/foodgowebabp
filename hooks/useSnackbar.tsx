import { useState, useCallback } from 'react';

export interface SnackbarState {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
}

export const useSnackbar = () => {
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setSnackbar({
            message,
            type,
            isVisible: true,
        });
    }, []);

    const hideSnackbar = useCallback(() => {
        setSnackbar(prev => ({
            ...prev,
            isVisible: false,
        }));
    }, []);

    const showSuccess = useCallback((message: string) => showSnackbar(message, 'success'), [showSnackbar]);
    const showError = useCallback((message: string) => showSnackbar(message, 'error'), [showSnackbar]);
    const showInfo = useCallback((message: string) => showSnackbar(message, 'info'), [showSnackbar]);
    const showWarning = useCallback((message: string) => showSnackbar(message, 'warning'), [showSnackbar]);

    return {
        snackbar,
        showSnackbar,
        hideSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
    };
}; 