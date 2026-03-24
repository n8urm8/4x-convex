import { Doc, Id } from '@cvx/_generated/dataModel';

export type StructureWithDefinition = Doc<'baseStructures'> & {
  definition: Doc<'structureDefinitions'> | null;
};

export type StructureBuildQueueItem = {
  _id: Id<'baseStructureBuildQueue'>;
  kind: 'build' | 'upgrade';
  queuedAt: number;
  label: string;
};

export type BaseDetails = Doc<'playerBases'> & {
  structures: StructureWithDefinition[];
  structureBuildQueue?: StructureBuildQueueItem[];
  /** Count of bases owned by this base’s owner (for empire-wide nova bonus). */
  empireBaseCount?: number;
};
