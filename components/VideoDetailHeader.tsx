'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { daysAgo } from '@/lib/utils';
import VideoDeleteButton from '@/components/VideoDeleteButton';
import { authClient } from '@/lib/auth-client';

const VideoDetailHeader = ({
  id,
  title,
  createdAt,
  userImg,
  username,
  ownerId,
  bunnyVideoId,
}: VideoDetailHeaderProps) => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/video/${id}`);
    setCopied(true);
  };

  return (
    <header className={'detail-header'}>
      <aside className={'user-info'}>
        <h1>{title}</h1>
        <figure>
          <button onClick={() => router.push(`/profile/${ownerId}`)}>
            <Image
              src={userImg || ''}
              alt={'user'}
              width={24}
              height={24}
              className={'rounded-full'}
            />
            <h2>{username ?? 'Guest'}</h2>
          </button>
          <figcaption>
            <span className={'mt-1'}>•</span>
            <p>{daysAgo(createdAt)}</p>
          </figcaption>
        </figure>
      </aside>
      <aside className={'cta'}>
        <button onClick={handleCopyLink}>
          <Image
            src={
              copied ? '/assets/images/checked.png' : '/assets/icons/link.svg'
            }
            alt={'copy link'}
            width={24}
            height={24}
          />
        </button>
        {ownerId === currentUser?.id && (
          <VideoDeleteButton
            videoId={id}
            bunnyVideoId={bunnyVideoId}
            userId={ownerId}
          />
        )}
      </aside>
    </header>
  );
};
export default VideoDetailHeader;
