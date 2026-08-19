import React, { useEffect, useRef, useState } from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {(e?: any) => void} props.onClose
 * @param {string} props.title
 * @param {React.ReactNode} props.children
 * @param {string} [props.testId]
 * @param {React.ReactNode} [props.navigation]
 * @param {string} [props.closeLabel]
 */
export default function SidebarContainer({
  open,
  onClose,
  title,
  children,
  testId,
  navigation,
  closeLabel = 'Done',
}) {
  const panelRef = useRef(null);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;

    const updateColorPickerState = () => {
      const active = document.activeElement;
      const isColorInputActive =
        active instanceof window.HTMLInputElement &&
        active.type === 'color' &&
        panel.contains(active);
      setIsColorPickerActive(isColorInputActive);
    };

    const handleFocusIn = () => updateColorPickerState();
    const handleFocusOut = () => {
      setTimeout(updateColorPickerState, 0);
    };

    panel.addEventListener('focusin', handleFocusIn);
    panel.addEventListener('focusout', handleFocusOut);

    return () => {
      panel.removeEventListener('focusin', handleFocusIn);
      panel.removeEventListener('focusout', handleFocusOut);
      setIsColorPickerActive(false);
    };
  }, [open]);

  const handleBackdropClick = () => {
    if (isColorPickerActive) return;
    onClose();
  };

  // Prevent scroll on body when open - DISABLED for better live preview
  /* 
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  */

  return (
    <>
      {/* Backdrop - Removed blur and reduced opacity so changes can be seen clearly */}
      <div
        className={`tunet-sidebar-backdrop fixed inset-0 z-[100] transition-opacity duration-300 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{
          opacity: open ? 0.62 : 0,
        }}
        onClick={handleBackdropClick}
      />

      {/* Sidebar Panel */}
      <div
        ref={panelRef}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`tunet-sidebar popup-anim fixed inset-y-0 right-0 z-[101] w-full max-w-[420px] transform border-l backdrop-blur-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="tunet-sidebar__header flex flex-none items-center justify-between border-b px-6">
            <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              data-testid="sidebar-done"
              aria-label={closeLabel}
              className="tunet-sidebar__done px-3 text-sm font-medium transition-colors"
            >
              {closeLabel}
            </button>
          </div>

          {navigation}

          {/* Content - Scrollable */}
          <div className="tunet-sidebar__content custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
