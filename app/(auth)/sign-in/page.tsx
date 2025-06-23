'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authClient } from '@/lib/auth-client';

const Page = () => {
  const handleSignIn = async () => {
    return await authClient.signIn.social({
      provider: 'google',
    });
  };

  return (
    <main className={'sign-in'}>
      <aside className="testimonial">
        <Link href={'/'}>
          <Image
            src={'/assets/icons/logo.svg'}
            alt={'Logo'}
            width={32}
            height={32}
          />
          <h1>SnapCast</h1>
        </Link>
        <div className="description">
          <section>
            <figure>
              {Array.from({ length: 5 }).map((_, index) => {
                return (
                  <Image
                    key={index}
                    src={'/assets/icons/star.svg'}
                    alt={'star'}
                    width={20}
                    height={20}
                  />
                );
              })}
            </figure>
            <p>
              “SnapCast is a game-changer for content creators. The platforms
              user-friendly interface and powerful features have transformed the
              way I share my videos with the world.”
            </p>

            <article>
              <Image
                src={'/assets/images/jason.png'}
                alt={'Pavan Kumar Mistry'}
                width={64}
                height={64}
                className={'rounded-full'}
              />
              <div>
                <h3>Sai Kamal</h3>
                <p>Content creator</p>
              </div>
            </article>
          </section>
        </div>
        <p>© SnapCast {new Date().getFullYear()}</p>
      </aside>
      <aside className={'google-sign-in'}>
        <section>
          <Link href={'/'}>
            <Image
              src={'/assets/icons/logo.svg'}
              alt={'Logo'}
              width={40}
              height={40}
            />
            <h1>SnapCast</h1>
          </Link>
          <p>
            Create and share your very first <span>SnapCast video</span> in no
            time!
          </p>
          <button onClick={handleSignIn}>
            <Image
              src={'/assets/icons/google.svg'}
              alt={'Google'}
              width={22}
              height={22}
            />
            <span>Sign in with Google</span>
          </button>
        </section>
      </aside>
      <div className={'overlay'} />
    </main>
  );
};
export default Page;
