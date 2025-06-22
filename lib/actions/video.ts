'use server';

import {
  apiFetch,
  doesTitleMatch,
  getEnv,
  getOrderByClause,
  withErrorHandling,
} from '@/lib/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { BUNNY } from '@/constants';
import { db } from '@/drizzle/db';
import { user, videos, videoViews } from '@/drizzle/schema';
import { revalidatePath } from 'next/cache';
import aj from '@/lib/arcjet';
import { fixedWindow } from 'arcjet';
import { request } from '@arcjet/next';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

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

const buildVideoWithUserQuery = () => {
  return db
    .select({
      video: videos,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(videos)
    .leftJoin(user, eq(videos.userId, user.id));
};

const deleteVideoFromBunny = async (
  bunnyVideoId: string,
  thumbnailUrl: string
) => {
  // 1. Delete from Bunny Stream (Video)
  const streamUrl = `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`;

  const videoRes = await fetch(streamUrl, {
    method: 'DELETE',
    headers: {
      AccessKey: ACCESS_KEY.streamAccessKey,
    },
  });

  console.log('Video DELETE response:', videoRes.status);

  if (!videoRes.ok) {
    const err = await videoRes.text();
    throw new Error(`Failed to delete video from Bunny Stream: ${err}`);
  }

  // 2. Extract thumbnail path from full CDN URL
  const fileName = thumbnailUrl.split('/').pop(); // just the filename
  const storageUrl = `${BUNNY.STORAGE_BASE_URL}/thumbnails/${fileName}`;

  // 3. Delete from Bunny Storage
  const thumbRes = await fetch(storageUrl, {
    method: 'DELETE',
    headers: {
      AccessKey: ACCESS_KEY.storageAccessKey,
    },
  });

  console.log('Thumbnail DELETE response:', thumbRes.status);

  if (!thumbRes.ok) {
    const err = await thumbRes.text();
    throw new Error(`Failed to delete thumbnail from Bunny Storage: ${err}`);
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
    bunnyVideoId: videoResponse.guid,
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
      `${VIDEO_STREAM_BASE_URL}/${BUNNY_LIBRARY_ID}/videos/${videoDetails.bunnyVideoId}`,
      {
        method: 'POST',
        bunnyType: 'stream',
        body: {
          title: videoDetails.title,
          description: videoDetails.description,
        },
      }
    );

    // Compose video URL
    const videoUrl = `${BUNNY.EMBED_URL}/${BUNNY_LIBRARY_ID}/${videoDetails.bunnyVideoId}`;
    const now = new Date();

    await db.insert(videos).values({
      ...videoDetails,
      videoUrl,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePaths(['/']);
    return {
      bunnyVideoId: videoDetails.bunnyVideoId,
      message: 'Video saved successfully',
    };
  }
);

export const getAllVideos = withErrorHandling(
  async (
    searchQuery: string = '',
    sortFilter?: string,
    pageNumber: number = 1,
    pageSize: number = 8
  ) => {
    const session = await auth.api.getSession({ headers: await headers() });
    const currrentUserId = session?.user.id;

    const canSeeTheVideos = or(
      eq(videos.visibility, 'public'),
      eq(videos.userId, currrentUserId!)
    );

    const whereCondition = searchQuery.trim()
      ? and(canSeeTheVideos, doesTitleMatch(videos, searchQuery))
      : canSeeTheVideos;

    const [{ totalCount }] = await db
      .select({ totalCount: sql<number>`count(*)` })
      .from(videos)
      .where(whereCondition);

    const totalVideos = Number(totalCount || 0);
    const totalPages = Math.ceil(totalVideos / pageSize);

    const videoRecords = await buildVideoWithUserQuery()
      .where(whereCondition)
      .orderBy(
        sortFilter
          ? getOrderByClause(sortFilter)
          : sql`${videos.createdAt}
          DESC`
      )
      .limit(pageSize)
      .offset((pageNumber - 1) * pageSize);

    return {
      videos: videoRecords,
      pagination: {
        totalVideos,
        totalPages,
        pageSize,
        currentPage: pageNumber,
      },
    };
  }
);

export const getVideoById = withErrorHandling(async (videoId: string) => {
  const [videoRecord] = await buildVideoWithUserQuery().where(
    eq(videos.id, videoId)
  );

  return videoRecord;
});

export const getAllVideosByUser = withErrorHandling(
  async (
    userIdParameter: string,
    searchQuery: string = '',
    sortFilter?: string
  ) => {
    const currentUserId = (
      await auth.api.getSession({ headers: await headers() })
    )?.user.id;

    const isOwner = userIdParameter === currentUserId;

    const [userInfo] = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, userIdParameter));

    if (!userInfo) throw new Error('User not found');

    const conditions = [
      eq(videos.userId, userIdParameter),
      !isOwner && eq(videos.visibility, 'public'),
      searchQuery.trim() && ilike(videos.title, `%${searchQuery}%`),
    ].filter(Boolean) as never[];

    const userVideos = await buildVideoWithUserQuery()
      .where(and(...conditions))
      .orderBy(
        sortFilter ? getOrderByClause(sortFilter) : desc(videos.createdAt)
      );

    return { user: userInfo, videos: userVideos, count: userVideos.length };
  }
);

export const increaseVideoViews = withErrorHandling(async (videoId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) return;

  const userId = session.user.id;

  const [existingView] = await db
    .select()
    .from(videoViews)
    .where(and(eq(videoViews.videoId, videoId), eq(videoViews.userId, userId)))
    .limit(1);

  if (existingView) return;

  await db.insert(videoViews).values({
    userId,
    videoId,
    viewedAt: new Date(),
  });

  await db
    .update(videos)
    .set({
      views: sql`${videos.views}
      + 1`,
      updatedAt: new Date(),
    })
    .where(eq(videos.id, videoId));
});

export const deleteVideoByOwner = withErrorHandling(async (videoId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Step 1: Find video by Bunny's videoId
  const [videoRecord] = await db
    .select()
    .from(videos)
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

  if (!videoRecord) {
    throw new Error('Video not found');
  }

  if (videoRecord.userId !== userId) {
    throw new Error('You do not have permission to delete this video');
  }

  // Step 2: Delete from Bunny CDN
  await deleteVideoFromBunny(
    videoRecord.bunnyVideoId,
    videoRecord.thumbnailUrl
  );

  // // Step 3: Delete all view records associated with this video (by internal UUID)
  await db.delete(videoViews).where(eq(videoViews.videoId, videoRecord.id));

  // Step 4: Delete the video record itself
  await db.delete(videos).where(eq(videos.id, videoRecord.id));

  return { success: true, message: 'Video deleted successfully' };
});

export const changeVideoVisibility = withErrorHandling(
  async (videoId: string) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;

    // Step 1: Find the video owned by the user
    const [videoRecord] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .limit(1);

    if (!videoRecord) {
      throw new Error(
        'Video not found or you do not have permission to modify it'
      );
    }

    // Step 2: Toggle visibility
    const newVisibility: 'public' | 'private' =
      videoRecord.visibility === 'public' ? 'private' : 'public';

    // Step 3: Update video visibility
    await db
      .update(videos)
      .set({
        visibility: newVisibility,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId));

    // Step 4: Revalidate affected pages
    revalidatePaths([`/profile/${userId}`, `/video/${videoId}`]);

    return {
      success: true,
      message: `Video visibility changed to ${newVisibility}`,
      newVisibility,
    };
  }
);
