import LegalLayout from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Privacy Policy",
  description: "How Attendrix collects, uses, and protects your data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="January 24, 2026">
      <h2>1. Information We Collect</h2>
      <p>
        We collect only the minimum data necessary to provide the attendance
        tracking service:
      </p>
      <ul>
        <li>
          <strong>Account Information:</strong> Your email address and basic
          profile info provided via Google Authentication (Firebase).
        </li>
        <li>
          <strong>Academic Data:</strong> Your timetable, course list, and
          attendance records synced via Supabase.
        </li>
        <li>
          <strong>Device Data:</strong> Basic device identifiers for session
          management.
        </li>
      </ul>

      <h2>2. Location Data Usage</h2>
      <p>
        Attendrix uses location services <strong>exclusively</strong> for
        verification purposes at the moment of marking attendance.
      </p>
      <ul>
        <li>
          We <strong>DO NOT</strong> track your location in the background.
        </li>
        <li>
          We <strong>DO NOT</strong> store your historical location coordinates.
        </li>
        <li>
          Location is only accessed when you explicitly tap the &quot;Mark
          Attendance&quot; button.
        </li>
      </ul>

      <h2>3. Data Storage & Security</h2>
      <p>Your data is stored securely using industry-standard providers:</p>
      <ul>
        <li>
          <strong>Authentication:</strong> Managed by Google Firebase.
        </li>
        <li>
          <strong>Database:</strong> Hosting and storage provided by Supabase
          (PostgreSQL).
        </li>
      </ul>

      <h2>4. Third-Party Services</h2>
      <p>We utilize the following third-party services:</p>
      <ul>
        <li>
          <strong>Google Firebase:</strong> For authentication and analytics.
        </li>
        <li>
          <strong>Supabase:</strong> For database and backend logic.
        </li>
      </ul>

      <h2>5. Data Deletion</h2>
      <p>
        You have the right to request deletion of your data at any time. You can
        delete your account directly from the app settings, which will
        permanently remove all your personal data from our servers.
      </p>
    </LegalLayout>
  );
}
