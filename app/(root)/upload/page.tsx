'use client';

import React, { useState } from 'react';
import FileInput from '@/components/FileInput';
import FormField from '@/components/FormField';

const Page = () => {
  const [error, setError] = useState();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'public',
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  console.log(formData);

  return (
    <div className={'wrapper upload-page'}>
      <h1>Upload a video</h1>

      {error && <div className={'error-field'}>{error}</div>}
      <form>
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
      </form>

      <FileInput />
      <FileInput />
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
    </div>
  );
};
export default Page;
