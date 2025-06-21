import React from 'react';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import { getAllVideos } from '@/lib/actions/video';
import EmptyState from '@/components/EmptyState';

const Page = async ({ searchParams }: SearchParams) => {
  const { query, filter, page } = await searchParams;

  const { videos } = await getAllVideos(query, filter, Number(page) || 1);

  return (
    <main className={'wrapper page'}>
      <Header title={'All Videos'} subHeader={'Public Library'} />

      {videos?.length > 0 ? (
        <section className={'video-grid'}>
          {videos.map(({ video, user }) => {
            return (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video?.thumbnailUrl}
                userImg={user?.image || ''}
                username={user?.name || ''}
                createdAt={video.createdAt}
                views={video.views || 0}
                visibility={video.visibility}
                duration={video.duration}
              />
            );
          })}
        </section>
      ) : (
        <EmptyState
          icon={'/assets/icons/video.svg'}
          title={'No Videos Found'}
          description={'Try adjusting your search or filter options.'}
        />
      )}
    </main>
  );
};

export default Page;
