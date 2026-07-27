'use client';

import { Avatar, AvatarGroup } from '@lyra-ds/react';

export function AvatarGroupPeople() {
  return (
    <AvatarGroup aria-label="Project members">
      <Avatar name="Maya Chen" />
      <Avatar name="David Ortiz" />
      <Avatar name="Priya Shah" />
    </AvatarGroup>
  );
}
