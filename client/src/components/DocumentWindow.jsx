import React from "react";
import DocumentEditor from './DocumentEditor';

const DocumentWindow = ({ lockedContent, currentContent, onContentChange }) => {
  return (
    <div className="relative z-5 w-[530px] h-[660px] rounded-lg shadow-lg overflow-y-auto overflow-x-hidden flex justify-center items-start p-0">
      <div className="w-full bg-white shadow-2xl rounded-sm flex flex-col min-h-full">
        <div className="p-6 flex-1 text-sm">
          {lockedContent ? (
            <div className="text-gray-800 whitespace-pre-wrap mb-1 select-none pointer-events-none" style={{ fontFamily: 'inherit', fontSize: 'inherit' }}>
              {lockedContent}
            </div>
          ) : null}
          <DocumentEditor content={currentContent} onChange={onContentChange} />
        </div>
      </div>
    </div>
  );
};

export default DocumentWindow;