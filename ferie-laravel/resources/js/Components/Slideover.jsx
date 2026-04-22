import Icon from '@/Components/h/Icon';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';

const widthBySize = {
    md: 520,
    lg: 620,
    xl: 720,
    '2xl': 820,
    '3xl': 920,
    request: 460,
};

export default function Slideover({
    children,
    show = false,
    onClose = () => {},
    title = '',
    size = 'md',
    footer,
}) {
    const panelWidth = widthBySize[size] ?? widthBySize.md;

    return (
        <Transition show={show}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="fixed inset-0"
                        style={{ background: 'rgba(10,10,10,0.35)' }}
                    />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                        <TransitionChild
                            enter="transform transition ease-out duration-220"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in duration-180"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <DialogPanel
                                className="pointer-events-auto h-full"
                                style={{
                                    width: `min(${panelWidth}px, 96vw)`,
                                    background: 'var(--h-surface)',
                                    borderLeft: '4px solid var(--h-line)',
                                    boxShadow: '-10px 0 0 0 var(--h-ink)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {title && (
                                    <header
                                        style={{
                                            padding: '18px 22px',
                                            borderBottom: '3px solid var(--h-line)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            background: 'var(--h-surface)',
                                        }}
                                    >
                                        <h3 className="h-heading" style={{ margin: 0, fontSize: 22 }}>
                                            {title}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="h-btn h-btn-sm"
                                            aria-label="Chiudi"
                                            style={{ padding: 6 }}
                                        >
                                            <Icon name="x" size={16} />
                                        </button>
                                    </header>
                                )}
                                <div
                                    className="h-scroll"
                                    style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px 22px',
                                        background: 'var(--h-surface)',
                                    }}
                                >
                                    {children}
                                </div>
                                {footer && (
                                    <footer
                                        style={{
                                            padding: '16px 22px',
                                            borderTop: '3px solid var(--h-line)',
                                            display: 'flex',
                                            gap: 10,
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            background: 'var(--h-bg-2)',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {footer}
                                    </footer>
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
