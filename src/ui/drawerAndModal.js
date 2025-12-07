export function toggleParametersDrawer(DOMElements, forceOpen) {
    const isOpen = DOMElements.parametersDrawer.classList.contains('is-open');
    const openDrawer = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;
    if (openDrawer) {
        DOMElements.parametersDrawer.classList.add('is-open');
        DOMElements.drawerBackdrop.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    } else {
        DOMElements.parametersDrawer.classList.remove('is-open');
        DOMElements.drawerBackdrop.classList.remove('is-visible');
        if (!DOMElements.helpModal.classList.contains('is-visible')) {
            document.body.style.overflow = '';
        }
    }
}

export function toggleHelpModal(DOMElements, show) {
    if (show) {
        DOMElements.helpModal.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    } else {
        DOMElements.helpModal.classList.remove('is-visible');
        if (!DOMElements.parametersDrawer.classList.contains('is-open')) {
            document.body.style.overflow = '';
        }
    }
}
