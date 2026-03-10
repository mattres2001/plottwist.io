import React from 'react'
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

const DocumentEditor = ({ content, onChange }) => {

    const editor = useEditor({
        extensions: [StarterKit],
        content: content || "",
        editorProps: {
            attributes: {
                class: "focus:outline-none w-full h-full"
            }
        },
        onUpdate({ editor }) {
            if (onChange) onChange(editor.getHTML())
        }
    })

    if (!editor) return <div className="w-full h-full bg-gray-50" />

    return (
        <div className="flex justify-center items-center h-full w-full">
            <EditorContent editor={editor} className="w-full h-full min-h-[300px]" />
        </div>
    )
}

export default DocumentEditor