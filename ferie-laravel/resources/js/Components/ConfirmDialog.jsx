import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';

export default function ConfirmDialog({
    show = false,
    title,
    message,
    confirmLabel = 'Conferma',
    cancelLabel = 'Annulla',
    destructive = false,
    processing = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                onClose={onCancel}
            >
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="absolute inset-0"
                        style={{ background: 'rgba(10,10,10,0.45)' }}
                    />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <DialogPanel
                        className="h-card h-root"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: 440,
                            padding: 22,
                            background: 'var(--h-surface)',
                            color: 'var(--h-ink)',
                        }}
                    >
                        {title && (
                            <h3 className="h-heading" style={{ fontSize: 18, marginBottom: 8 }}>
                                {title}
                            </h3>
                        )}
                        {message && (
                            <div style={{ fontSize: 13 }}>{message}</div>
                        )}

                        <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={processing}
                                className="h-btn h-btn-ghost"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={processing}
                                className="h-btn"
                                style={
                                    destructive
                                        ? { background: 'var(--h-ink)', color: 'var(--h-bg)' }
                                        : { background: 'var(--h-coral)', color: 'var(--h-ink)' }
                                }
                            >
                                {processing ? 'Eliminazione…' : confirmLabel}
                            </button>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
