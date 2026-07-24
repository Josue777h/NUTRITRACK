import { useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'medium',
    showCloseButton = true,
    closeOnOverlayClick = true,
    className = ''
}) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        const handleOverlayClick = (event) => {
            if (closeOnOverlayClick && 
                modalRef.current && 
                !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleOverlayClick);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleOverlayClick);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, closeOnOverlayClick]);

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
            <div 
                ref={modalRef}
                className={`modal-content modal-${size} ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {title && (
                    <div className="modal-header">
                        <h2 id="modal-title" className="modal-title">{title}</h2>
                        {showCloseButton && (
                            <button 
                                className="modal-close"
                                onClick={onClose}
                                aria-label="Cerrar modal"
                            >
                                <i className="bi bi-x" />
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
