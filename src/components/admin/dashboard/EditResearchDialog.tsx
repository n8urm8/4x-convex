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
import { Doc } from '@cvx/_generated/dataModel';
import { RESEARCH_CATEGORIES } from '@cvx/game/research/research.schema';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Define the form schema using Zod, based on researchDefinitionSchema
const researchCategoriesList = [
  RESEARCH_CATEGORIES.STRUCTURES,
  RESEARCH_CATEGORIES.SHIPS,
  RESEARCH_CATEGORIES.WEAPONS,
  RESEARCH_CATEGORIES.DEFENSE,
] as const;

const researchFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tier: z.coerce.number().int().min(1, 'Tier must be at least 1'),
  category: z.enum(researchCategoriesList),
  primaryEffect: z.string().min(1, 'Primary effect is required'),
  unlocks: z.string().optional(), // Form handles string, transform in onSubmit
  description: z.string().optional(),
});

type ResearchFormValues = z.infer<typeof researchFormSchema>;

interface EditResearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  researchDefinition: Doc<'researchDefinitions'> | null;
}

export function EditResearchDialog({ isOpen, onOpenChange, researchDefinition }: EditResearchDialogProps) {
  const updateResearch = useMutation(api.game.research.researchMutations.updateResearchDefinition);

  const form = useForm<ResearchFormValues>({
    resolver: zodResolver(researchFormSchema),
    defaultValues: {
      name: '',
      tier: 1,
      category: RESEARCH_CATEGORIES.STRUCTURES,
      primaryEffect: '',
      unlocks: '', // Form handles string
      description: '',
    },
  });

  useEffect(() => {
    if (researchDefinition) {
      form.reset({
        name: researchDefinition.name,
        tier: researchDefinition.tier,
        category: researchDefinition.category,
        primaryEffect: researchDefinition.primaryEffect,
        unlocks: researchDefinition.unlocks?.join(', ') || '',
        description: researchDefinition.description || '',
      });
    }
  }, [researchDefinition, form, isOpen]); // Added isOpen to reset form when dialog re-opens

  async function onSubmit(values: ResearchFormValues) {
    if (!researchDefinition) return;

    try {
      const processedUnlocks = (values.unlocks && values.unlocks.trim() !== '')
        ? values.unlocks.split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined;

      const mutationArgs = {
        id: researchDefinition._id,
        updates: {
          name: values.name,
          tier: values.tier,
          category: values.category,
          primaryEffect: values.primaryEffect,
          unlocks: processedUnlocks,
          description: values.description,
        }
      };

      await updateResearch(mutationArgs);
      toast.success('Research definition updated successfully!');
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to update research: ${errorMessage}`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Research Definition</DialogTitle>
          <DialogDescription>
            Update the details for the research technology. Make sure to save your changes.
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
                    <Input placeholder="e.g., Advanced Plating" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1" {...field} />
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
                      {Object.values(RESEARCH_CATEGORIES).map((category) => (
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
              name="primaryEffect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Effect</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., +10% Armor HP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unlocks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unlocks (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hab Dome, Scout Ship" {...field} />
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
                    <Textarea placeholder="Optional: A brief description of the technology." {...field} />
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
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
