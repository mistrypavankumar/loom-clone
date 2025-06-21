import React from 'react';
import Image from 'next/image';

const EmptyState = ({ icon, title, description }: EmptyStateProps) => {
  return (
    <section className={'empty-state'}>
      <div>
        <Image src={icon} alt={'icon'} width={64} height={64} />
      </div>
      <article>
        <h1>{title}</h1>
        <p>{description}</p>
      </article>
    </section>
  );
};
export default EmptyState;
