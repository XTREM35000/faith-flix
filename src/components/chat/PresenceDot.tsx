import React from 'react';
import { usePresence } from '@/hooks/usePresence';

const PresenceDot: React.FC<{ userId: string }> = ({ userId }) => {
  const { isOnline } = usePresence(userId);

  return (
    <span
      className={`absolute bottom-0 right-0 block w-3.5 h-3.5 rounded-full ring-2 ring-background ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
      title={isOnline ? 'En ligne' : 'Hors ligne'}
      aria-hidden={false}
    />
  );
};

export default PresenceDot;
