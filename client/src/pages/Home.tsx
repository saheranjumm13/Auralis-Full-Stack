import { useState, type FormEvent, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  BatteryCharging,
  Check,
  ChevronRight,
  Headphones,
  Leaf,
  LoaderCircle,
  Menu,
  Mic2,
  MoveRight,
  Pause,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Waves,
  X,
} from "lucide-react";

const features = [
  {
    icon: Waves,
    number: "01",
    title: "Silence, tuned",
    copy: "Adaptive noise cancellation that reads your space and lets the right amount of world through.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Sound with soul",
    copy: "Custom 40mm drivers bring warmth to the low end and detail to every breath in the room.",
  },
  {
    icon: Mic2,
    number: "03",
    title: "Voice, crystal clear",
    copy: "Six beamforming mics keep your voice natural, even when the city around you gets loud.",
  },
  {
    icon: Leaf,
    number: "04",
    title: "Made to last",
    copy: "Thoughtful materials, replaceable cushions, and a battery that keeps pace with real life.",
  },
];

const specs = [
  ["Battery", "42 hours"],
  ["Weight", "286 g"],
  ["Drivers", "40 mm bio-cellulose"],
  ["Connectivity", "Bluetooth 5.3 / USB-C"],
];

const plans = [
  {
    name: "Auralis One",
    price: "$289",
    description: "The everyday essential for deep work and deeper listening.",
    features: ["Adaptive noise cancellation", "42-hour battery", "Carry case + USB-C cable"],
    featured: false,
  },
  {
    name: "Auralis One +",
    price: "$349",
    description: "The full ritual, with premium finishes and an extra set of cushions.",
    features: ["Everything in Auralis One", "Wireless charging case", "Lifetime cushion refresh"],
    featured: true,
  },
];

function ArrowLink({ children }: { children: ReactNode }) {
  return (
    <a className="text-link" href="#features">
      {children} <ArrowUpRight size={16} strokeWidth={1.8} />
    </a>
  );
}

function getContactFieldError(field: string, value: string) {
  if (field === "name" && value.trim().length < 2) return "Please add your name.";
  if (field === "email" && !/^\S+@\S+\.\S+$/.test(value.trim())) return "Enter a valid email address.";
  if (field === "message" && value.trim().length < 10) return "Tell us a little more (10 characters minimum).";
  return "";
}

export default function Home() {
  const submitContact = trpc.contact.submit.useMutation();
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadStage, setUploadStage] = useState<"idle" | "reading" | "sending">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus("idle");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = attachment;
    const values = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    };
    const validation = Object.fromEntries(Object.entries(values).map(([field, value]) => [field, getContactFieldError(field, value)]));
    if (Object.values(validation).some(Boolean) || fieldErrors.attachment) {
      setFieldErrors(validation);
      return;
    }

    let encodedAttachment: { filename: string; mimeType: string; size: number; data: string } | undefined;

    try {
      if (file) {
        setUploadStage("reading");
        setUploadProgress(0);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 70));
          };
          reader.onerror = () => reject(new Error("Could not read the attachment."));
          reader.readAsDataURL(file);
        });
        encodedAttachment = { filename: file.name, mimeType: file.type, size: file.size, data: dataUrl.split(",")[1] ?? "" };
      }
      setUploadStage("sending");
      setUploadProgress(file ? 82 : 30);
      await submitContact.mutateAsync({
        ...values,
        attachment: encodedAttachment,
      });
      form.reset();
      setAttachment(null);
      setFieldErrors({});
      setUploadProgress(100);
      setFormStatus("success");
    } catch {
      setFormStatus("error");
    } finally {
      window.setTimeout(() => {
        setUploadStage("idle");
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleContactFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: getContactFieldError(name, value) }));
    if (formStatus !== "idle") setFormStatus("idle");
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const allowedTypes = ["application/pdf", "audio/mpeg", "audio/wav", "image/jpeg", "image/png", "image/webp"];
    const attachmentError = file && file.size > 5 * 1024 * 1024 ? "That file is larger than 5 MB." : file && !allowedTypes.includes(file.type) ? "That file type is not supported." : "";
    setFieldErrors((current) => ({ ...current, attachment: attachmentError }));
    setAttachment(attachmentError ? null : file);
  };

  return (
    <div className="auralis-site">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Auralis home">
          <span className="brand-mark"><Headphones size={16} strokeWidth={2.25} /></span>
          <span>Auralis</span>
        </a>

        <input className="menu-toggle" id="menu-toggle" type="checkbox" aria-label="Toggle navigation" />
        <label className="menu-button" htmlFor="menu-toggle">
          <Menu className="menu-open" size={22} />
          <X className="menu-close" size={22} />
        </label>

        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#top">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="button button-dark header-cta" href="#pricing">Buy Auralis <ArrowUpRight size={16} /></a>
      </header>

      <main id="top">
        <section className="hero-section section-shell">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> New from Auralis</p>
            <h1>Hear the shape of <em>silence.</em></h1>
            <p className="hero-description">Auralis One is a quieter kind of headphones—balanced, tactile, and tuned for the way you actually move through the world.</p>
            <div className="hero-actions">
              <a className="button button-saffron" href="#pricing">Find your Auralis <MoveRight size={17} /></a>
              <a className="play-link" href="#story"><span className="play-icon"><Pause size={12} fill="currentColor" /></span> Watch the film</a>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars" aria-hidden="true"><span>J</span><span>M</span><span>L</span></div>
              <p><strong>4.9 / 5</strong><br /><span>Loved by 2,400+ listeners</span></p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Auralis One wireless headphones product image">
            <div className="visual-noise" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-product-label"><span className="label-dot" /> Auralis One <span>01 / 02</span></div>
            <img src="/manus-storage/auralis-headphones_1561ab16.png" alt="Auralis One over-ear headphones in deep navy and ivory" />
            <div className="floating-card floating-card-top"><span className="mini-icon"><BatteryCharging size={17} /></span><span><small>Battery life</small><strong>42 hrs</strong></span></div>
            <div className="floating-card floating-card-bottom"><span className="mini-icon mini-icon-light"><Waves size={17} /></span><span><small>Noise floor</small><strong>-32 dB</strong></span></div>
            <span className="visual-caption">Made for the moments<br />in between the noise.</span>
          </div>
        </section>

        <section className="marquee-row" aria-label="Auralis product promise">
          <span>Quiet is a feature</span><span className="marquee-star">✦</span><span>Listen closer</span><span className="marquee-star">✦</span><span>Move softly</span><span className="marquee-star">✦</span><span>Quiet is a feature</span>
        </section>

        <section className="intro-section section-shell" id="story">
          <div className="section-kicker">01 — The Auralis difference</div>
          <div className="intro-layout">
            <h2>Less noise.<br /><span>More you.</span></h2>
            <div className="intro-body">
              <p>We believe technology should make room for your attention—not ask for more of it. Auralis One filters the static, preserves the texture, and leaves you with the part that matters.</p>
              <ArrowLink>Why Auralis</ArrowLink>
            </div>
          </div>
        </section>

        <section className="features-section section-shell" id="features">
          <div className="section-heading-row">
            <div><div className="section-kicker">02 — Crafted listening</div><h2>Everything has<br /><span>its own frequency.</span></h2></div>
            <p className="section-aside">From the first note to the final call of the day, every detail is tuned to feel natural.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, number, title, copy }) => (
              <article className="feature-card" key={number}>
                <div className="feature-topline"><span>{number}</span><Icon size={23} strokeWidth={1.5} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="card-arrow"><ChevronRight size={17} /></span>
              </article>
            ))}
          </div>
        </section>

        <section className="specs-section section-shell" id="highlights">
          <div className="specs-visual">
            <div className="specs-number">42<span>h</span></div>
            <div className="specs-copy"><span className="section-kicker">03 — In the details</span><h2>Stay in your<br /><em>flow state.</em></h2><p>Long flights, long walks, long chapters. Auralis One has the stamina to go where your focus takes you.</p></div>
            <div className="specs-wave"><span /><span /><span /><span /><span /></div>
          </div>
          <div className="spec-list">
            {specs.map(([label, value]) => <div className="spec-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            <a href="#pricing" className="text-link text-link-light">See all specifications <ArrowUpRight size={16} /></a>
          </div>
        </section>

        <section className="quote-section section-shell">
          <div className="quote-mark">“</div>
          <blockquote>Auralis turns the volume down on the world without turning the world off.</blockquote>
          <div className="quote-attribution"><span className="quote-line" /> <span>Monocle — Design review, 2025</span></div>
        </section>

        <section className="pricing-section section-shell" id="pricing">
          <div className="section-heading-row pricing-heading"><div><div className="section-kicker">04 — Choose your quiet</div><h2>Make space<br /><span>for better sound.</span></h2></div><p className="section-aside">Free shipping, 30-day listening trial, and a two-year warranty included with every pair.</p></div>
          <div className="pricing-grid">
            {plans.map((plan) => <article className={`price-card ${plan.featured ? "price-card-featured" : ""}`} key={plan.name}>
              {plan.featured && <div className="recommended">Most loved <Sparkles size={13} /></div>}
              <div className="price-card-head"><h3>{plan.name}</h3><div className="price">{plan.price}<small> USD</small></div><p>{plan.description}</p></div>
              <ul>{plan.features.map((feature) => <li key={feature}><span><Check size={14} /></span>{feature}</li>)}</ul>
              <a className={`button ${plan.featured ? "button-saffron" : "button-outline"}`} href="#contact">Choose {plan.name.replace("Auralis ", "")} <ArrowUpRight size={16} /></a>
            </article>)}
          </div>
        </section>

        <section className="contact-section section-shell" id="contact">
          <div className="contact-copy"><div className="section-kicker">05 — Come say hello</div><h2>Questions sound<br /><em>better in person.</em></h2><p>Tell us what you’re listening to, where you’re going, or simply what you want to hear less of.</p><div className="contact-meta"><ShieldCheck size={18} /><span>Real people. Thoughtful replies.<br /><strong>hello@auralis.audio</strong></span></div></div>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-field"><label htmlFor="name">Your name</label><input id="name" name="name" type="text" placeholder="Jane Smith" required onChange={handleContactFieldChange} aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}</div>
            <div className="form-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="jane@example.com" required onChange={handleContactFieldChange} aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}</div>
            <div className="form-field"><label htmlFor="message">What’s on your mind?</label><textarea id="message" name="message" rows={4} placeholder="I’d love to know more about…" required onChange={handleContactFieldChange} aria-invalid={Boolean(fieldErrors.message)} />{fieldErrors.message && <small className="field-error">{fieldErrors.message}</small>}</div>
            <div className="form-field form-field-file"><label htmlFor="attachment">Add an attachment <span>(optional)</span></label><input id="attachment" name="attachment" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,audio/mpeg,audio/wav" onChange={handleAttachmentChange} aria-invalid={Boolean(fieldErrors.attachment)} />{fieldErrors.attachment ? <small className="field-error">{fieldErrors.attachment}</small> : <small>PNG, JPG, WEBP, PDF, MP3, or WAV · up to 5 MB</small>}</div>
            {uploadStage !== "idle" && <div className="upload-status" role="status"><div className="upload-status-copy"><UploadCloud size={16} /><span>{uploadStage === "reading" ? "Preparing your attachment…" : "Sending securely…"}</span><strong>{uploadProgress}%</strong></div><div className="upload-progress-track"><span style={{ width: `${uploadProgress}%` }} /></div></div>}
            <button className="button button-saffron" type="submit" disabled={submitContact.isPending || uploadStage !== "idle"}>{submitContact.isPending || uploadStage !== "idle" ? <><LoaderCircle size={16} className="button-spinner" /> {uploadStage === "reading" ? "Preparing…" : "Sending…"}</> : <>Send a note <MoveRight size={17} /></>}</button>
            {formStatus === "success" && <p className="form-status form-status-success" role="status">Your note is in. We’ll be in touch soon.</p>}
            {formStatus === "error" && <p className="form-status form-status-error" role="alert">We couldn’t send that just yet. Please check the fields and try again.</p>}
          </form>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <div className="footer-main"><a className="brand brand-footer" href="#top"><span className="brand-mark"><Headphones size={16} strokeWidth={2.25} /></span><span>Auralis</span></a><p>Sound, with room to breathe.</p><div className="footer-socials"><a href="#contact" aria-label="Instagram">ig</a><a href="#contact" aria-label="TikTok">tk</a><a href="#contact" aria-label="YouTube">yt</a></div></div>
        <div className="footer-bottom"><span>© 2025 Auralis Audio Co.</span><div><a href="#top">Back to top ↑</a><a href="#contact">Privacy</a></div></div>
      </footer>
    </div>
  );
}
