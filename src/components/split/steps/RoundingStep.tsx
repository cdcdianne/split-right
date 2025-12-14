import { motion } from 'framer-motion';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { calculateFinalShares, calculateTotal, formatCurrency } from '@/lib/calculations';
import { SplitData } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROUNDING_OPTIONS: { value: SplitData['roundingMode']; label: string; description: string }[] = [
  { value: 'exact', label: 'Exact', description: 'Keep decimal precision' },
  { value: 'whole', label: 'Nearest 1', description: 'Round to whole numbers' },
  { value: 'five', label: 'Nearest 5', description: 'Round to nearest 5' },
  { value: 'ten', label: 'Nearest 10', description: 'Round to nearest 10' },
];

export function RoundingStep() {
  const { data, setRoundingMode, setCurrentStep } = useSplit();

  const shares = calculateFinalShares(data);
  const total = calculateTotal(data);
  const sharesTotal = Array.from(shares.values()).reduce((sum, v) => sum + v, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Rounding</h2>
        <p className="text-muted-foreground text-sm sm:text-base">How should we round the amounts?</p>
      </div>

      {/* Rounding Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {ROUNDING_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setRoundingMode(option.value)}
            className={cn(
              'p-4 sm:p-5 rounded-xl border-2 transition-all text-left hover:shadow-soft',
              data.roundingMode === option.value
                ? 'border-primary bg-primary/10 shadow-glow'
                : 'border-border bg-card hover:border-primary/30'
            )}
          >
            <p className="font-semibold text-base sm:text-lg">{option.label}</p>
            <p className="text-sm sm:text-base text-muted-foreground">{option.description}</p>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <div className="space-y-2">
          {data.people.map(person => {
            const share = shares.get(person.id) || 0;
            return (
              <div
                key={person.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-soft"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: person.color, color: 'white' }}
                >
                  {person.name[0]}
                </div>
                <span className="flex-1 font-medium">{person.name}</span>
                <span className="font-semibold">{formatCurrency(share, data.currency)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Check */}
      <div className="p-4 rounded-xl bg-secondary text-center">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Receipt total:</span>
          <span className="font-semibold">{formatCurrency(total, data.currency)}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-muted-foreground">Split total:</span>
          <span className={cn(
            'font-semibold',
            Math.abs(sharesTotal - total) > 1 ? 'text-destructive' : 'text-success'
          )}>
            {formatCurrency(sharesTotal, data.currency)}
          </span>
        </div>
        {Math.abs(sharesTotal - total) > 0.01 && Math.abs(sharesTotal - total) <= 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            Small difference due to rounding — last person adjusted to match total
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('tax-tip')} className="flex-1">
          Back
        </Button>
        <Button onClick={() => setCurrentStep('summary')} className="flex-1">
          View Summary
        </Button>
      </div>
    </motion.div>
  );
}
