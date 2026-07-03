import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick?: () => void };
}

/**
 * EmptyState — 목록이 비었을 때 표시.
 * "왜 비었는지 + 뭘 하면 되는지"를 알려줘 막막하지 않게.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
    {icon && <div className="mb-3 text-gray-300">{icon}</div>}
    <p className="text-base font-bold text-gray-700">{title}</p>
    {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-4 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white active:scale-95"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
