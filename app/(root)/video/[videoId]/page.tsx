import React from 'react';
import { getVideoById } from '@/lib/actions/video';
import { redirect } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import IncreaseViewCountClient from '@/components/IncreaseViewCountClient';
import VideoDetailHeader from '@/components/VideoDetailHeader';

const Page = async ({ params }: Params) => {
  const { videoId } = await params;

  const { user, video } = await getVideoById(videoId);

  if (!video) redirect('/404');

  return (
    <main className={'wrapper page'}>
      <IncreaseViewCountClient videoId={video.id} />

      <VideoDetailHeader
        {...video}
        userImg={user?.image}
        username={user?.name}
        ownerId={video?.userId}
      />
      <section className={'video-details'}>
        <div className={'content'}>
          <VideoPlayer bunnyVideoId={video.bunnyVideoId} />
        </div>
      </section>
    </main>
  );
};
export default Page;
