import LegalLayout from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Attendrix.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="January 24, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using the Attendrix application (&quot;The
        Service&quot;), you agree to comply with and be bound by these Terms of
        Service. If you do not agree to these terms, please do not use our
        Service.
      </p>
      <p>
        By using Attendrix, you agree to these terms. If you don&apos;t agree,
        please don&apos;t use the app.
      </p>

      <h2>2. Educational Project Disclaimer</h2>
      <p>
        Attendrix is an independent student project developed to assist students
        in tracking attendance.
        <strong>
          It is not an official product of the National Institute of Technology
          Calicut (NITC) administration.
        </strong>
      </p>
      <ul>
        <li>Use of this tool is entirely at your own risk.</li>
        <li>
          We do not guarantee 100% accuracy of data sync with the official DSS.
        </li>
        <li>
          You are responsible for verifying your official attendance status.
        </li>
      </ul>

      <h2>3. User Responsibilities</h2>
      <p>
        You agree to use Attendrix solely for personal academic monitoring. You
        must not:
      </p>
      <ul>
        <li>Attempt to reverse engineer or exploit the application APIs.</li>
        <li>Use the service to misrepresent attendance data.</li>
        <li>Share your account credentials with unauthorized parties.</li>
      </ul>

      <h2>4. Limitation of Liability</h2>
      <p>
        In no event shall the Attendrix team be liable for any indirect,
        incidental, special, or consequential damages arising out of your use of
        the service.
      </p>
      <p>Specifically, we are not responsible for:</p>
      <ul>
        <li>Miscalculated attendance leading to course shortage.</li>
        <li>Discrepancies between our data and official college records.</li>
        <li>Service downtime during critical academic periods.</li>
      </ul>

      <h2>5. Changes to Terms</h2>
      <p>
        We reserve the right to modify these terms at any time. Significant
        changes will be communicated through the application interface.
      </p>
    </LegalLayout>
  );
}
