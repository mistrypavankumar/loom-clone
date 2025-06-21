import React from 'react';
import Header from '@/components/Header';
import { getAllVideosByUser } from '@/lib/actions/video';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import EmptyState from '@/components/EmptyState';

const Page = async ({ params, searchParams }: ParamsWithSearch) => {
  const { id } = await params;

  const { query, filter } = await searchParams;

  const { user, videos } = await getAllVideosByUser(id, query, filter);

  if (!user) return redirect('/404');

  return (
    <main className={'wrapper page'}>
      <Header
        subHeader={user?.email}
        title={user?.name}
        userImg={user?.image || ''}
      />

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
          title={'No Videos Available Yet'}
          description={'Videos will show up once you upload them.'}
        />
      )}
    </main>
  );
};
export default Page;
