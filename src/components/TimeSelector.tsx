import React, { useState } from 'react';
import './TimeSelector.css';

interface TimeSelectorProps {
  onTimeChange?: (minutes: number) => void;
  defaultValue?: number;
  className?: string;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  onTimeChange,
  defaultValue = 5,
  className = '',
}) => {
  const [activeTime, setActiveTime] = useState<number>(defaultValue);

  const timeOptions = [
    { label: '1m', value: 1 },
    { label: '5m', value: 5 },
    { label: '15m', value: 15 },
    { label: '1h', value: 60 },
  ];

  const handleTimeChange = (minutes: number) => {
    setActiveTime(minutes);
    if (onTimeChange) {
      onTimeChange(minutes);
    }
  };

  return (
    <div className={`time-selector-container ${className}`}>
      {timeOptions.map((option) => (
        <button
          key={option.value}
          className={`time-btn ${
            activeTime === option.value ? 'time-btn-active' : 'time-btn-inactive'
          }`}
          onClick={() => handleTimeChange(option.value)}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TimeSelector; 