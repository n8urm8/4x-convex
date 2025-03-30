import { DatabaseWriter } from '../_generated/server';

// Planet type seed data
export const planetTypesSeedData = [
  {
    name: 'Scorched World',
    category: 'Inner System',
    habitable: true,
    space: 1.8,
    energy: 1.4,
    minerals: 0.2,
    volatiles: 0,
    description: 'Heat-resistant mining operations yield bonus minerals'
  },
  {
    name: 'Greenhouse World',
    category: 'Inner System',
    habitable: true,
    space: 1.5,
    energy: 1,
    minerals: 1,
    volatiles: 0,
    description: 'Atmospheric processing yields unique chemical compounds'
  },
  {
    name: 'Temperate World',
    category: 'Inner System',
    habitable: true,
    space: 1,
    energy: 1,
    minerals: 1.3,
    volatiles: 0,
    description: 'Ideal for population growth and food production'
  },
  {
    name: 'Arid World',
    category: 'Inner System',
    habitable: true,
    space: 0.8,
    energy: 1.2,
    minerals: 0.6,
    volatiles: 0,
    description: 'Easier excavation for underground complexes'
  },
  {
    name: 'Gas Giant',
    category: 'Outer System',
    habitable: true,
    space: 0.6,
    energy: 0.5,
    minerals: 1.8,
    volatiles: 0,
    description: 'Gas extraction operations yield rare exotic gases'
  },
  {
    name: 'Ice Giant',
    category: 'Outer System',
    habitable: false,
    space: 0.4,
    energy: 0.7,
    minerals: 1.7,
    volatiles: 0,
    description: 'Mining asteroids provides Nova'
  },
  {
    name: 'Asteroid',
    category: 'Utility',
    habitable: true,
    space: 0.5,
    energy: 1.7,
    minerals: 0.6,
    volatiles: 0,
    description: 'Mining efficiency bonuses, zero-g manufacturing benefits'
  },
  {
    name: 'Ocean World',
    category: 'Exotic',
    habitable: true,
    space: 1,
    energy: 0.7,
    minerals: 1.9,
    volatiles: 0,
    description: 'Unique aquatic resources, biotechnology advantages'
  },
  {
    name: 'Volcanic World',
    category: 'Exotic',
    habitable: true,
    space: 1.4,
    energy: 1.8,
    minerals: 0.9,
    volatiles: 0,
    description: 'Geothermal energy production bonuses, unique minerals'
  },
  {
    name: 'Frozen World',
    category: 'Exotic',
    habitable: true,
    space: 0.3,
    energy: 1,
    minerals: 1.5,
    volatiles: 0,
    description: 'Cryonic research benefits, preservation capabilities'
  },
  {
    name: 'Ringed Planet',
    category: 'Exotic',
    habitable: true,
    space: 1,
    energy: 1.3,
    minerals: 1.2,
    volatiles: 0,
    description: 'Orbital mining operations, unique ring resources'
  },
  {
    name: 'Pulsar Planet',
    category: 'Exotic',
    habitable: true,
    space: 2.5,
    energy: 1.4,
    minerals: 0.3,
    volatiles: 0,
    description: 'Extreme energy generation, but requires substantial shielding'
  },
  {
    name: 'Binary Star Planet',
    category: 'Exotic',
    habitable: true,
    space: 1.5,
    energy: 1,
    minerals: 0.8,
    volatiles: 0,
    description: 'Complex day/night cycles, variable energy production'
  },
  {
    name: 'Rogue Planet',
    category: 'Exotic',
    habitable: true,
    space: 0.1,
    energy: 1.2,
    minerals: 1.4,
    volatiles: 0,
    description:
      'Advanced geothermal and nuclear power required, unique preserved compounds'
  },
  {
    name: 'Wormhole',
    category: 'Special',
    habitable: false,
    space: 0,
    energy: 0,
    minerals: 0,
    volatiles: 0,
    description: 'Provides fast travel to other wormholes'
  },
  {
    name: 'Ancient Ruins',
    category: 'Special',
    habitable: false,
    space: 0,
    energy: 0,
    minerals: 0,
    volatiles: 0,
    description: 'Provides unique research bonus for occupying faction'
  }
];

export async function seedPlanetTypes(db: DatabaseWriter) {
  // Check if we've already seeded the planet types
  const existingPlanets = await db.query('planetTypes').collect();
  if (existingPlanets.length > 0) {
    console.log('Planet types already seeded.');
    return;
  }

  // Inner System Planets
  await db.insert('planetTypes', {
    name: 'Scorched World',
    category: 'Inner System',
    habitable: true,
    space: 1.8,
    energy: 1.4,
    minerals: 0.2,
    volatiles: 0,
    description: 'Heat-resistant mining operations yield bonus minerals'
  });

  await db.insert('planetTypes', {
    name: 'Greenhouse World',
    category: 'Inner System',
    habitable: true,
    space: 1.5,
    energy: 1,
    minerals: 1,
    volatiles: 0,
    description: 'Atmospheric processing yields unique chemical compounds'
  });

  await db.insert('planetTypes', {
    name: 'Temperate World',
    category: 'Inner System',
    habitable: true,
    space: 1,
    energy: 1,
    minerals: 1.3,
    volatiles: 0,
    description: 'Ideal for population growth and food production'
  });

  await db.insert('planetTypes', {
    name: 'Arid World',
    category: 'Inner System',
    habitable: true,
    space: 0.8,
    energy: 1.2,
    minerals: 0.6,
    volatiles: 0,
    description: 'Easier excavation for underground complexes'
  });

  // Outer System Planets
  await db.insert('planetTypes', {
    name: 'Gas Giant',
    category: 'Outer System',
    habitable: true,
    space: 0.6,
    energy: 0.5,
    minerals: 1.8,
    volatiles: 0,
    description: 'Gas extraction operations yield rare exotic gases'
  });

  await db.insert('planetTypes', {
    name: 'Ice Giant',
    category: 'Outer System',
    habitable: false,
    space: 0.4,
    energy: 0.7,
    minerals: 1.7,
    volatiles: 0,
    description: 'Mining asteroids provides Nova'
  });

  // Dwarf Planet/Asteroid Belt
  await db.insert('planetTypes', {
    name: 'Asteroid',
    category: 'Utility',
    habitable: true,
    space: 0.5,
    energy: 1.7,
    minerals: 0.6,
    volatiles: 0,
    description: 'Mining efficiency bonuses, zero-g manufacturing benefits'
  });

  // Exotic Planet Types
  await db.insert('planetTypes', {
    name: 'Ocean World',
    category: 'Exotic',
    habitable: true,
    space: 1,
    energy: 0.7,
    minerals: 1.9,
    volatiles: 0,
    description: 'Unique aquatic resources, biotechnology advantages'
  });

  await db.insert('planetTypes', {
    name: 'Volcanic World',
    category: 'Exotic',
    habitable: true,
    space: 1.4,
    energy: 1.8,
    minerals: 0.9,
    volatiles: 0,
    description: 'Geothermal energy production bonuses, unique minerals'
  });

  await db.insert('planetTypes', {
    name: 'Frozen World',
    category: 'Exotic',
    habitable: true,
    space: 0.3,
    energy: 1,
    minerals: 1.5,
    volatiles: 0,
    description: 'Cryonic research benefits, preservation capabilities'
  });

  await db.insert('planetTypes', {
    name: 'Ringed Planet',
    category: 'Exotic',
    habitable: true,
    space: 1,
    energy: 1.3,
    minerals: 1.2,
    volatiles: 0,
    description: 'Orbital mining operations, unique ring resources'
  });

  await db.insert('planetTypes', {
    name: 'Pulsar Planet',
    category: 'Exotic',
    habitable: true,
    space: 2.5,
    energy: 1.4,
    minerals: 0.3,
    volatiles: 0,
    description: 'Extreme energy generation, but requires substantial shielding'
  });

  await db.insert('planetTypes', {
    name: 'Binary Star Planet',
    category: 'Exotic',
    habitable: true,
    space: 1.5,
    energy: 1,
    minerals: 0.8,
    volatiles: 0,
    description: 'Complex day/night cycles, variable energy production'
  });

  await db.insert('planetTypes', {
    name: 'Rogue Planet',
    category: 'Exotic',
    habitable: true,
    space: 0.1,
    energy: 1.2,
    minerals: 1.4,
    volatiles: 0,
    description:
      'Advanced geothermal and nuclear power required, unique preserved compounds'
  });

  await db.insert('planetTypes', {
    name: 'Wormhole',
    category: 'Special',
    habitable: false,
    space: 0,
    energy: 0,
    minerals: 0,
    volatiles: 0,
    description: 'Provides fast travel to other wormholes'
  });

  await db.insert('planetTypes', {
    name: 'Ancient Ruins',
    category: 'Special',
    habitable: false,
    space: 0,
    energy: 0,
    minerals: 0,
    volatiles: 0,
    description: 'Provides unique research bonus for occupying faction'
  }),
    console.log('Planet types seeded successfully!');
}
