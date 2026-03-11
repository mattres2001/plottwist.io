import React, { useState } from "react";
import DocumentEditor from './DocumentEditor';

const DocumentWindow = () => {
  const [content, setContent] = useState("");

  return (
    <div className="relative z-5 w-[530px] h-[660px] rounded-lg shadow-lg overflow-auto flex justify-center items-start p-0 scrollbar-hide">
      {/* Paper */}
      <div className="w-[816px] aspect-[8.5/11] bg-white shadow-2xl rounded-sm flex flex-col">
        {/* Page margins */}
        <div className="p-6 flex-1">
          <DocumentEditor content={content} onChange={setContent} />
        </div>
      </div>

      {/* Add these styles to hide scrollbars */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;             /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
};

export default DocumentWindow;