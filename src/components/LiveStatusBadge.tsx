interface LiveStatusBadgeProps {
  isLive: boolean;
}

const LiveStatusBadge = ({ isLive }: LiveStatusBadgeProps) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap";

  if (isLive) {
    return (
      <div
        className={`${baseClasses} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
        <span className="hidden sm:inline">Direct en cours</span>
        <span className="sm:hidden">Direct</span>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gray-200" />
      </span>
      <span className="hidden sm:inline">Pas de direct</span>
      <span className="sm:hidden">Off</span>
    </div>
  );
};

export default LiveStatusBadge;

