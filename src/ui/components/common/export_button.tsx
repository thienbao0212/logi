import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, ButtonSize } from './button.js';

export interface ExportButtonProps {
  onExport?: () => void | Promise<void>;
  onClick?: () => void | Promise<void>;
  label?: string;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  onExport,
  onClick,
  label = 'Xuất Excel',
  size = 'md',
  disabled = false,
  className = '',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const action = onExport || onClick;
      if (action) {
        await Promise.resolve(action());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size={size}
      loading={loading}
      disabled={disabled}
      icon={<Download size={14} className="text-slate-500" />}
      onClick={handleClick}
      className={className}
    >
      {label}
    </Button>
  );
}
 
