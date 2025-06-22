import React, { useState } from 'react';
import { deleteVideoByOwner } from '@/lib/actions/video';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ICONS } from '@/constants';

const VideoDeleteButton = ({
  videoId,
  userId,
}: {
  videoId: string;
  userId: string;
}) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationText, setConfirmationText] = useState('');

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setConfirmationText('');
  };

  const handleDelete = async () => {
    if (confirmationText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm.');
      return;
    }

    setIsDeleting(true);
    
    try {
      const { success, message } = await deleteVideoByOwner(videoId);

      if (success) {
        setIsModalOpen(false);
        router.push(`/profile/${userId}`);
      } else {
        setError(message || 'Failed to delete video');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError('Failed to delete video');
        console.error('Error deleting video:', err);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="record z-100">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Delete Video
      </button>

      {isModalOpen && (
        <section className="dialog">
          <div className="overlay-record" onClick={closeModal} />
          <div className="dialog-content">
            <figure className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
              <button onClick={closeModal}>
                <Image src={ICONS.close} alt="close" width={20} height={20} />
              </button>
            </figure>

            <section className="mb-4 rounded-none flex flex-col">
              <p className="text-sm mb-2">
                This will permanently delete the video. To confirm, please type{' '}
                <span className="font-bold">delete</span> below:
              </p>

              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-pink-100"
                placeholder='Type "delete" to confirm'
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
              />

              {error && (
                <p className="text-red-600 text-sm mt-2 py-2 px-3 bg-red-100 w-full rounded-md">
                  {error}
                </p>
              )}
            </section>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-3 py-1 text-gray-600 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={
                  isDeleting || confirmationText.toLowerCase() !== 'delete'
                }
                className={`px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50`}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default VideoDeleteButton;
