import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useSplit } from '@/context/SplitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PersonChip } from '../PersonChip';

export function PeopleStep() {
  const { data, addPerson, updatePerson, removePerson, setCurrentStep } = useSplit();
  const [newName, setNewName] = useState('');

  const handleAddPerson = () => {
    if (newName.trim()) {
      addPerson(newName.trim());
      setNewName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPerson();
    }
  };

  const canProceed = data.people.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Who's splitting?</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Add everyone who's sharing this bill</p>
      </div>

      <div className="flex gap-3">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter name"
          className="flex-1"
        />
        <Button onClick={handleAddPerson} disabled={!newName.trim()}>
          <UserPlus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {data.people.map(person => (
            <PersonChip
              key={person.id}
              person={person}
              onUpdate={name => updatePerson(person.id, name)}
              onRemove={() => removePerson(person.id)}
            />
          ))}
        </AnimatePresence>

        {data.people.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            Add at least 2 people to start splitting
          </motion.div>
        )}
      </div>

      <div className="pt-4">
        <Button
          onClick={() => setCurrentStep('items')}
          disabled={!canProceed}
          size="lg"
          className="w-full"
        >
          Continue to Items
        </Button>
        {!canProceed && data.people.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            Add at least one more person
          </p>
        )}
      </div>
    </motion.div>
  );
}
