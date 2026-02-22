import { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose, isVisible }) => {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShouldShow(true);
            const timer = setTimeout(() => {
                setShouldShow(false);
                setTimeout(onClose, 300);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    return (
        <div className={`toast toast-${type} ${shouldShow ? 'show' : ''}`}>
            <div className="toast-icon">
                <i className={`bi ${icons[type]}`} />
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
                <i className="bi bi-x" />
            </button>
        </div>
    );
};

export default Toast;
