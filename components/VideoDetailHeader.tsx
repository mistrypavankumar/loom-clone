'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { daysAgo } from '@/lib/utils';
import VideoDeleteButton from '@/components/VideoDeleteButton';
import { authClient } from '@/lib/auth-client';
import { BsGlobe, BsShieldLock } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { changeVideoVisibility } from '@/lib/actions/video';

const VideoDetailHeader = ({
  id,
  title,
  createdAt,
  userImg,
  username,
  ownerId,
  visibility,
}: VideoDetailHeaderProps) => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const [copied, setCopied] = useState(false);
  const [videoVisibility, setVideoVisibility] = useState<Visibility>(
    visibility || 'public'
  );

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

  const handleVisibilityChange = async () => {
    try {
      const { newVisibility, message } = await changeVideoVisibility(id);
      setVideoVisibility(newVisibility);
      toast.success(message);
    } catch (e) {
      console.error(e);
      toast.error('Failed to change visibility');
    }
  };

  return (
    <header className="detail-header">
      <aside className="user-info">
        <h1>{title}</h1>
        <figure>
          <button onClick={() => router.push(`/profile/${ownerId}`)}>
            <Image
              src={userImg || ''}
              alt="user"
              width={24}
              height={24}
              className="rounded-full"
            />
            <h2>{username ?? 'Guest'}</h2>
          </button>
          <figcaption>
            <span className="mt-1">•</span>
            <p>{daysAgo(createdAt)}</p>
          </figcaption>
        </figure>
      </aside>

      <aside className="cta flex items-center gap-3">
        {/* Copy link button */}
        <button onClick={handleCopyLink} title="Copy video link">
          <Image
            src={
              copied ? '/assets/images/checked.png' : '/assets/icons/link.svg'
            }
            alt="copy link"
            width={24}
            height={24}
          />
        </button>

        {/* Visibility toggle - only owner can see & toggle */}
        {ownerId === currentUser?.id && (
          <button
            onClick={handleVisibilityChange}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100/20 transition"
            title={`Click to make ${videoVisibility === 'public' ? 'private' : 'public'}`}
          >
            {videoVisibility === 'public' ? (
              <>
                <BsGlobe size={18} className="text-blue-600" />
                <span className="capitalize">Public</span>
              </>
            ) : (
              <>
                <BsShieldLock size={18} className="text-gray-600" />
                <span className="capitalize">Private</span>
              </>
            )}
          </button>
        )}

        {/* Delete Button - only for owner */}
        {ownerId === currentUser?.id && (
          <VideoDeleteButton videoId={id} userId={ownerId} />
        )}
      </aside>
    </header>
  );
};

export default VideoDetailHeader;
