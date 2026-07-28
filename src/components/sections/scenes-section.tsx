'use client';

import { useCallback } from 'react';
import { SectionHeading } from '@/components/sections/section-heading';
import { Reveal } from '@/components/ui/reveal';
import { scenes, type HomeScene } from '@/lib/home-content';
import { stations } from '@/lib/stations';
import { useAudioStore } from '@/store/audioStore';

function SceneCard({
  scene,
  index,
  onClick,
}: {
  scene: HomeScene;
  index: number;
  onClick: () => void;
}) {
  return (
    <Reveal delayMs={index * 70}>
      <button
        type="button"
        onClick={onClick}
        className="group panel relative h-full w-full overflow-hidden rounded-2xl p-5 text-center transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:elev-lg active:scale-[0.98]"
        style={{ '--card-accent': scene.color } as React.CSSProperties}
        aria-label={`播放${scene.title}场景电台`}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--dur-base)] group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--card-accent) 14%, transparent) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />
        <span className="relative mb-3 block text-3xl">{scene.icon}</span>
        <h3 className="relative mb-1 text-sm font-semibold text-fg">{scene.title}</h3>
        <p className="relative text-xs leading-relaxed text-fg-muted">{scene.description}</p>
      </button>
    </Reveal>
  );
}

export function ScenesSection() {
  const selectStationById = useAudioStore((s) => s.selectStationById);
  const setSelectedCategory = useAudioStore((s) => s.setSelectedCategory);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);
  const customStations = useAudioStore((s) => s.customStations);

  const handleSceneClick = useCallback(
    (sceneId: string) => {
      const pool = [...stations, ...customStations].filter((s) => s.scene === sceneId);
      if (pool.length === 0) return;
      setSelectedCategory(sceneId);
      selectStationById(pool[0].id);
      setMiniMode(false);
    },
    [customStations, selectStationById, setMiniMode, setSelectedCategory],
  );

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title="适用场景"
          description="无论学习、工作还是放松，总有一个电台适合你"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {scenes.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={index}
              onClick={() => handleSceneClick(scene.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
