import { motion } from 'framer-motion';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { calculateFinalShares, calculateTotal, calculatePersonSubtotal, calculateTip, formatCurrency } from '@/lib/calculations';

export function SummaryStep() {
  const { data, setCurrentStep } = useSplit();

  const shares = calculateFinalShares(data);
  const total = calculateTotal(data);
  const itemsSubtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0) || 1;
  const tipAmount = calculateTip(itemsSubtotal, data.tipType, data.tipValue);
  const peopleCount = data.people.length || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Summary</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Here's what everyone owes</p>
      </div>

      {/* Person Summaries */}
      <div className="space-y-4">
        {data.people.map((person, index) => {
          const share = shares.get(person.id) || 0;
          const subtotal = calculatePersonSubtotal(person.id, data.items);
          const personItems = data.items.filter(i => i.assignedTo.includes(person.id));

          return (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 sm:p-6 rounded-2xl bg-card shadow-medium"
            >
              <div className="flex items-center gap-4 sm:gap-5 mb-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shrink-0"
                  style={{ backgroundColor: person.color, color: 'white' }}
                >
                  {person.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg sm:text-xl truncate">{person.name}</p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {personItems.length} item{personItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: person.color }}>
                    {formatCurrency(share, data.currency)}
                  </p>
                </div>
              </div>

              {/* Item Details (collapsed) */}
              <details className="group">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-2">
                  <span className="text-xs bg-secondary px-2 py-1 rounded">
                    Show details
                  </span>
                </summary>
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {personItems.map(item => {
                    const splitCount = item.assignedTo.length;
                    const itemShare = (item.price * item.quantity) / splitCount;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.name}
                          {splitCount > 1 && ` (÷${splitCount})`}
                        </span>
                        <span>{formatCurrency(itemShare, data.currency)}</span>
                      </div>
                    );
                  })}
                  {(data.tax > 0 || data.tipValue > 0) && (
                    <>
                      <div className="border-t border-border pt-2 mt-2"></div>
                      {data.tax > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tax share</span>
                          <span>
                            {formatCurrency(
                              data.taxTipSplitMode === 'equal'
                                ? data.tax / peopleCount
                                : (data.tax * subtotal) / itemsSubtotal,
                              data.currency
                            )}
                          </span>
                        </div>
                      )}
                      {data.tipValue > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tip share</span>
                          <span>
                            {formatCurrency(
                              data.taxTipSplitMode === 'equal'
                                ? tipAmount / peopleCount
                                : (tipAmount * subtotal) / itemsSubtotal,
                              data.currency
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>
            </motion.div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="p-4 sm:p-6 rounded-xl gradient-primary text-primary-foreground text-center">
        <p className="text-sm sm:text-base opacity-90">Total</p>
        <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(total, data.currency)}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setCurrentStep('rounding')} className="flex-1">
          Back
        </Button>
        <Button onClick={() => setCurrentStep('share')} className="flex-1" variant="accent">
          Share Results
        </Button>
      </div>
    </motion.div>
  );
}
