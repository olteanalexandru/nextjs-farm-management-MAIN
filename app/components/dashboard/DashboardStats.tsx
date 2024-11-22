interface StatItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          {icon && <div className="mr-3">{icon}</div>}
          <div>
            <div className="text-sm font-medium text-gray-500 truncate">
              {label}
            </div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}
