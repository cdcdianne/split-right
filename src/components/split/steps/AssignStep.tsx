import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Users, Square, CheckSquare2, X } from 'lucide-react';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/calculations';
import { cn } from '@/lib/utils';

export function AssignStep() {
  const { data, assignItem, assignItems, setCurrentStep } = useSplit();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const toggleItemSelection = (itemId: string) => {
    if (!isMultiSelectMode) {
      // Single select mode - just select this item
      setSelectedItemIds(new Set([itemId]));
      setIsMultiSelectMode(false);
      return;
    }

    // Multi-select mode - toggle selection
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (!isMultiSelectMode) {
      // Entering multi-select mode - clear selection, don't auto-select
      setSelectedItemIds(new Set());
    } else {
      // Exiting multi-select mode - keep only first selected if any
      if (selectedItemIds.size > 0) {
        const firstId = Array.from(selectedItemIds)[0];
        setSelectedItemIds(new Set([firstId]));
      }
    }
  };

  const selectedItems = data.items.filter(i => selectedItemIds.has(i.id));
  const primarySelectedItem = selectedItems[0];

  const togglePersonAssignment = (personId: string) => {
    if (selectedItems.length === 0) return;

    if (selectedItems.length === 1) {
      // Single item assignment (existing behavior)
      const item = selectedItems[0];
      const currentAssignments = item.assignedTo;
      const isAssigned = currentAssignments.includes(personId);

      if (isAssigned) {
        assignItem(item.id, currentAssignments.filter(id => id !== personId));
      } else {
        assignItem(item.id, [...currentAssignments, personId]);
      }
    } else {
      // Multiple items - assign to all selected items
      const itemIds = selectedItems.map(i => i.id);
      // Get current assignments from first item as reference
      const firstItem = selectedItems[0];
      const currentAssignments = firstItem.assignedTo;
      const isAssigned = currentAssignments.includes(personId);

      if (isAssigned) {
        // Remove from all selected items
        const newAssignments = currentAssignments.filter(id => id !== personId);
        assignItems(itemIds, newAssignments);
      } else {
        // Add to all selected items
        const newAssignments = [...currentAssignments, personId];
        assignItems(itemIds, newAssignments);
      }
    }
  };

  const assignSelectedToAll = () => {
    if (selectedItems.length === 0) return;
    const itemIds = selectedItems.map(i => i.id);
    assignItems(itemIds, data.people.map(p => p.id));
    // Clear selection after assigning
    setSelectedItemIds(new Set());
  };

  const clearSelectedAssignments = () => {
    if (selectedItems.length === 0) return;
    const itemIds = selectedItems.map(i => i.id);
    assignItems(itemIds, []);
  };

  const unassignedCount = data.items.filter(i => i.assignedTo.length === 0).length;
  const canProceed = unassignedCount === 0;
  const hasMultipleSelected = selectedItems.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Assign items</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {isMultiSelectMode 
            ? `Select multiple items, then assign to people`
            : `Who had what? Select an item, then tap people`}
        </p>
      </div>

      {/* Multi-select toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant={isMultiSelectMode ? "default" : "outline"}
          size="sm"
          onClick={toggleMultiSelectMode}
          className="flex items-center gap-2"
        >
          {isMultiSelectMode ? (
            <>
              <CheckSquare2 className="w-4 h-4" />
              Multi-select ({selectedItemIds.size})
            </>
          ) : (
            <>
              <Square className="w-4 h-4" />
              Multi-select
            </>
          )}
        </Button>
        {hasMultipleSelected && (
          <div className="text-sm text-muted-foreground">
            {selectedItemIds.size} items selected
          </div>
        )}
      </div>

      {/* Item Selector */}
      <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto scrollbar-hide">
        {data.items.map(item => {
          const isSelected = selectedItemIds.has(item.id);
          const isAssigned = item.assignedTo.length > 0;
          const assignedPeople = data.people.filter(p => item.assignedTo.includes(p.id));

          return (
            <motion.button
              key={item.id}
              onClick={() => toggleItemSelection(item.id)}
              className={cn(
                'w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-glow'
                  : isAssigned
                  ? 'border-success/50 bg-success/5'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-soft'
              )}
            >
              {isMultiSelectMode && (
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                  isSelected 
                    ? "border-primary bg-primary" 
                    : "border-border"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(item.price * item.quantity, data.currency)}
                  </span>
                  {assignedPeople.length > 0 && (
                    <div className="flex -space-x-2">
                      {assignedPeople.slice(0, 3).map(person => (
                        <div
                          key={person.id}
                          className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: person.color, color: 'white' }}
                        >
                          {person.name[0]}
                        </div>
                      ))}
                      {assignedPeople.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-bold">
                          +{assignedPeople.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isAssigned && !isMultiSelectMode && (
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-4 h-4 text-success-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Person Assignment */}
      <AnimatePresence mode="wait">
        {primarySelectedItem && (
          <motion.div
            key={primarySelectedItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {hasMultipleSelected 
                  ? `Assign ${selectedItems.length} items to:`
                  : `Assign "${primarySelectedItem.name}" to:`}
              </p>
              <div className="flex gap-2">
                {(primarySelectedItem.assignedTo.length > 0 || hasMultipleSelected) && (
                  <Button variant="ghost" size="sm" onClick={clearSelectedAssignments}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={assignSelectedToAll}>
                  <Users className="w-4 h-4 mr-1" />
                  Everyone
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {data.people.map(person => {
                // For multiple items, check if person is assigned to the first item
                // For single item, check if person is assigned to that item
                const isAssigned = hasMultipleSelected
                  ? primarySelectedItem.assignedTo.includes(person.id)
                  : primarySelectedItem.assignedTo.includes(person.id);
                
                return (
                  <button
                    key={person.id}
                    onClick={() => togglePersonAssignment(person.id)}
                    className={cn(
                      'flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-soft',
                      isAssigned
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/30'
                    )}
                  >
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shrink-0"
                      style={{ backgroundColor: person.color, color: 'white' }}
                    >
                      {person.name[0]}
                    </div>
                    <span className="font-medium truncate flex-1 text-left text-sm sm:text-base">
                      {person.name}
                    </span>
                    {isAssigned && (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {hasMultipleSelected ? (
              <p className="text-sm text-center text-muted-foreground">
                Changes will apply to all {selectedItems.length} selected items
              </p>
            ) : primarySelectedItem.assignedTo.length > 1 && (
              <p className="text-sm text-center text-muted-foreground">
                Split equally between {primarySelectedItem.assignedTo.length} people
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      {unassignedCount > 0 && (
        <p className="text-center text-sm text-accent font-medium">
          {unassignedCount} item{unassignedCount > 1 ? 's' : ''} still need assignment
        </p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('items')} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep('tax-tip')}
          disabled={!canProceed}
          className="flex-1"
        >
          Add Tax & Tip
        </Button>
      </div>
    </motion.div>
  );
}
