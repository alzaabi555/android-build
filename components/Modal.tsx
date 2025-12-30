import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  const { isLowPower } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Determine modal styling based on Performance Mode
  const overlayStyle = isLowPower 
    ? "bg-black/80" // Solid dark overlay
    : "bg-black/40 dark:bg-black/60 backdrop-blur-md"; // Glass overlay

  const contentStyle = isLowPower
    ? "bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700" // Solid modal
    : "bg-white/80 dark:bg-white/10 backdrop-blur-2xl border-white/40 dark:border-white/20"; // Glass modal

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${overlayStyle}`}
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${contentStyle} w-[90%] rounded-[2rem] p-5 shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative flex flex-col gap-3 border max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white ${className || 'max-w-[320px]'}`}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;