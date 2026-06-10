import React from 'react';
import { Share2, Copy } from 'lucide-react';
import { shareContent } from '../utils/pwaUtils';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  title, 
  text, 
  url = window.location.href,
  className = ''
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const shareData = { title, text, url };
    
    const shared = await shareContent(shareData);
    
    if (!shared) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center space-x-2 transition-colors duration-200 ${className}`}
    >
      {copied ? (
        <>
          <Copy className="w-4 h-4" />
          <span>Copiato!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Condividi</span>
        </>
      )}
    </button>
  );
};

export default ShareButton;