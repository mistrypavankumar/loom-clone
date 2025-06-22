'use client';

import { useEffect, useRef } from 'react';
import { increaseVideoViews } from '@/lib/actions/video';

const IncreaseViewCountClient = ({ videoId }: { videoId: string }) => {
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!hasIncremented.current && videoId) {
      increaseVideoViews(videoId).catch(console.error);
      hasIncremented.current = true;
    }
  }, [videoId]);

  return null;
};
export default IncreaseViewCountClient;
