import React, { useState } from "react";
import DocumentEditor from './DocumentEditor';

const DocumentWindow = () => {


  const [content, setContent] = useState("");

  return (
      <div className="relative z-10 w-[600px] h-[400px] bg-gray-200 rounded-lg shadow-lg overflow-auto flex justify-center items-start p-4">
        {/* Paper */}
        <div className="w-[816px] aspect-[8.5/11] bg-white shadow-2xl rounded-sm flex flex-col">
          {/* Page margins */}
          <div className="p-8 flex-1">
            <DocumentEditor content={content} onChange={setContent} />
          </div>
        </div>
      </div>
  );
};

export default DocumentWindow;