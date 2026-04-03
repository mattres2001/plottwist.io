import React, { useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"

const DocumentEditor = forwardRef(({ content, onChange }, ref) => {

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['paragraph', 'heading'] }),
        ],
        content: content || "<p></p><p></p>",
        editorProps: {
            attributes: {
                class: "focus:outline-none",
                style: "font-family: 'Courier New', Courier, monospace; font-size: 12px; min-height: 100%; cursor: text;"
            }
        },
        onUpdate({ editor }) {
            if (onChange) onChange(editor.getHTML())
        }
    })

    React.useEffect(() => {
        if (!editor) return
        if (content === "" || content === null || content === undefined) {
            editor.commands.setContent("<p></p><p></p>", false)
        }
    }, [content, editor])

    useImperativeHandle(ref, () => ({

        insertHTML: (html, cursorOffset) => {
            if (!editor) return

            const sizeBefore = editor.state.doc.content.size

            editor.chain().focus().insertContent(html + '<p></p>').run()

            editor.commands.unsetBold()

            if (cursorOffset === undefined) return

            const insertedAt = sizeBefore
            editor.commands.setTextSelection(insertedAt + cursorOffset)
            editor.commands.unsetBold()
        }
    }))

    if (!editor) return <div className="w-full h-full bg-gray-50" />

    return (
        <div
            className="w-full flex-1"
            style={{ minHeight: '300px', cursor: 'text' }}
            onClick={() => editor.commands.focus()}
        >
            <EditorContent editor={editor} className="w-full h-full" />
        </div>
    )
})

DocumentEditor.displayName = 'DocumentEditor'

export default DocumentEditor