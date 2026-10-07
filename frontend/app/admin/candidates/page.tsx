import AdminResourcePage from "@/components/admin/AdminResourcePage";

export default function CandidatesPage() {
  return (
    <AdminResourcePage
      title="Candidates"
      description="Review candidates screened by the HR workflow."
      endpoint="/api/hr/candidates"
      columns={[
        { key: "name", label: "Candidate" },
        { key: "email", label: "Email" },
        { key: "position", label: "Position" },
        { key: "ai_recommendation", label: "AI recommendation", format: "name" },
        { key: "ai_confidence", label: "Confidence" },
        { key: "status", label: "Status", format: "status" },
      ]}
    />
  );
}
