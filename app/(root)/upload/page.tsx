'use client';

import React, { FormEvent, useState } from 'react';
import FileInput from '@/components/FileInput';
import FormField from '@/components/FormField';
import { useFileInput } from '@/lib/hooks/useFileInput';
import { MAX_THUMBNAIL_SIZE, MAX_VIDEO_SIZE } from '@/constants';

const Page = () => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'public',
  });

  const video = useFileInput(MAX_VIDEO_SIZE);
  const thumbnail = useFileInput(MAX_THUMBNAIL_SIZE);

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
    } catch (error) {
      console.error('Error submitting form: ', error);
    } finally {
      setIsSubmitting(false);
    }

    //Todo: upload the video to bunny
    //Todo: upload thumnail to db
    //Todo: Attach thumnail
    //Todo: Create a new db entry for the video details (urls, data)
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
