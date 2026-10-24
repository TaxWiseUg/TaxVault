"use client";

import React, { useState } from "react";
import { ComplianceOverview, ClientScorecard } from "./ComplianceOverview";
import { AiComplianceReview } from "./AiComplianceReview";

interface ComplianceCheckerProps {
  user: {
    id: string;
    full_name?: string;
  };
}

export const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({ user }) => {
  const [activeMode, setActiveMode] = useState<"overview" | "audit">("overview");
  const [selectedClient, setSelectedClient] = useState<ClientScorecard | null>(null);

  const handleOpenClientReview = (client: ClientScorecard) => {
    setSelectedClient(client);
    setActiveMode("audit");
  };

  const handleNewReview = () => {
    setSelectedClient(null);
    setActiveMode("audit");
  };

  const handleBackToOverview = () => {
    setActiveMode("overview");
  };

  return (
    <div className="workspace-feature-page workspace-compliance w-full">
      {activeMode === "overview" ? (
        <ComplianceOverview
          user={user}
          onOpenClientReview={handleOpenClientReview}
          onNewReview={handleNewReview}
        />
      ) : (
        <AiComplianceReview
          user={user}
          standalone={true}
          onBackToOverview={handleBackToOverview}
          initialCompanyName={selectedClient?.name}
        />
      )}
    </div>
  );
};

export default ComplianceChecker;
