import React from 'react';

const UserCardSkeleton = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-200 mb-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full mr-4"></div>
          <div>
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  );
};

export default UserCardSkeleton;