interface ContentInputProps {
  content: string;
  setContent: (content: string) => void;
}

export default function ContentInput({
  content,
  setContent,
}: ContentInputProps) {
  return (
    <div className="mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="무슨 일이 일어나고 있나요?"
        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={6}
        maxLength={2000}
      />
      <div className="flex justify-between items-center mt-2">
        <span
          className={`text-sm ${
            content.length > 1800 ? "text-red-500" : "text-gray-500"
          }`}
        >
          {content.length}/2000
        </span>
      </div>
    </div>
  );
}
