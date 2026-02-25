import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/adminClient';

interface Spot {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  description?: string;
}

interface Trail {
  id: string;
  name: string;
  boundary: {
    northEast: { lat: number; lon: number };
    southWest: { lat: number; lon: number };
  };
}

export function MapEditor() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: 'spot' | 'trail'; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [showTrails, setShowTrails] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const results = await Promise.all([
        adminApi.getSpots(),
        adminApi.getTrails(),
      ]);
      // @ts-expect-error - API response types not yet defined
      setSpots(results[0]?.data || []);
      // @ts-expect-error - API response types not yet defined
      setTrails(results[1]?.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading map data...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Layers</h2>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showSpots}
                  onChange={(e) => setShowSpots(e.target.checked)}
                  className="rounded"
                />
                <span>Spots ({spots.length})</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showTrails}
                  onChange={(e) => setShowTrails(e.target.checked)}
                  className="rounded"
                />
                <span>Trails ({trails.length})</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h2 className="text-lg font-semibold mb-2">Actions</h2>
            <div className="space-y-2">
              <button type="button" className="w-full px-4 py-2 text-sm bg-indigo-600 rounded hover:bg-indigo-700">
                Create Spot
              </button>
              <button type="button" className="w-full px-4 py-2 text-sm bg-purple-600 rounded hover:bg-purple-700">
                Create Trail
              </button>
            </div>
          </div>

          {showSpots && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold mb-2">Spots</h3>
              <div className="space-y-1">
                {spots.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => setSelectedItem({ type: 'spot', id: spot.id })}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedItem?.type === 'spot' && selectedItem?.id === spot.id
                        ? 'bg-indigo-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {spot.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showTrails && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold mb-2">Trails</h3>
              <div className="space-y-1">
                {trails.map((trail) => (
                  <button
                    key={trail.id}
                    type="button"
                    onClick={() => setSelectedItem({ type: 'trail', id: trail.id })}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedItem?.type === 'trail' && selectedItem?.id === trail.id
                        ? 'bg-purple-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {trail.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          className="w-full h-full bg-gray-900 flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <div className="text-6xl">🗺️</div>
            <div className="text-gray-400">
              <p className="text-lg font-semibold">Interactive Map Coming Soon</p>
              <p className="text-sm mt-2">
                {spots.length} Spots • {trails.length} Trails
              </p>
              <div className="mt-4 text-xs text-gray-500">
                <p>Map integration with Leaflet/OpenStreetMap</p>
                <p>• Click to create spots</p>
                <p>• Drag to move markers</p>
                <p>• Draw trail boundaries</p>
              </div>
            </div>
          </div>
        </div>

        {selectedItem && (
          <div className="absolute top-4 right-4 w-80 bg-gray-800 rounded-lg shadow-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                {selectedItem.type === 'spot' ? 'Edit Spot' : 'Edit Trail'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-400">
              ID: {selectedItem.id}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Editor form coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
