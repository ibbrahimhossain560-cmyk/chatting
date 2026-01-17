const MessageSkeleton = () => {
  // Create an array of 6 items for skeleton messages
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
      {skeletonMessages.map((_, idx) => (
        <div 
          key={idx} 
          className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}
          style={{ opacity: 1 - idx * 0.1 }}
        >
          <div className="chat-image avatar">
            <div className="size-8 sm:size-10 rounded-full">
              <div className="skeleton w-full h-full rounded-full skeleton-pulse" />
            </div>
          </div>

          <div className="chat-header mb-1">
            <div className="skeleton h-3 w-16 rounded" />
          </div>

          <div className="chat-bubble bg-transparent p-0">
            <div className={`skeleton rounded-2xl ${
              idx % 3 === 0 ? "h-12 w-[150px] sm:w-[180px]" : 
              idx % 3 === 1 ? "h-16 w-[200px] sm:w-[240px]" : 
              "h-10 w-[120px] sm:w-[160px]"
            }`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
