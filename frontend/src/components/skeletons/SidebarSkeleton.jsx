import { Users, Search } from "lucide-react";

const SidebarSkeleton = () => {
  // Create 6 skeleton items
  const skeletonContacts = Array(6).fill(null);

  return (
    <aside className="h-full w-full md:w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-300 bg-base-100">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-4 lg:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="size-5 text-primary" />
          </div>
          <div className="lg:block">
            <div className="skeleton h-5 w-20 mb-1" />
            <div className="skeleton h-3 w-16" />
          </div>
        </div>

        {/* Search bar skeleton */}
        <div className="mt-4 relative">
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>

        {/* Filters skeleton */}
        <div className="mt-3 flex items-center gap-2">
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-7 w-16 rounded-full" />
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="overflow-y-auto flex-1 py-2">
        {skeletonContacts.map((_, idx) => (
          <div 
            key={idx} 
            className="w-full p-3 lg:p-4 flex items-center gap-3 border-l-4 border-transparent"
            style={{ opacity: 1 - idx * 0.1 }}
          >
            {/* Avatar skeleton */}
            <div className="relative flex-shrink-0">
              <div className="skeleton w-12 h-12 lg:w-14 lg:h-14 rounded-full" />
            </div>

            {/* User info skeleton */}
            <div className="flex-1 text-left min-w-0">
              <div className="skeleton h-4 w-28 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
