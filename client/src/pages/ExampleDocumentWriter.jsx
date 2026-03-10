import React, { useState } from "react";
import DocumentEditor from "../components/DocumentEditor";
import { assets } from "../assets/assets";
import DocumentWindow from '../components/DocumentWindow';

const ExampleDocumentWriter = () => {
  const [content, setContent] = useState("");

  return (
    <div className="relative h-screen w-screen bg-gray-100 flex items-center justify-center overflow-hidden">

      {/* Background */}
      <img
        src={assets.bg_image_login}
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover"
      />

        <DocumentWindow/>

    </div>
  );
};

export default ExampleDocumentWriter;