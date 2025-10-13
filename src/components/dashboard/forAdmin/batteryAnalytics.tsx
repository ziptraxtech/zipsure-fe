const BatteryAnalytics = () => {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4">
        {/* Gradient overlay */}
        <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold">Battery Analytics</h1>
          </div>
  
          {/* Iframe */}
          <div className="w-full h-[80vh]"> 
            <iframe
              src="https://zipsureai-minidashboard.vercel.app"
              title="Battery Analytics Iframe"
              className="w-full h-full border-0 rounded-lg shadow"
            />
          </div>
        </div>
    );
  };
  
  export default BatteryAnalytics;
  