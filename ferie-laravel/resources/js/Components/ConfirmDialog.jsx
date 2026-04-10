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
                    <div className="absolute inset-0 bg-black/50" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <DialogPanel className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
                        {title && (
                            <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
                        )}
                        {message && (
                            <div className="text-sm text-muted-foreground">{message}</div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={processing}
                                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={processing}
                                className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                                    destructive
                                        ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                                        : 'bg-primary text-primary-foreground hover:opacity-90'
                                }`}
                            >
                                {processing ? 'Eliminazione...' : confirmLabel}
                            </button>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
