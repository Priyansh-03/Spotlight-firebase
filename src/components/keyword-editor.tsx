'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KeywordEditorProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}

export function KeywordEditor({ keywords = [], onChange, placeholder = "Add new keyword..." }: KeywordEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);

  const addKeyword = () => {
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      onChange([...keywords, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeKeyword = (indexToRemove: number) => {
    onChange(keywords.filter((_, index) => index !== indexToRemove));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(keywords[index]);
  };

  const finishEditing = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const updatedKeywords = [...keywords];
      updatedKeywords[editingIndex] = editingValue.trim();
      onChange(updatedKeywords);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing();
    }
     if (e.key === 'Escape') {
      e.preventDefault();
      setEditingIndex(null);
      setEditingValue('');
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
        {keywords.map((keyword, index) =>
          editingIndex === index ? (
            <Input
              key={index}
              ref={editInputRef}
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleEditInputKeyDown}
              className="h-7 text-sm flex-grow"
              style={{ minWidth: '100px' }}
            />
          ) : (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1.5 py-1 px-3 cursor-pointer hover:bg-secondary/80"
              onClick={() => startEditing(index)}
            >
              <span className="text-sm">{keyword}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering onClick of the badge
                  removeKeyword(index);
                }}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Remove ${keyword}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          )
        )}
        <div className="flex-grow flex items-center">
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={keywords.length === 0 ? "Add keywords..." : ""}
                className="border-none h-7 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm flex-grow"
            />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
         <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addKeyword}
          className="text-xs"
          disabled={!inputValue.trim()}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Keyword
        </Button>
      </div>
    </div>
  );
}
