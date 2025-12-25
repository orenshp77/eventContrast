type Status = 'CREATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'RETURNED';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { label: string; hint: string; className: string }> = {
  CREATED: { label: 'לא נחתם', hint: 'ההסכם נוצר וממתין לשליחה', className: 'bg-red-100 text-red-700' },
  SENT: { label: 'לא נחתם', hint: 'נשלח ללקוח', className: 'bg-red-100 text-red-700' },
  VIEWED: { label: 'לא נחתם', hint: 'הלקוח פתח את הקישור', className: 'bg-red-100 text-red-700' },
  SIGNED: { label: 'נחתם', hint: 'הלקוח חתם על ההסכם', className: 'bg-green-100 text-green-700' },
  RETURNED: { label: 'נחתם', hint: 'המסמך החתום הוחזר', className: 'bg-green-100 text-green-700' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;

  return (
    <div className="flex items-center gap-2">
      <span className={`badge ${config.className}`}>
        {config.label}
      </span>
      <span className="text-xs text-gray-400">{config.hint}</span>
    </div>
  );
}
