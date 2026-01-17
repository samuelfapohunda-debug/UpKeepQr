interface QRAsset {
  id: string;
  label: string;
  location: string;
  activatedAt: Date;
}

interface QRAssetsSectionProps {
  qrAssets: QRAsset[];
}

export default function QRAssetsSection({ qrAssets }: QRAssetsSectionProps) {
  return (
    <section className="mb-8" data-testid="qr-assets-section">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🏷️ Your QR Magnets
      </h2>
      
      {qrAssets.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            No QR magnets assigned yet.
          </p>
          <button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg min-h-[44px]"
            data-testid="button-order-magnets"
          >
            Order QR Magnets
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {qrAssets.map((asset, index) => (
            <div 
              key={asset.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
              data-testid={`card-qr-${asset.id}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">📱</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    QR Magnet #{index + 1}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Location: {asset.location}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Activated: {new Date(asset.activatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <button 
                  className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm min-h-[44px]"
                  data-testid={`button-rename-${asset.id}`}
                >
                  Rename
                </button>
                <button 
                  className="flex-1 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-2 px-4 rounded-lg text-sm min-h-[44px]"
                  data-testid={`button-rescan-${asset.id}`}
                >
                  Re-scan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
