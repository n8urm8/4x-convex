// src/lib/planet-images.ts

const planetImageMap: Record<string, string[]> = {
  Furnace: [
    '/src/assets/planets/Planet_Furnace_01_560x560.png',
    '/src/assets/planets/Planet_Furnace_02_560x560.png'
  ],
  Desert: [
    '/src/assets/planets/Planets_Desert_01_560x560.png',
    '/src/assets/planets/Planets_Desert_02_560x560.png'
  ],
  Grave: [
    '/src/assets/planets/Planets_Grave_01_560x560.png',
    '/src/assets/planets/Planets_Grave_02_560x560.png'
  ],
  Ice: [
    '/src/assets/planets/Planets_Ice_01_560x560.png',
    '/src/assets/planets/Planets_Ice_02_560x560.png'
  ],
  Jovian: [
    '/src/assets/planets/Planets_Jovian_01_560x560.png',
    '/src/assets/planets/Planets_Jovian_02_560x560.png'
  ],
  Jungle: [
    '/src/assets/planets/Planets_Jungle1_560x560.png',
    '/src/assets/planets/Planets_Jungle2_560x560.png'
  ],
  Ocean: [
    '/src/assets/planets/Planets_Ocean_01_560x560.png',
    '/src/assets/planets/Planets_Ocean_02_560x560.png'
  ],
  Rocky: [
    '/src/assets/planets/Planets_Rocky_01_560x560.png',
    '/src/assets/planets/Planets_Rocky_02_560x560.png'
  ],
  Shattered: [
    '/src/assets/planets/Planets_Shattered_01_560x560.png',
    '/src/assets/planets/Planets_Shattered_02_560x560.png'
  ],
  Tainted: [
    '/src/assets/planets/Planets_Tainted_01_560x560.png',
    '/src/assets/planets/Planets_Tainted_02_560x560.png'
  ],
  Vital: ['/src/assets/planets/Planets_Vital_01_560x560.png']
};

export function getPlanetImage(type: string, seed: number) {
  const images = planetImageMap[type];
  if (!images) {
    // Return a default or placeholder image if type is unknown
    return '/src/assets/planets/Planets_Rocky_01_560x560.png';
  }

  // Use a seed to get a consistent random image
  const index = seed % images.length;
  return images[index];
}
