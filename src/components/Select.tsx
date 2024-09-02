interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption[];
  label: string;
}

export const Select = <T extends string>({ 
  value, 
  onChange, 
  options, 
  label 
}: SelectProps<T>) => {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};