type StatCardProps = {
  label: string;
  value: number;
  sub?: string;
  icon: string;
};

export default function StatCard({ label, value, sub, icon }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 md:p-4">

      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div>
          <p className="text-xl md:text-2xl font-medium text-gray-900 leading-none">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{label}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
          <i className={`ti ${icon} text-teal-700`} aria-hidden="true" />
        </div>
      </div>

      <p className="text-xs text-teal-700 font-medium">{sub}</p>

    </div>
  )
}
