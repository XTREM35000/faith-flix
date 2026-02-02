import React from 'react';

interface ChatAttachmentProps {
  url: string;
  fileName?: string;
}

const ChatAttachment: React.FC<ChatAttachmentProps> = ({ url, fileName }) => {
  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
  const isDoc = /\.(pdf|docx?)$/i.test(url);

  if (isImage) return <img src={url} alt={fileName || 'attachment'} className="max-w-xs rounded-md" />;
  if (isDoc) return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-muted p-3 rounded-md">
      <span>📄</span>
      <span className="text-sm">{fileName || 'Document'}</span>
    </a>
  );

  return <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">Ouvrir</a>;
};

export default ChatAttachment;
