import React from "react";
import { ExternalLink } from "lucide-react";

export interface ReferenceLinkItem {
  title: string;
  url: string;
  publisher?: string;
  description?: string;
}

interface ReferenceLinkGridProps {
  references: ReferenceLinkItem[];
  className?: string;
}

function getPublisher(reference: ReferenceLinkItem) {
  if (reference.publisher) return reference.publisher;

  try {
    return new URL(reference.url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

export const ReferenceLinkGrid: React.FC<ReferenceLinkGridProps> = ({ references, className = "" }) => {
  if (!references.length) return null;

  return (
    <div className={`reference-link-grid ${className}`.trim()}>
      {references.map((reference) => (
        <a
          className="reference-link-card"
          key={`${reference.url}-${reference.title}`}
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="reference-link-card__content">
            <span className="reference-link-card__heading">
              <span className="reference-link-card__publisher">{getPublisher(reference)}</span>
              <span className="reference-link-card__title">{reference.title}</span>
            </span>
            {reference.description && (
              <span className="reference-link-card__description">{reference.description}</span>
            )}
          </span>
          <ExternalLink className="reference-link-card__icon" size={14} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
};
