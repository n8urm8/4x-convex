// src/lib/planet-images.ts

const planetImageMap: Record<string, string> = {
  'Scorched World': '/src/assets/planets/Planet_Furnace_01_560x560.png',
  'Greenhouse World': '/src/assets/planets/Planets_Jungle2_560x560.png',
  'Temperate World': '/src/assets/planets/Planets_Vital_01_560x560.png',
  'Arid World': '/src/assets/planets/Planets_Desert_01_560x560.png',
  'Gas Giant': '/src/assets/planets/Planets_Jovian_01_560x560.png',
  'Ice Giant': '/src/assets/planets/Planets_Ice_01_560x560.png',
  Asteroid: '/src/assets/asteroids/a100000.png',
  'Ocean World': '/src/assets/planets/Planets_Ocean_01_560x560.png',
  'Volcanic World': '/src/assets/planets/Planet_Furnace_02_560x560.png',
  'Frozen World': '/src/assets/planets/Planets_Ice_02_560x560.png',
  'Ringed Planet': '/src/assets/planets/Planets_Jovian_01_560x560.png',
  'Pulsar Planet': '/src/assets/planets/Planets_Shattered_01_560x560.png',
  'Binary Star Planet': '/src/assets/planets/Planets_Jovian_02_560x560.png',
  'Rogue Planet': '/src/assets/planets/Planets_Grave_01_560x560.png',
  Wormhole: '/src/assets/planets/Planets_Shattered_02_560x560.png',
  'Ancient Ruins': '/src/assets/planets/Planets_Tainted_01_560x560.png'
};

export function getPlanetImage(type: string) {
  return (
    planetImageMap[type] || '/src/assets/planets/Planets_Rocky_01_560x560.png'
  );
}
