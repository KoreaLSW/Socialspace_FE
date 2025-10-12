interface DragOverlayProps {
  isDragging: boolean;
}

export default function DragOverlay({ isDragging }: DragOverlayProps) {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl text-center">
        <div className="text-4xl mb-2">📎</div>
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          파일을 여기에 드롭하세요
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          이미지, PDF, 문서 파일 (최대 10MB)
        </p>
      </div>
    </div>
  );
}
