import LegalLayout from "@/components/legal/LegalLayout";

export default function LicencePage() {
  return (
    <LegalLayout title="Licence" lastUpdated="February 4, 2026">
      <h2>1. Open Source Notice</h2>
      <p>
        Attendrix Web is an open-source project. You can review the source code
        and license details in the public repository.
      </p>
      <p>
        For the most up-to-date licensing terms, visit the repository listed in
        the About section of your Profile page.
      </p>

      <h2>2. Usage Guidelines</h2>
      <p>
        You may view, modify, and contribute to the codebase in accordance with
        the license referenced in the repository. If you are unsure about a
        permitted use case, please contact support for clarification.
      </p>
    </LegalLayout>
  );
}
