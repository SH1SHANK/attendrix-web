import SupportLayout from "@/components/support/SupportLayout";

export default function ContactSupportPage() {
  return (
    <SupportLayout
      title="Contact Support"
      subtitle="Have a question about your data or account? Reach out anytime."
      subject="Contact Support"
      tips={[
        "Your question or issue in one sentence.",
        "Your batch and semester if relevant.",
        "A good time to follow up.",
      ]}
      ctaLabel="Email Support"
    />
  );
}
