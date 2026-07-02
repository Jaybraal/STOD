export const PatientListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);

export const PatientDetailSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

export const AppointmentListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);

export const TreatmentPlanSkeleton = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="grid grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
    ))}
  </div>
);
