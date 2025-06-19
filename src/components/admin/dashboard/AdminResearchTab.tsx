import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@cvx/_generated/api';
import { Doc } from '@cvx/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { useState } from 'react';
import { CreateResearchDialog } from '../../../routes/_app/_auth/dashboard/-components/CreateResearchDialog';
import { EditResearchDialog } from '../../../routes/_app/_auth/dashboard/-components/EditResearchDialog';

export function AdminResearchTab() {
  const researchDefinitions = useQuery(api.game.research.researchQueries.listResearchDefinitions);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingResearchDefinition, setEditingResearchDefinition] = useState<Doc<'researchDefinitions'> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingResearchDefinition, setDeletingResearchDefinition] = useState<Doc<'researchDefinitions'> | null>(null);
  const deleteResearchMutation = useMutation(api.game.research.researchMutations.deleteResearchDefinition);

  const handleDeleteConfirm = async () => {
    if (!deletingResearchDefinition) return;
    try {
      await deleteResearchMutation({ id: deletingResearchDefinition._id });
      toast.success(`Research '${deletingResearchDefinition.name}' deleted successfully!`);
      setDeletingResearchDefinition(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to delete research: ${errorMessage}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Research Definitions</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Research</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Primary Effect</TableHead>
              <TableHead>Unlocks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {researchDefinitions?.map((def: Doc<'researchDefinitions'>) => (
              <TableRow key={def._id}>
                <TableCell>{def.name}</TableCell>
                <TableCell>{def.tier}</TableCell>
                <TableCell>{def.category}</TableCell>
                <TableCell>{def.primaryEffect}</TableCell>
                <TableCell>{def.unlocks?.join(', ')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setEditingResearchDefinition(def); setIsEditDialogOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setDeletingResearchDefinition(def); setIsDeleteDialogOpen(true); }}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CreateResearchDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <EditResearchDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} researchDefinition={editingResearchDefinition} />
      {deletingResearchDefinition && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the research definition for "<strong>{deletingResearchDefinition.name}</strong>".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingResearchDefinition(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Toaster />
    </div>
  );
}
