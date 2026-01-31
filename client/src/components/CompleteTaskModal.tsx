import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2 } from "lucide-react";
import type { Task } from "@/types/dashboard";

const completeTaskSchema = z.object({
  completionDate: z.string().min(1, "Completion date is required"),
  cost: z.string().optional(),
  serviceProvider: z.string().optional(),
  partsReplaced: z.string().optional(),
  notes: z.string().optional(),
});

type CompleteTaskFormData = z.infer<typeof completeTaskSchema>;

interface CompleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: number, data: CompleteTaskFormData) => void;
  isSubmitting: boolean;
}

const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return "Not scheduled";
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? "Invalid date"
    : date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
};

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function CompleteTaskModal({
  task,
  isOpen,
  onClose,
  onComplete,
  isSubmitting
}: CompleteTaskModalProps) {
  const form = useForm<CompleteTaskFormData>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      completionDate: getTodayDate(),
      cost: "",
      serviceProvider: "",
      partsReplaced: "",
      notes: "",
    },
  });

  const handleSubmit = (data: CompleteTaskFormData) => {
    if (task) {
      onComplete(task.id, data);
    }
  };

  const handleClose = () => {
    form.reset({
      completionDate: getTodayDate(),
      cost: "",
      serviceProvider: "",
      partsReplaced: "",
      notes: "",
    });
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Complete Task
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Record the details of your completed maintenance task
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-4">
          {/* Section 1: Task Information (Read-Only) */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Task Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Details about the maintenance task
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Task Name
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-gray-100" data-testid="text-task-name">
                    {task.taskName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                      Due Date:
                    </span>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100" data-testid="text-due-date">
                      {formatDisplayDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Completion Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completion Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Record when and how the task was completed
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div>
                <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Completion Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  {...form.register("completionDate")}
                  className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="input-completion-date"
                />
                {form.formState.errors.completionDate && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.completionDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Service Information */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Service Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Track costs and service provider details
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost */}
                <div>
                  <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Cost ($)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("cost")}
                    placeholder="0.00"
                    className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="input-cost"
                  />
                </div>

                {/* Service Provider */}
                <div>
                  <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Service Provider (if any)
                  </Label>
                  <Input
                    type="text"
                    {...form.register("serviceProvider")}
                    placeholder="e.g., ABC Plumbing"
                    className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    data-testid="input-service-provider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Maintenance Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Record parts replaced and additional notes
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-6">
              {/* Parts Replaced */}
              <div>
                <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Parts Replaced
                </Label>
                <Input
                  type="text"
                  {...form.register("partsReplaced")}
                  placeholder="e.g., HVAC filter 20x25x1"
                  className="w-full h-12 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="input-parts-replaced"
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes
                </Label>
                <Textarea
                  {...form.register("notes")}
                  rows={4}
                  placeholder="Any additional notes about the maintenance performed..."
                  className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  data-testid="input-notes"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-cancel-complete"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-confirm-complete"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                "Mark Complete"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
