import { Id } from '@cvx/_generated/dataModel';

export type ResearchPipelineEntry =
  | {
      entryType: 'active';
      researchDefinitionId: Id<'researchDefinitions'>;
      label: string;
      researchFinishesAt: number;
      durationMs: number;
    }
  | {
      entryType: 'queued';
      queueId: Id<'playerResearchQueue'>;
      researchDefinitionId: Id<'researchDefinitions'>;
      label: string;
      queuedAt: number;
      durationMs: number;
    };
