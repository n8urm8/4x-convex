import { Doc, Id } from '@cvx/_generated/dataModel';

export type StructureWithDefinition = Doc<'baseStructures'> & {
  definition: Doc<'structureDefinitions'> | null;
};

/** Active job first, then queued rows (FIFO). */
export type BuildPipelineEntry =
  | {
      entryType: 'active';
      structureId: Id<'baseStructures'>;
      kind: 'build' | 'upgrade';
      label: string;
      /** Wall-clock end for in-progress job (remaining = this − now). */
      upgradeCompleteTime?: number;
      /** Full length of this job (same formulas as server mutations). */
      durationMs: number;
    }
  | {
      entryType: 'queued';
      queueId: Id<'baseStructureBuildQueue'>;
      kind: 'build' | 'upgrade';
      queuedAt: number;
      label: string;
      /** Estimated duration when this job starts (current base stats / structure level). */
      durationMs: number;
    };

export type BaseDetails = Doc<'playerBases'> & {
  structures: StructureWithDefinition[];
  buildPipeline?: BuildPipelineEntry[];
  /** Sum of space/energy for queued *build* rows (not yet applied to used*). */
  queuedBuildFootprint?: { space: number; energy: number };
  /** Count of bases owned by this base’s owner (for empire-wide nova bonus). */
  empireBaseCount?: number;
};
