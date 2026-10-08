import Link from "next/link";

const sections=[
 ["Eligibility","You must be at least 18 years old to create or use an account. You may not use Plunge if you are legally prohibited from doing so or if your account has been suspended or terminated."],
 ["Your account","Provide accurate information, keep your sign-in credentials secure, and do not impersonate another person or create accounts to evade enforcement."],
 ["Acceptable use","Do not harass, threaten, stalk, defraud, exploit, or unlawfully discriminate against others. Do not solicit minors, distribute illegal content, or share intimate images without consent."],
 ["Profiles and content","You remain responsible for content you upload or send and must have the rights and permissions needed to share it. You grant the service operator the limited permission needed to host, display, transmit, and moderate that content as part of operating Plunge."],
 ["Safety and moderation","Plunge may review reported content, remove content, restrict features, pause accounts, or terminate accounts to protect members and enforce rules. Moderation may not detect every harmful interaction and is not a guarantee of safety."],
 ["Availability and changes","Features may change, be interrupted, or be discontinued. The service is provided subject to applicable law; no statement here limits rights that cannot legally be limited."],
 ["Contact and legal review","The operator’s legal name, contact address, governing-law clause, dispute terms, liability provisions, and any required statutory disclosures must be completed and reviewed before public launch."]
];

export default function TermsPage(){return <main className="legal-page"><a className="home-logo" href="/">plunge</a><span className="eyebrow">SERVICE TERMS</span><h1>Terms of Service</h1><p className="legal-intro">Last updated: October 8, 2026. This is an initial working draft for product development, not a finalized legal agreement. Have qualified counsel review it and complete the operator-specific provisions before public launch.</p>{sections.map(([title,body])=><section className="legal-section" key={title}><h2>{title}</h2><p>{body}</p></section>)}<p className="legal-foot">Using Plunge also means following the <Link href="/guidelines">Community Guidelines</Link> and reviewing the <Link href="/privacy">Privacy Policy</Link>.</p></main>}