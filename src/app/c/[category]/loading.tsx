export default function LoadingCategory() {
  return (
    <div className="container-page py-8">
      <div className="grid md:grid-cols-12 gap-4">
        <div className="md:col-span-3">
          <div className="card p-4 animate-pulse h-48" />
        </div>
        <div className="md:col-span-9 flex flex-col gap-4">
          <div className="card p-6 animate-pulse h-20" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse h-40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
