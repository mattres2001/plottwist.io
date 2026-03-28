import React, { forwardRef } from "react";
import DocumentEditor from './DocumentEditor';

const DOC_FONT_STYLE = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '12px',
};

const DocumentWindow = forwardRef(({ lockedContent, currentContent, onContentChange }, ref) => {
  return (
    <div className="relative z-5 w-[530px] h-[660px] rounded-lg shadow-lg overflow-y-auto overflow-x-hidden flex justify-center items-start p-0">
      <div className="w-full bg-white shadow-2xl rounded-sm flex flex-col min-h-full">
        <div className="p-6 flex-1" style={DOC_FONT_STYLE}>
          {lockedContent ? (
            <div
              className="text-gray-800 mb-1 select-none pointer-events-none"
              style={{ ...DOC_FONT_STYLE, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: lockedContent }}
            />
          ) : null}
          <DocumentEditor ref={ref} content={currentContent} onChange={onContentChange} />
        </div>
      </div>
    </div>
  );
});

DocumentWindow.displayName = 'DocumentWindow'

export default DocumentWindow;