'use client';

import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import FileInput from '@/components/FileInput';
import FormField from '@/components/FormField';
import { useFileInput } from '@/lib/hooks/useFileInput';
import { MAX_THUMBNAIL_SIZE, MAX_VIDEO_SIZE } from '@/constants';
import {
  getThumbnailUploadUrl,
  getVideoUploadUrl,
  saveVideoDetails,
} from '@/lib/actions/video';
import { useRouter } from 'next/navigation';

const uploadFileToBunny = (
  file: File,
  uploadUrl: string,
  accessKey: string
): Promise<void> => {
  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: accessKey,
      'Content-Type': file.type,
    },
    body: file,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  });
};

const Page = () => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'public',
  });

  const video = useFileInput(MAX_VIDEO_SIZE);
  const thumbnail = useFileInput(MAX_THUMBNAIL_SIZE);

  useEffect(() => {
    if (video.duration !== null || 0) {
      setVideoDuration(video.duration);
    }
  }, [video.duration]);

  // This effect runs once to check if there's a recorded video in sessionStorage and
  // pre-populates the video input if found
  useEffect(() => {
    const checkForRecordedVideo = async () => {
      try {
        const stored = sessionStorage.getItem('recordedVideo');
        if (!stored) return;

        const { url, name, type, duration } = JSON.parse(stored);

        const blob = await fetch(url).then((response) => response.blob());

        const file = new File([blob], name, {
          type,
          lastModified: Date.now(),
        });

        if (video.inputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          video.inputRef.current.files = dataTransfer.files;

          const event = new Event('change', { bubbles: true });
          video.inputRef.current.dispatchEvent(event);

          video.handleFileChange({
            target: {
              files: dataTransfer.files,
            },
          } as ChangeEvent<HTMLInputElement>);
        }

        if (duration) setVideoDuration(duration);

        // remove the recorded video from sessionStorage
        sessionStorage.removeItem('recordedVideo');
        URL.revokeObjectURL(url);
      } catch (errr) {
        console.error('Error loading recorded video: ', errr);
      }
    };

    checkForRecordedVideo();
  }, [video]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!video.file || !thumbnail.file) {
        setError('Please upload video and thumbnail');
        return;
      }

      if (!formData.title || !formData.description) {
        setError('Please fill in all the details');
        return;
      }

      // step-1: Get video upload URL and access key
      const {
        videoId,
        uploadUrl: videoUploadUrl,
        accessKey: videoAccessKey,
      } = await getVideoUploadUrl();

      if (!videoUploadUrl || !videoAccessKey) {
        setError('Failed to get video upload credentials');
        return;
      }

      // step-2: Upload video to Bunny CDN
      await uploadFileToBunny(video.file!, videoUploadUrl, videoAccessKey);

      // step-3: Get thumbnail upload URL and access key
      const {
        uploadUrl: thumbnailUploadUrl,
        accessKey: thumbnailAccessKey,
        cdnUrl: thumbnailCdnUrl,
      } = await getThumbnailUploadUrl(videoId);

      if (!thumbnailUploadUrl || !thumbnailAccessKey || !thumbnailCdnUrl) {
        setError('Failed to get thumbnail upload credentials');
        return;
      }

      // step-4: Upload thumbnail to Bunny CDN
      await uploadFileToBunny(
        thumbnail.file!,
        thumbnailUploadUrl,
        thumbnailAccessKey
      );

      // step-5: Save video details to the database
      await saveVideoDetails({
        videoId,
        thumbnailUrl: thumbnailCdnUrl,
        ...formData,
        duration: videoDuration,
      });

      // step-6: Redirect to the video page
      router.push(`/video/${videoId}`);
    } catch (error) {
      console.error('Error submitting form: ', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={'wrapper-md upload-page'}>
      <h1>Upload a video</h1>

      {error && <div className={'error-field'}>{error}</div>}
      <form
        className={'rounded-20 shadow-10 gap-6 w-full flex flex-col px-5 py-7'}
        onSubmit={handleSubmit}
      >
        <FormField
          id={'title'}
          label={'Title'}
          placeholder={'Enter a clear and concise video title'}
          value={formData.title}
          onChange={handleInputChange}
        />

        <FormField
          id={'description'}
          label={'Description'}
          placeholder={'Describe what this video is about'}
          as={'textarea'}
          value={formData.description}
          onChange={handleInputChange}
        />

        <FileInput
          id="video"
          label={'Video'}
          accept={'video/*'}
          file={video.file}
          previewUrl={video.previewUrl}
          inputRef={video.inputRef}
          onChange={video.handleFileChange}
          onReset={video.resetFile}
          type={'video'}
        />
        <FileInput
          id="thumbnail"
          label={'Thumbnail'}
          accept={'image/*'}
          file={thumbnail.file}
          previewUrl={thumbnail.previewUrl}
          inputRef={thumbnail.inputRef}
          onChange={thumbnail.handleFileChange}
          onReset={thumbnail.resetFile}
          type={'image'}
        />
        <FormField
          id={'visibility'}
          label={'Visibility'}
          as={'select'}
          options={[
            {
              value: 'public',
              label: 'Public',
            },
            {
              value: 'private',
              label: 'Private',
            },
          ]}
          value={formData.visibility}
          onChange={handleInputChange}
        />

        <button
          type={'submit'}
          disabled={isSubmitting}
          className={'submit-button'}
        >
          {isSubmitting ? 'Uploading...' : 'Upload video'}
        </button>
      </form>
    </div>
  );
};
export default Page;
