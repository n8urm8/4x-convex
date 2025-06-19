import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@cvx/_generated/api';
import { STRUCTURE_CATEGORIES } from '@cvx/game/bases/bases.schema';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';

const structureCategoryList = [
  STRUCTURE_CATEGORIES.HABITAT,
  STRUCTURE_CATEGORIES.CONSTRUCTION,
  STRUCTURE_CATEGORIES.PRODUCTION,
  STRUCTURE_CATEGORIES.RESEARCH,
  STRUCTURE_CATEGORIES.ECONOMIC,
  STRUCTURE_CATEGORIES.DEFENSE,
  STRUCTURE_CATEGORIES.UTILITY,
  STRUCTURE_CATEGORIES.SPECIAL,
] as const;

const structureFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  category: z.enum(structureCategoryList),
  description: z.string().min(5, { message: 'Description must be at least 5 characters.' }),
  baseSpaceCost: z.coerce.number().int().min(0, { message: 'Space cost must be non-negative.' }),
  baseEnergyCost: z.coerce.number().int(),
  baseNovaCost: z.coerce.number().int().min(0, { message: 'Nova cost must be non-negative.' }),
  maxLevel: z.coerce.number().int().min(1, { message: 'Max level must be at least 1.' }).optional(),
  effects: z.string().min(2, { message: 'Effects must be at least 2 characters.' }),
  upgradeBenefits: z.string().min(2, { message: 'Upgrade benefits must be at least 2 characters.' }),
  researchRequirementName: z.string().min(2, { message: 'Research requirement must be at least 2 characters.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional(),
});

export type StructureFormValues = z.infer<typeof structureFormSchema>;

interface CreateStructureDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateStructureDialog({ isOpen, onOpenChange }: CreateStructureDialogProps) {
  const createStructure = useMutation(api.game.bases.structureMutations.createStructureDefinition);

  const form = useForm<StructureFormValues>({
    resolver: zodResolver(structureFormSchema),
    defaultValues: {
      name: '',
      category: 'habitat',
      description: '',
      baseSpaceCost: 0,
      baseEnergyCost: 0,
      baseNovaCost: 0,
      effects: '',
      upgradeBenefits: '',
      researchRequirementName: '',
    },
  });

  async function onSubmit(values: StructureFormValues) {
    try {
      await createStructure(values);
      toast.success('Structure definition created successfully!');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to create structure: ${errorMessage}`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Structure Definition</DialogTitle>
          <DialogDescription>
            Fill in the details for the new structure.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Habitation Dome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {structureCategoryList.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseSpaceCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Space Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseEnergyCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Energy Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseNovaCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Nova Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="researchRequirementName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Requirement</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basic Habitation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effects</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., =+10 Space" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="upgradeBenefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upgrade Benefits</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., =+5 Space per level" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the structure." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Structure'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
