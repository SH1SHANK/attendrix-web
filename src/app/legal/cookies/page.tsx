import LegalLayout from "@/components/legal/LegalLayout";

export default function CookiePage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="January 24, 2026">
      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. Attendrix uses cookies sparingly to ensure the application
        functions correctly.
      </p>

      <h2>2. Essential Cookies</h2>
      <p>
        We use only essential cookies required for authentication and security.
        These include:
      </p>
      <ul>
        <li>
          <strong>Auth Tokens:</strong> JWTs (JSON Web Tokens) used to keep you
          logged in securely.
        </li>
        <li>
          <strong>Session IDs:</strong> Used to maintain your active session
          state with our backend.
        </li>
      </ul>
      <p>
        Without these cookies, you would be unable to log in or use the core
        features of the app.
      </p>

      <h2>3. No Advertising Cookies</h2>
      <p>We value your privacy and user experience.</p>
      <ul>
        <li>
          We <strong>DO NOT</strong> use advertising cookies.
        </li>
        <li>
          We <strong>DO NOT</strong> use tracking pixels for marketing purposes.
        </li>
        <li>
          We <strong>DO NOT</strong> sell your browsing data to third parties.
        </li>
      </ul>

      <h2>4. Managing Cookies</h2>
      <p>
        Most web browsers allow you to manage your cookie preferences. However,
        please note that disabling essential cookies will render the Attendrix
        application unusable as you will not be able to authenticate.
      </p>
    </LegalLayout>
  );
}
