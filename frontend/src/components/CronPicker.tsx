import React, { useState, useEffect } from 'react';

interface CronPickerProps {
    value: string;
    onChange: (value: string) => void;
}

const PRESETS = [
    { label: 'Weekly (Sunday)', value: 'weekly' },
    { label: 'Daily (Midnight)', value: 'daily' },
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Custom', value: 'custom' }
];

export function CronPicker({ value, onChange }: CronPickerProps) {
    const [mode, setMode] = useState('weekly');
    const [customValue, setCustomValue] = useState('');

    useEffect(() => {
        // Determine initial mode
        const preset = PRESETS.find(p => p.value === value);
        if (preset) {
            setMode(preset.value);
            if (preset.value === 'custom') setCustomValue(value);
        } else {
            setMode('custom');
            setCustomValue(value || '0 0 * * 0');
        }
    }, [value]);

    const handleModeChange = (newMode: string) => {
        setMode(newMode);
        if (newMode !== 'custom') {
            onChange(newMode);
        } else {
            onChange(customValue || '0 0 * * 0');
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomValue(val);
        onChange(val);
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Frequency</label>
            <div className="flex gap-2">
                {PRESETS.map(preset => (
                    <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleModeChange(preset.value)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${mode === preset.value
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {mode === 'custom' && (
                <div className="mt-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={customValue}
                            onChange={handleCustomChange}
                            placeholder="* * * * *"
                            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 font-mono"
                        />
                        <a href="https://crontab.guru/" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                            Help?
                        </a>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Format: minute hour day(month) month day(week)</p>
                </div>
            )}

            {mode !== 'custom' && (
                <p className="text-xs text-slate-500">
                    {mode === 'weekly' && 'Runs every Sunday at 00:00 UTC'}
                    {mode === 'daily' && 'Runs every day at 00:00 UTC'}
                    {mode === '0 * * * *' && 'Runs at minute 0 of every hour'}
                </p>
            )}
        </div>
    );
}
