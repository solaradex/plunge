import Link from "next/link";

const rules=[
 ["Adults only","Plunge is for adults 18 and older. Never misrepresent your age or help an underage person use the service."],
 ["Respect consent","Respect boundaries. Do not pressure anyone for dates, personal information, intimate images, or off-platform contact."],
 ["Be authentic","Use truthful profile information and photos that represent you. Impersonation, scams, and deceptive requests are not allowed."],
 ["No harassment or threats","Threats, hate, stalking, repeated unwanted contact, and abusive behavior are not acceptable."],
 ["Share images responsibly","Only send images you have the right to share. Never share another person’s private or intimate images without their explicit consent."],
 ["Meet safely","For first meetings, choose a public place, arrange your own transportation, tell someone you trust, and leave if you feel unsafe."]
];

export default function GuidelinesPage(){return <main className="legal-page"><a className="home-logo" href="/">plunge</a><span className="eyebrow">COMMUNITY STANDARD</span><h1>Community Guidelines</h1><p className="legal-intro">Plunge is built for adults to meet nearby, chat, make friends, and find meaningful connections. Everyone deserves to feel safe and respected.</p>{rules.map(([title,body])=><section className="legal-section" key={title}><h2>{title}</h2><p>{body}</p></section>)}<section className="legal-section"><h2>Report, block, and get help</h2><p>Use in-app reporting for suspicious or harmful behavior and block anyone you do not want to interact with. If someone is in immediate danger, contact local emergency services. Reports are reviewed by moderators, but review may not be immediate.</p></section><p className="legal-foot">These guidelines are operational community rules, not legal advice or a guarantee of safety. <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p></main>}