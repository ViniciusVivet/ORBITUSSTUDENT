'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { StudentListItem } from '@orbitus/shared';

const ModalAvatar3DBackdrop = dynamic(
  () => import('./ModalAvatar3DBackdrop').then((m) => m.ModalAvatar3DBackdrop),
  { ssr: false, loading: () => null },
);

function usePrefersReducedMotion(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setV(mq.matches);
    const fn = () => setV(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return v;
}

type Props = {
  loading: boolean;
  student: Pick<StudentListItem, 'avatarType' | 'avatarValue' | 'photoUrl'>;
};

export function StudentModalAvatar({ loading, student }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const show3d = !reducedMotion && student.avatarType !== 'photo';

  if (loading) {
    return (
      <>
        <div className="h-28 w-28 animate-pulse rounded-full bg-gray-700" />
        <p className="mt-2 text-xs text-gray-400 sm:mt-3 sm:text-sm">Carregando…</p>
      </>
    );
  }

  if (student.avatarType === 'photo' && student.photoUrl) {
    return (
      <>
        <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-orbitus-accent/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={student.photoUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <p className="mt-2 text-xs text-gray-400 sm:mt-3 sm:text-sm">Foto do aluno</p>
      </>
    );
  }

  const face = student.avatarType === 'emoji' ? student.avatarValue : '🧑‍🎓';

  return (
    <>
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
        {show3d && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
            <ModalAvatar3DBackdrop />
          </div>
        )}
        <div
          className={`relative z-10 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full text-5xl shadow-inner ring-2 ring-orbitus-accent/50 ${
            show3d ? 'bg-orbitus-dark/80 backdrop-blur-[3px]' : 'bg-orbitus-accent/30'
          }`}
        >
          {face}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-gray-400 sm:mt-3 sm:text-sm">
        {show3d ? 'Orbe 3D + emoji (reduce motion = só 2D)' : 'Avatar 2D'}
      </p>
    </>
  );
}
