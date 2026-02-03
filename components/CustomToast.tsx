export function CustomToast(message: string, duration: number = 3000): void {
    const toast: HTMLElement | null = document.getElementById('toast');
    
    if (!toast) {
        console.error('Element toast not found');
        return;
    }
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    setTimeout((): void => {
        toast.className = toast.className.replace('show', '');
    }, duration);
}