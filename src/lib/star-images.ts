// src/lib/star-images.ts

const starImageMap: Record<string, string> = {
  'Yellow Dwarf': '/src/assets/stars/star_yellow01.png',
  'Red Dwarf': '/src/assets/stars/star_red01.png',
  'Blue Giant': '/src/assets/stars/star_blue01.png',
  'White Dwarf': '/src/assets/stars/star_white01.png',
  'Neutron Star': '/src/assets/stars/star_white01.png', // Using white as a fallback
  'Red Giant': '/src/assets/stars/star_orange01.png',
  'Binary System': '/src/assets/stars/star_yellow01.png' // Using yellow as a fallback
};

export function getStarImage(type: string | undefined) {
  if (!type || !starImageMap[type]) {
    // Return a default star image if type is unknown or undefined
    return '/src/assets/stars/star_yellow01.png';
  }
  return starImageMap[type];
}
