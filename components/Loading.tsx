interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function Loading({ 
  message = "Loading...", 
  size = 'md', 
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? "flex justify-center items-center h-screen bg-gray-50"
    : "flex justify-center items-center py-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]} mx-auto mb-4`}></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}
