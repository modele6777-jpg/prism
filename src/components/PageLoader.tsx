import React from 'react';
import { PrismRainbowLoader } from './PrismRainbowLoader';

export function PageLoader() {
  return (
    <div className="h-full min-h-[50vh] flex flex-col items-center justify-center py-10 w-full">
      <PrismRainbowLoader
        compact
        message="마음의 스펙트럼을 불러오는 중..."
        subMessage="ALIGNING SACRED FREQUENCY"
      />
    </div>
  );
}
