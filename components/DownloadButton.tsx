import React from 'react';

interface DownloadButtonProps {
  onClick?: () => void;
  href?: string;
  sizeStr?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, href, sizeStr = "Size: Unknown" }) => {
  return (
    <>
      <style>{`
        .btn-4 {
          --width: 100%;
          --height: 56px;
          --tooltip-height: 35px;
          --tooltip-width: 100px;
          --gap-between-tooltip-to-button: 18px;
          --button-color: #6d28d9;
          --tooltip-color: #fff;
          width: var(--width);
          height: var(--height);
          background: var(--button-color);
          position: relative;
          text-align: center;
          border-radius: 12px;
          font-family: inherit;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s, box-shadow 0.2s;
          border: none;
          display: block;
          text-decoration: none;
          max-width: 300px;
          margin: 0 auto;
        }

        .btn-4::before {
          position: absolute;
          content: attr(data-tooltip);
          width: var(--tooltip-width);
          height: var(--tooltip-height);
          background-color: var(--tooltip-color);
          font-size: 14px;
          color: #111;
          font-weight: 600;
          border-radius: 6px;
          line-height: var(--tooltip-height);
          bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) + 10px);
          left: calc(50% - var(--tooltip-width) / 2);
          pointer-events: none;
        }

        .btn-4::after {
            content: '';
            position: absolute;
            width: 0; 
            height: 0; 
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid var(--tooltip-color);
            left: calc(50% - 8px);
            bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) + 10px);
            opacity: 0;
            transition: all 0.5s;
        }

        .btn-4::after,
        .btn-4::before {
          opacity: 0;
          visibility: hidden;
          transition: all 0.5s;
        }

        .btn-4 .text {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .btn-4 .button-wrapper,
        .btn-4 .text,
        .btn-4 .icon {
          overflow: hidden;
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          color: #fff;
        }

        .btn-4 .text {
          top: 0;
        }

        .btn-4 .text,
        .btn-4 .icon {
          transition: top 0.5s;
        }

        .btn-4 .icon {
          color: #fff;
          top: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-4 .icon svg {
          width: 24px;
          height: 24px;
        }

        .btn-4:hover {
          background: #8b5cf6;
          transform: scale(1.02);
          box-shadow: 0 10px 20px -10px rgba(109, 40, 217, 0.5);
        }

        .btn-4:hover .text {
          top: -100%;
        }

        .btn-4:hover .icon {
          top: 0;
        }

        .btn-4:hover:before,
        .btn-4:hover:after {
          opacity: 1;
          visibility: visible;
        }

        .btn-4:hover:after {
           bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) - 5px);
        }

        .btn-4:hover:before {
          bottom: calc(var(--height) + var(--gap-between-tooltip-to-button));
        }
      `}</style>
      
      {href ? (
        <a 
          className="btn-4" 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          data-tooltip={sizeStr}
          aria-label={`Download file, ${sizeStr}`}
        >
          <div className="button-wrapper">
            <div className="text">Download</div>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
              </svg>
            </span>
          </div>
        </a>
      ) : (
        <button 
          className="btn-4" 
          onClick={onClick} 
          data-tooltip={sizeStr}
          aria-label={`Download file, ${sizeStr}`}
        >
          <div className="button-wrapper">
            <div className="text">Download</div>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
              </svg>
            </span>
          </div>
        </button>
      )}
    </>
  );
};

export default DownloadButton;