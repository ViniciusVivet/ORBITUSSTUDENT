import type { PlanetColor } from '@/lib/planetColors';

interface Props {
  planetColor: PlanetColor;
  avatarValue?: string;
  size?: number;
}

/**
 * CSS "Among Us" style astronaut avatar.
 * Helmet + visor + body, colored by planet theme.
 */
export function AstronautAvatar({ planetColor, avatarValue, size = 64 }: Props) {
  const s = size;
  const helmetR = s * 0.44;       // helmet radius
  const helmetCY = s * 0.40;      // helmet center Y
  const helmetCX = s * 0.50;      // helmet center X
  const visorW = helmetR * 1.05;  // visor width
  const visorH = helmetR * 0.70;  // visor height
  const visorTop = helmetCY - helmetR * 0.28;
  const visorLeft = helmetCX - visorW / 2;
  const bodyW = s * 0.54;
  const bodyH = s * 0.28;
  const bodyLeft = (s - bodyW) / 2;
  const bodyTop = helmetCY + helmetR - s * 0.04;
  const packW = s * 0.16;
  const packH = bodyH * 0.72;
  const fontSize = s * 0.28;

  return (
    <div
      style={{
        width: s,
        height: s,
        position: 'relative',
        flexShrink: 0,
      }}
      aria-hidden
    >
      {/* Helmet */}
      <div
        style={{
          position: 'absolute',
          width: helmetR * 2,
          height: helmetR * 2,
          borderRadius: '50%',
          top: helmetCY - helmetR,
          left: helmetCX - helmetR,
          background: `radial-gradient(circle at 38% 32%, ${planetColor.primary}cc, ${planetColor.primary}88 55%, ${planetColor.primary}55)`,
          boxShadow: `0 0 0 ${s * 0.025}px ${planetColor.ring}90, 0 4px ${s * 0.18}px ${planetColor.glow}`,
          zIndex: 2,
        }}
      />

      {/* Visor */}
      <div
        style={{
          position: 'absolute',
          width: visorW,
          height: visorH,
          borderRadius: '50%',
          top: visorTop,
          left: visorLeft,
          background: `radial-gradient(ellipse at 40% 35%, #c8e8ff44, #a8d4ff22 50%, #6ab0f808)`,
          border: `${s * 0.022}px solid ${planetColor.ring}60`,
          backdropFilter: 'blur(1px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          zIndex: 3,
          overflow: 'hidden',
        }}
      >
        {/* Visor glare */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '18%',
            width: '30%',
            height: '25%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            transform: 'rotate(-20deg)',
            pointerEvents: 'none',
          }}
        />
        <span style={{ lineHeight: 1, position: 'relative', zIndex: 1 }}>
          {avatarValue ?? '🧑‍🚀'}
        </span>
      </div>

      {/* Body / suit */}
      <div
        style={{
          position: 'absolute',
          width: bodyW,
          height: bodyH,
          borderRadius: `${bodyW * 0.32}px ${bodyW * 0.32}px ${bodyW * 0.22}px ${bodyW * 0.22}px`,
          top: bodyTop,
          left: bodyLeft,
          background: `linear-gradient(175deg, ${planetColor.primary}bb 0%, ${planetColor.primary}77 100%)`,
          boxShadow: `0 4px ${s * 0.12}px ${planetColor.glow}60`,
          zIndex: 1,
        }}
      />

      {/* Life-support pack (right side) */}
      <div
        style={{
          position: 'absolute',
          width: packW,
          height: packH,
          borderRadius: s * 0.04,
          top: bodyTop + bodyH * 0.1,
          left: bodyLeft + bodyW - packW * 0.35,
          background: `${planetColor.primary}99`,
          boxShadow: `0 2px 6px rgba(0,0,0,0.4)`,
          zIndex: 0,
        }}
      />

      {/* Left arm nub */}
      <div
        style={{
          position: 'absolute',
          width: packW,
          height: packH * 0.85,
          borderRadius: s * 0.04,
          top: bodyTop + bodyH * 0.15,
          left: bodyLeft - packW * 0.65,
          background: `${planetColor.primary}99`,
          zIndex: 0,
        }}
      />
    </div>
  );
}
