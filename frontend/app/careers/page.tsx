import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { HR_APPLICATION_FORM_URL, SUPPORT_EMAIL } from "@/lib/workflowForms";

const positions = [
  { title: "Frontend Developer", type: "Full-time", location: "Remote", description: "Build beautiful shopping experiences with Next.js and React." },
  { title: "Backend Engineer", type: "Full-time", location: "Hybrid (Bangalore)", description: "Design scalable APIs with Python and FastAPI." },
  { title: "AI/ML Engineer", type: "Full-time", location: "Remote", description: "Build intelligent automation workflows with Gemini and n8n." },
  { title: "UI/UX Designer", type: "Full-time", location: "Remote", description: "Craft delightful user experiences for our e-commerce platform." },
  { title: "Marketing Manager", type: "Full-time", location: "On-site (Mumbai)", description: "Lead data-driven marketing campaigns." },
  { title: "Customer Support Lead", type: "Full-time", location: "Remote", description: "Manage customer happiness and AI-powered support." },
];

export default function CareersPage() {
  return (
    <main className="page-shell">
      <section className="collection-hero">
        <div>
          <p className="eyebrow">Careers at Urbanova</p>
          <h1>Build thoughtful commerce with us.</h1>
          <p>Explore our open roles and submit an application through the HR workflow.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">Grow with us</p><h2>Open positions</h2></div>
          <p className="muted-copy">Questions? Contact <a className="text-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
        </div>
        <div className="product-grid">
          {positions.map((position) => (
            <article className="account-shortcut-card" key={position.title}>
              <div>
                <h2>{position.title}</h2>
                <p className="flex items-center gap-2"><Briefcase size={14} /> {position.type}</p>
                <p className="flex items-center gap-2"><MapPin size={14} /> {position.location}</p>
                <p>{position.description}</p>
              </div>
              <a
                className="button"
                href={`${HR_APPLICATION_FORM_URL}?position=${encodeURIComponent(position.title)}`}
                aria-label={`Apply for ${position.title} using the HR application form`}
              >
                Apply through HR
              </a>
            </article>
          ))}
        </div>
        <div className="notice notice-info mt-8">
          Applications are reviewed by our HR workflow. You can also email your resume and the role title to{" "}
          <a className="text-link" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Job application")}`}>{SUPPORT_EMAIL}</a>.
        </div>
        <p className="mt-6 text-sm"><Link className="text-link" href="/support">Need customer support?</Link></p>
      </section>
    </main>
  );
}
