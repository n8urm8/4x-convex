import { useMutation, useQuery } from 'convex/react';
import { useState, useMemo, useCallback } from 'react';
import { api } from '@cvx/_generated/api';
import { Id } from '@cvx/_generated/dataModel';
import { toast } from 'sonner';
import { DataTable } from '@/components/bases/DataTable';
import { ShowLockedToggle } from '@/components/bases/ShowLockedToggle';
import { BaseDevGameToolbar } from '@/components/bases/BaseDevGameToolbar';
import { DevInstantCompleteButton } from '@/components/bases/DevInstantCompleteButton';
import {
  createResearchColumns,
  type ResearchTechRow,
  type ResearchTableMeta,
} from '@/components/bases/research/researchTableColumns';
import { ResearchQueueCard } from '@/components/bases/research/ResearchQueueCard';

export function BaseResearchTab() {
  const [isResearching, setIsResearching] = useState(false);
  const [showLockedTechs, setShowLockedTechs] = useState(false);

  const playerTechData = useQuery(
    api.game.research.researchQueries.getPlayerTechnologies
  );
  const startResearch = useMutation(
    api.game.research.researchMutations.startResearch
  );
  const completeResearch = useMutation(
    api.game.research.researchMutations.completeResearch
  );
  const instantCompleteResearch = useMutation(
    api.game.research.researchMutations.instantCompleteResearch
  );
  const [instantCompleting, setInstantCompleting] = useState(false);

  const columns = useMemo(() => createResearchColumns(), []);

  const researchPipeline = playerTechData?.researchPipeline ?? [];
  const queuedResearchIds = useMemo(() => {
    const s = new Set<Id<'researchDefinitions'>>();
    for (const e of researchPipeline) {
      if (e.entryType === 'queued') {
        s.add(e.researchDefinitionId);
      }
    }
    return s;
  }, [researchPipeline]);

  const handleResearch = async (researchId: Id<'researchDefinitions'>) => {
    setIsResearching(true);
    try {
      const result = await startResearch({ researchId });
      if (result && 'queued' in result && result.queued) {
        toast.success('Added to research queue.');
      } else {
        toast.success('Research started!');
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsResearching(false);
    }
  };

  const handleCompleteResearch = useCallback(async () => {
    try {
      await completeResearch({});
      toast.success('Research complete!');
    } catch (error) {
      console.error('Failed to complete research:', error);
    }
  }, [completeResearch]);

  const handleInstantCompleteResearch = async () => {
    setInstantCompleting(true);
    try {
      await instantCompleteResearch({});
      toast.success('Research completed.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setInstantCompleting(false);
    }
  };

  if (!playerTechData) {
    return <div>Loading...</div>;
  }

  const { technologies, researchingId } = playerTechData;

  const isCurrentlyResearching =
    researchingId !== null && researchingId !== undefined;

  const canResearchTech = (tech: { tier: number; category: string }) => {
    if (tech.tier === 1) return true;
    const previousTier = tech.tier - 1;
    const previousTierTechs = technologies.filter(
      (t) => t.category === tech.category && t.tier === previousTier
    );
    if (previousTierTechs.length === 0) return true;
    return previousTierTechs.every((t) => t.isResearched);
  };

  const rows: ResearchTechRow[] = technologies.map((tech) => ({
    _id: tech._id,
    name: tech.name,
    description: tech.description,
    tier: tech.tier,
    category: tech.category,
    costs: tech.costs ?? null,
    isResearched: tech.isResearched,
    canResearch: canResearchTech(tech),
  }));

  const filteredRows = showLockedTechs
    ? rows
    : rows.filter(
        (tech) =>
          tech.isResearched ||
          tech.canResearch ||
          researchingId === tech._id ||
          queuedResearchIds.has(tech._id)
      );

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  const meta: ResearchTableMeta = {
    isResearching,
    researchingId,
    queuedResearchIds,
    handleResearch,
    canResearchTech: (tech) => tech.canResearch,
  };

  const toolbar = (
    <ShowLockedToggle
      id="show-locked-research"
      showLocked={showLockedTechs}
      onShowLockedChange={setShowLockedTechs}
      visibleCount={sortedRows.length}
      totalCount={rows.length}
      itemLabel="technologies"
      toggleLabel="Show locked technologies"
    />
  );

  return (
    <div className="space-y-6">
      <BaseDevGameToolbar>
        <DevInstantCompleteButton
          label="Complete research now"
          disabled={!isCurrentlyResearching}
          pending={instantCompleting}
          onClick={handleInstantCompleteResearch}
        />
      </BaseDevGameToolbar>
      <ResearchQueueCard
        pipeline={researchPipeline}
        onActiveResearchComplete={handleCompleteResearch}
      />

      <DataTable<ResearchTechRow>
        columns={columns}
        data={sortedRows}
        getRowId={(row) => row._id}
        meta={{ researchMeta: meta }}
        toolbar={toolbar}
        emptyMessage={
          showLockedTechs
            ? 'No technologies.'
            : 'No technologies available. Turn on "Show locked technologies" to see locked ones.'
        }
      />
    </div>
  );
}
