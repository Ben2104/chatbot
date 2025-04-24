// File: src/components/Banner.jsx
export function Banner({ title, description }) {
    return (
      <div className="p-4 bg-green-100 border border-green-300 rounded-lg shadow-sm">
        <h2 className="font-bold text-xl mb-2">{title}</h2>
        <p className="text-gray-700">{description}</p>
      </div>
    );
  }