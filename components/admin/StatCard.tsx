interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1a`, color }}>
        <i className={`${icon} text-2xl`}></i>
      </div>
      <div>
        <div className="text-3xl font-bold text-neutral-900 leading-none">{value}</div>
        <div className="text-sm text-neutral-500 mt-1">{label}</div>
      </div>
    </div>
  );
}