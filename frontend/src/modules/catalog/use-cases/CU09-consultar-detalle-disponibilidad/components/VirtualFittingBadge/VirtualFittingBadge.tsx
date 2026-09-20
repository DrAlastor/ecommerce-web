import React from 'react';
import { Box, Sparkles, ArrowRight } from 'lucide-react';

interface VirtualFittingBadgeProps {
  model3dUrl?: string | null;
  isVisible?: boolean;
  onOpenFitting?: () => void;
}

export const VirtualFittingBadge: React.FC<VirtualFittingBadgeProps> = ({
  model3dUrl,
  isVisible,
  onOpenFitting,
}) => {
  const shouldShow = isVisible !== undefined ? isVisible : Boolean(model3dUrl);
  if (!shouldShow) return null;

  return (
    <div className="virtual-fitting-card">
      <div className="fitting-icon-wrap">
        <Box size={24} />
      </div>
      <div className="fitting-text-col">
        <div className="fitting-headline">
          <Sparkles size={14} />
          <strong>Vestidor Virtual Disponible</strong>
        </div>
        <p>
          Esta prenda cuenta con un modelo tridimensional de alta precisión. Pruébala en tu avatar o visualízala en 360°.
        </p>
      </div>
      <button
        type="button"
        className="btn-launch-fitting"
        onClick={onOpenFitting}
      >
        <span>Probar en 3D</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
};
