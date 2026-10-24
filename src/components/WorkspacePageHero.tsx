import React from "react";

interface WorkspacePageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const WorkspacePageHero: React.FC<WorkspacePageHeroProps> = ({
  eyebrow,
  title,
  description,
  children,
}) => (
  <header className="workspace-page-hero">
    <div className="workspace-page-hero-content">
      {eyebrow && <span className="workspace-page-hero-eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {children && <div className="workspace-page-hero-actions">{children}</div>}
    <span className="workspace-page-hero-ring workspace-page-hero-ring-one" aria-hidden="true" />
    <span className="workspace-page-hero-ring workspace-page-hero-ring-two" aria-hidden="true" />
  </header>
);
