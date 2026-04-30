interface CandidateAvatarProps {
  photoUrl?: string | null;
  name: string;
  size?: number;
  showName?: boolean;
}

const colors = ['#4338ca', '#0f6e56', '#993c1d', '#185fa5', '#854f0b', '#7c3aed', '#dc2626', '#ea580c'];

export function CandidateAvatar({ photoUrl, name, size = 48, showName = false }: CandidateAvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colorIndex = name.charCodeAt(0) % colors.length;

  const avatar = photoUrl ? (
    <img
      src={photoUrl}
      alt={`${name} photo`}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #e5e7eb',
        flexShrink: 0,
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        if (target.nextSibling) {
          (target.nextSibling as HTMLElement).style.display = 'flex';
        }
      }}
    />
  ) : null;

  const initialsAvatar = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[colorIndex],
        display: photoUrl ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.35,
        fontWeight: 600,
        flexShrink: 0,
        border: '2px solid #e5e7eb',
      }}
    >
      {initials}
    </div>
  );

  if (!showName) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {avatar}
        {initialsAvatar}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ display: 'flex' }}>
        {avatar}
        {initialsAvatar}
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>{name}</div>
      </div>
    </div>
  );
}
