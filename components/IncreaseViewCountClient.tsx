'use client';

import { useEffect, useRef } from 'react';
import { increaseVideoViews } from '@/lib/actions/video';

const IncreaseViewCountClient = ({ videoId }: { videoId: string }) => {
  const hasIncremented = useRef(false);

  useEffect(() => {
    const increaseViews = async () => {
      try {
        if (!hasIncremented.current && videoId) {
          await increaseVideoViews(videoId);
          hasIncremented.current = true;
        }
      } catch (error) {
        console.error('Error increasing video views:', error);
      }
    };

    increaseViews();
  }, [videoId]);

  return null;
};
export default IncreaseViewCountClient;
