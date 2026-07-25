'use client';

import { Tag } from '@lyra-ds/react';
import { useState } from 'react';

export function TagRemovable() {
  const [tags, setTags] = useState(['Design systems', 'Accessibility', 'React']);

  return (
    <>
      {tags.map((tag) => (
        <Tag
          key={tag}
          onRemove={() => setTags((current) => current.filter((item) => item !== tag))}
        >
          {tag}
        </Tag>
      ))}
    </>
  );
}
