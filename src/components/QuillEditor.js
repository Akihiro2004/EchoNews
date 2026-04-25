import React, { useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = ({ value = '', onChange = () => {}, modules = {}, formats = [], placeholder = '', className = '' }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const settingHtml = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    quillRef.current = new Quill(containerRef.current, {
      theme: 'snow',
      modules,
      placeholder,
    });

    // set initial content
    quillRef.current.clipboard.dangerouslyPasteHTML(value || '');

    quillRef.current.on('text-change', () => {
      if (settingHtml.current) return;
      const html = quillRef.current.root.innerHTML;
      onChange(html === '<p><br></p>' ? '' : html);
    });

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const current = q.root.innerHTML;
    const newVal = value || '';
    if (newVal !== current) {
      settingHtml.current = true;
      q.clipboard.dangerouslyPasteHTML(newVal);
      settingHtml.current = false;
    }
  }, [value]);

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  );
};

export default QuillEditor;
