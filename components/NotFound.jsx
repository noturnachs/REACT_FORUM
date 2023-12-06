import React from "react";

const NotFound = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-dark">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white">Page Not Found</h2>
        <p className="text-white mt-4">
          The page you are looking for doesn't exist.
        </p>
        <a href="/" className="btn btn-primary mt-6">
          Go Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
