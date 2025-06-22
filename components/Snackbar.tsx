import React, { useEffect, useState } from 'react';

interface SnackbarProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Snackbar: React.FC<SnackbarProps> = ({
    message,
    type,
    isVisible,
    onClose,
    duration = 3000
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for fade out animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible && !show) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'warning': return 'bg-yellow-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-times-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'info': return 'fas fa-info-circle';
            default: return 'fas fa-bell';
        }
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                }`}
        >
            <div className={`${getBackgroundColor()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3`}>
                <i className={`${getIcon()} text-lg`}></i>
                <span className="flex-1 text-sm font-medium">{message}</span>
                <button
                    onClick={() => {
                        setShow(false);
                        setTimeout(onClose, 300);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </div>
    );
};

export default Snackbar; 