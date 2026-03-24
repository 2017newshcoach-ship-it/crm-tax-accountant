import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export interface ColorOption {
  value: string;
  label: string;
  class: string;
}

export const COLOR_OPTIONS: ColorOption[] = [
  { value: 'red', label: '빨강색', class: 'bg-red-500' },
  { value: 'pink', label: '분홍색', class: 'bg-pink-500' },
  { value: 'orange', label: '주황색', class: 'bg-orange-500' },
  { value: 'yellow', label: '노란색', class: 'bg-yellow-500' },
  { value: 'teal', label: '민트색', class: 'bg-teal-500' },
  { value: 'green', label: '초록색', class: 'bg-green-600' },
  { value: 'blue', label: '파란색', class: 'bg-blue-500' },
  { value: 'indigo', label: '남색', class: 'bg-indigo-600' },
  { value: 'lavender', label: '라벤더', class: 'bg-purple-400' },
  { value: 'purple', label: '보라색', class: 'bg-purple-600' },
  { value: 'gray', label: '회색', class: 'bg-gray-500' },
  { value: 'slate', label: '청회색', class: 'bg-slate-600' },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:scale-110 transition-transform"
        >
          <div className={`w-4 h-4 rounded-full ${COLOR_OPTIONS.find(c => c.value === value)?.class}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`w-8 h-8 rounded-full ${option.class} border-2 transition-all hover:scale-110 ${
                value === option.value
                  ? 'border-foreground ring-2 ring-offset-2 ring-foreground/20'
                  : 'border-transparent'
              }`}
              title={option.label}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}