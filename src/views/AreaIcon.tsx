import React from 'react';
import { Users } from 'lucide-react';

export const AreaIcon = ({ name }: { name: string }) => {
  if (name.includes('trụ')) return <span className="text-lg">🛡️</span>;
  if (name.includes('thủ')) return <span className="text-lg">🏰</span>;
  if (name.includes('công')) return <span className="text-lg">⚔️</span>;
  return <Users size={18} className="text-[#949BA4]" />;
};
