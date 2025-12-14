import { motion } from 'framer-motion';
import { X, Pencil, Check } from 'lucide-react';
import { useState } from 'react';
import { Person } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface PersonChipProps {
  person: Person;
  onUpdate?: (name: string) => void;
  onRemove?: () => void;
  selected?: boolean;
  onClick?: () => void;
  showControls?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function PersonChip({
  person,
  onUpdate,
  onRemove,
  selected = false,
  onClick,
  showControls = true,
}: PersonChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);

  const handleSave = () => {
    if (editName.trim() && onUpdate) {
      onUpdate(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl bg-card shadow-soft border-2 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-medium',
        selected ? 'border-primary' : 'border-transparent'
      )}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: person.color, color: 'white' }}
      >
        {getInitials(person.name)}
      </div>

      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="h-8 text-sm"
            autoFocus
          />
          <button
            onClick={e => {
              e.stopPropagation();
              handleSave();
            }}
            className="p-1.5 rounded-full bg-success text-success-foreground"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="font-medium flex-1 truncate">{person.name}</span>
          {showControls && (
            <div className="flex items-center gap-1">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setEditName(person.name);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
              >
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
