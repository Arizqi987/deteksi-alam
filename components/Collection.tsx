import React, { useState } from 'react';
import { CollectionItem } from '../types';
import { Trash2, Calendar, ArrowLeft } from 'lucide-react';
import ResultOverlay from './ResultOverlay';

interface CollectionProps {
  items: CollectionItem[];
  onBack: () => void;
  onClear: () => void;
}

const Collection: React.FC<CollectionProps> = ({ items, onBack, onClear }) => {
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);

  if (selectedItem) {
    return (
      <div className="absolute inset-0 z-50">
        <ResultOverlay
          result={selectedItem}
          imageSrc={selectedItem.imageUrl || ''}
          onSave={() => {}} 
          onBack={() => setSelectedItem(null)}
          initialSavedState={true}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 overflow-y-auto no-scrollbar pb-20">
      <div className="sticky top-0 bg-gray-900/90 backdrop-blur-md z-10 p-6 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h2 className="text-2xl font-bold text-white">Koleksiku</h2>
        </div>
        {items.length > 0 && (
          <button onClick={onClear} className="text-red-400 hover:text-red-300 transition">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {items.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center text-gray-500 py-20 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Calendar size={32} />
            </div>
            <p className="text-lg font-medium">Belum ada koleksi</p>
            <p className="text-sm mt-1 max-w-[200px]">Mulailah memotret tanaman atau hewan di sekitarmu!</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg flex flex-col cursor-pointer active:scale-95 transition-transform"
            >
              <div className="h-32 w-full bg-gray-700 relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                  {item.category}
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-white font-bold text-sm truncate">{item.name}</h3>
                <p className="text-gray-400 text-xs italic truncate mb-2">{item.scientificName}</p>
                <div className="mt-auto flex justify-between items-end">
                   <span className="text-[10px] text-gray-500">
                     {new Date(item.timestamp).toLocaleDateString()}
                   </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Collection;