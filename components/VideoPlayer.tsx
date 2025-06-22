import React from 'react';
import { createIframeLink } from '@/lib/utils';

const VideoPlayer = ({ bunnyVideoId }: VideoPlayerProps) => {
  return (
    <div className={'video-player'}>
      <iframe
        src={createIframeLink(bunnyVideoId)}
        loading={'lazy'}
        title={'Video Player'}
        style={{ border: 0, zIndex: 50 }}
        allowFullScreen
        allow={
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        }
      />
    </div>
  );
};
export default VideoPlayer;
