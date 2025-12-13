import React from "react";

export interface ContentSlot {
  type: 'prose' | 'component';
  content?: string;  // HTML for prose slots
  component?: React.ReactNode;  // React component for component slots
}

interface ArticleBodyProps {
  slots: ContentSlot[];
}

export function ArticleBody({ slots }: ArticleBodyProps) {
  return (
    <div className="article-body">
      {slots.map((slot, index) => (
        slot.type === 'prose' ? (
          <div 
            key={index}
            className="article-content max-w-none"
            dangerouslySetInnerHTML={{ __html: slot.content || '' }} 
          />
        ) : (
          <div key={index} className="component-slot my-8">
            {slot.component}
          </div>
        )
      ))}
    </div>
  );
}
