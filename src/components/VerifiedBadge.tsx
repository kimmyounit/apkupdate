import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
  type?: 'blue' | 'yellow' | 'developer' | 'gold';
  isDeveloper?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  className = '',
  title,
  type = 'blue',
  isDeveloper = false,
}) => {
  const isDev = isDeveloper || type === 'yellow' || type === 'developer' || type === 'gold';
  const resolvedTitle = title || (isDev ? 'Developer Resmi TAMVESTA (Centang Kuning)' : 'Akun Terverifikasi Resmi (Centang Biru)');

  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
      title={resolvedTitle}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${sizeMap[size]} drop-shadow-xs`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" fill={isDev ? '#eab308' : '#2563eb'} />
        <path
          d="M8.2 12.4L10.8 15L16 9.4"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
