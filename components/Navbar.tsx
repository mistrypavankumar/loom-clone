'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import toast from 'react-hot-toast';

const Navbar = () => {
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <header className={'navbar'}>
      <nav>
        <Link href={'/'}>
          <Image
            src={'/assets/icons/logo.svg'}
            alt={'Logo'}
            width={32}
            height={32}
          />
          <h1 className={'text-2xl'}>SnapCast</h1>
        </Link>

        {user && (
          <figure>
            <button onClick={() => router.push(`/profile/${user?.id}`)}>
              <Image
                src={user.image || '/assets/icons/user.svg'}
                alt={'User Icon'}
                width={36}
                height={36}
                className={'rounded-full aspect-square'}
              />
            </button>
            <button
              className={'cursor-pointer'}
              onClick={async () => {
                return await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      toast.success('Logged out successfully!');
                      redirect('/sign-in');
                    },
                  },
                });
              }}
            >
              <Image
                src={'/assets/icons/logout.svg'}
                alt={'logout'}
                width={24}
                height={24}
                className={'rotate-180'}
              />
            </button>
          </figure>
        )}
      </nav>
    </header>
  );
};
export default Navbar;
