import { Doc } from '@cvx/_generated/dataModel';

export type StructureWithDefinition = Doc<'baseStructures'> & {
  definition: Doc<'structureDefinitions'> | null;
};

export type BaseDetails = Doc<'playerBases'> & {
  structures: StructureWithDefinition[];
};
