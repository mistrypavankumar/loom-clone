'use server';

import { apiFetch, getEnv, withErrorHandling } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { BUNNY } from '@/constants';
import { db } from '@/drizzle/db';
import { videos } from '@/drizzle/schema';
import { revalidatePath } from 'next/cache';
import aj from '@/lib/arcjet';
import { fixedWindow } from 'arcjet';
import { request } from '@arcjet/next';

// Constants for Bunny CDN URLs and access keys
const VIDEO_STREAM_BASE_URL = BUNNY.STREAM_BASE_URL;
const THUMBNAIL_STREAM_BASE_URL = BUNNY.STORAGE_BASE_URL;
const THUMBNAIL_CDN_URL = BUNNY.CDN_URL;
const BUNNY_LIBRARY_ID = getEnv('BUNNY_LIBRARY_ID');
const ACCESS_KEY = {
  streamAccessKey: getEnv('BUNNY_STREAM_ACCESS_KEY'),
  storageAccessKey: getEnv('BUNNY_STORAGE_ACCESS_KEY'),
};

// Helper functions
const getSessionUserId = async (): Promise<string> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
};

const revalidatePaths = (paths: string[]) => {
  paths.forEach((path) => revalidatePath(path));
};

// This function stops from bot submitting videos and other spam
const validateWithArcjet = async (fingerprint: string) => {
  const rateLimit = aj.withRule(
    fixedWindow({
      mode: 'LIVE',
      window: '1m', // 1 minute window
      max: 2, // Allow 1 request per minute
      characteristics: ['fingerprint'],
    })
  );

  const req = await request();

  const decision = await rateLimit.protect(req, { fingerprint });

  if (decision.isDenied()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
};

// Server actions
export const getVideoUploadUrl = withErrorHandling(async () => {
  await getSessionUserId();

  const videoResponse = await apiFetch<BunnyVideoResponse>(
    `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      bunnyType: 'stream',
      body: {
        title: 'Temporary Title',
        collectionId: '',
      },
    }
  );

  const uploadUrl = `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoResponse.guid}`;
  return {
    videoId: videoResponse.guid,
    uploadUrl,
    accessKey: ACCESS_KEY.streamAccessKey,
  };
});

export const getThumbnailUploadUrl = withErrorHandling(
  async (videoId: string) => {
    const fileName = `${Date.now()}-${videoId}-thumbnail`;
    const uploadUrl = `${THUMBNAIL_STREAM_BASE_URL}/thumbnails/${fileName}`;
    const cdnUrl = `${THUMBNAIL_CDN_URL}/thumbnails/${fileName}`;

    return {
      uploadUrl,
      cdnUrl,
      accessKey: ACCESS_KEY.storageAccessKey,
    };
  }
);

export const saveVideoDetails = withErrorHandling(
  async (videoDetails: VideoDetails) => {
    const userId = await getSessionUserId();
    await validateWithArcjet(userId);
    await apiFetch(
      `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.videoId}`,
      {
        method: 'POST',
        bunnyType: 'stream',
        body: {
          title: videoDetails.title,
          description: videoDetails.description,
        },
      }
    );

    const now = new Date();
    await db.insert(videos).values({
      ...videoDetails,
      videoUrl: `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.videoId}`,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePaths(['/']);
    return { videoId: videoDetails.videoId };
  }
);
