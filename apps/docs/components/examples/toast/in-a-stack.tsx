'use client';

import { Button, Icon, Toast, ToastStack } from '@lyra-ds/react';
import { useState } from 'react';

export function ToastInAStack() {
  const [messages, setMessages] = useState<string[]>([]);

  const notify = () =>
    setMessages((current) => [...current, `Invite sent (${current.length + 1})`]);

  return (
    <>
      <Button variant="secondary" onClick={notify}>
        Send an invite
      </Button>
      {messages.length > 0 && (
        <ToastStack>
          {messages.map((message) => (
            <Toast
              key={message}
              tone="info"
              icon={<Icon name="mail" size={17} />}
              onClose={() => setMessages((current) => current.filter((item) => item !== message))}
            >
              {message}
            </Toast>
          ))}
        </ToastStack>
      )}
    </>
  );
}
