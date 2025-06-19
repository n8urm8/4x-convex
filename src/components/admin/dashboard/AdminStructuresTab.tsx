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
import { CreateStructureDialog } from './CreateStructureDialog';
import { EditStructureDialog } from './EditStructureDialog';

export function AdminStructuresTab() {
  const structureDefinitions = useQuery(api.game.bases.structureQueries.listStructureDefinitions);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<Doc<'structureDefinitions'> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStructure, setDeletingStructure] = useState<Doc<'structureDefinitions'> | null>(null);
  const deleteStructureMutation = useMutation(api.game.bases.structureMutations.deleteStructureDefinition);

  const handleDeleteConfirm = async () => {
    if (!deletingStructure) return;
    try {
      await deleteStructureMutation({ id: deletingStructure._id });
      toast.success(`Structure '${deletingStructure.name}' deleted successfully!`);
      setDeletingStructure(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to delete structure: ${errorMessage}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Structure Definitions</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Structure</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Space Cost</TableHead>
              <TableHead>Energy Cost</TableHead>
              <TableHead>Nova Cost</TableHead>
              <TableHead>Requires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {structureDefinitions?.map((def: Doc<'structureDefinitions'>) => (
              <TableRow key={def._id}>
                <TableCell>{def.name}</TableCell>
                <TableCell>{def.category}</TableCell>
                <TableCell>{def.baseSpaceCost}</TableCell>
                <TableCell>{def.baseEnergyCost}</TableCell>
                <TableCell>{def.baseNovaCost}</TableCell>
                <TableCell>{def.researchRequirementName}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setEditingStructure(def); setIsEditDialogOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setDeletingStructure(def); setIsDeleteDialogOpen(true); }}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CreateStructureDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <EditStructureDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} structureDefinition={editingStructure} />
      {deletingStructure && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the structure definition for "<strong>{deletingStructure.name}</strong>".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingStructure(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Toaster />
    </div>
  );
}
