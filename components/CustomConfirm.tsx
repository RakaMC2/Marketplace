interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  title?: string;
}

export function CustomConfirm(
  message: string, 
  options: ConfirmOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const {
      confirmText = 'Okay',
      cancelText = 'Cancel',
      title = 'Confirmed Action'
    } = options;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(0px);
      transition: all 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: #1a1a1a;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
      max-width: 420px;
      text-align: center;
      border: 1px solid #2a2a2a;
      transform: scale(0.7);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.textContent = title;
      titleEl.style.cssText = `
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 0.3px;
      `;
      modal.appendChild(titleEl);
    }

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin-bottom: 24px;
      color: #e0e0e0;
      font-size: 15px;
      line-height: 1.6;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.style.cssText = `
      padding: 11px 28px;
      border: 1px solid #404040;
      background: #262626;
      color: #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    cancelBtn.onmousedown = (e) => {
      const ripple = document.createElement('span');
      const rect = cancelBtn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(106, 27, 154, 0.4);
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      cancelBtn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = 'linear-gradient(135deg, #4a148c 0%, #1a1a1a 100%)';
      cancelBtn.style.borderColor = '#6a1b9a';
      cancelBtn.style.transform = 'translateY(-2px)';
      cancelBtn.style.boxShadow = '0 4px 12px rgba(106, 27, 154, 0.4)';
    };
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = '#262626';
      cancelBtn.style.borderColor = '#404040';
      cancelBtn.style.transform = 'translateY(0)';
      cancelBtn.style.boxShadow = 'none';
    };

    const okBtn = document.createElement('button');
    okBtn.textContent = confirmText;
    okBtn.style.cssText = `
      padding: 11px 28px;
      border: 1px solid #6a1b9a;
      background: linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%);
      color: #ffffff;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    okBtn.onmousedown = (e) => {
      const ripple = document.createElement('span');
      const rect = okBtn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;
      
      okBtn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    okBtn.onmouseover = () => {
      okBtn.style.background = 'linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%)';
      okBtn.style.transform = 'translateY(-2px)';
      okBtn.style.boxShadow = '0 6px 20px rgba(123, 31, 162, 0.6)';
    };
    okBtn.onmouseout = () => {
      okBtn.style.background = 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)';
      okBtn.style.transform = 'translateY(0)';
      okBtn.style.boxShadow = 'none';
    };

    const cleanup = (): void => {
      modal.style.transform = 'scale(0.7)';
      modal.style.opacity = '0';
      overlay.style.background = 'rgba(0, 0, 0, 0)';
      overlay.style.backdropFilter = 'blur(0px)';
      
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    };

    cancelBtn.onclick = (): void => {
      cleanup();
      setTimeout(() => resolve(false), 300);
    };

    okBtn.onclick = (): void => {
      cleanup();
      setTimeout(() => resolve(true), 300);
    };

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        cleanup();
        setTimeout(() => resolve(false), 300);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        setTimeout(() => resolve(false), 300);
      }
    };

    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(okBtn);
    modal.appendChild(messageEl);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.background = 'rgba(0, 0, 0, 0.85)';
      overlay.style.backdropFilter = 'blur(4px)';
      modal.style.transform = 'scale(1)';
      modal.style.opacity = '1';
    }, 10);

    okBtn.focus();
  });
}