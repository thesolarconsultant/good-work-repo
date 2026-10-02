/**
 * Small, live-looking product screens: the website, the WhatsApp agent, the
 * voice agent, the Content Console, the brand guide and an automation. They
 * are drawn in HTML rather than shipped as pictures, so they stay sharp at any
 * size: each one is a size container and everything inside is measured in
 * container units, so a mock scales with whatever box it is put in.
 *
 * They are illustrations of a typical build for an example business
 * ("Northline Cleaning"), not screenshots of a client, and are hidden from
 * assistive technology; whatever holds them supplies the description.
 */

const BUSINESS = "Northline Cleaning";

export function MockSite() {
  return (
    <div className="gw-mock gw-mock--site" aria-hidden="true">
      <div className="ms">
        <div className="ms__nav">
          <span className="ms__logo">
            <i />
            Northline
          </span>
          <span className="ms__links">
            <b>Services</b>
            <b>Work</b>
            <b>About</b>
          </span>
          <span className="ms__cta">Book a call</span>
        </div>
        <div className="ms__body">
          <div className="ms__copy">
            <p className="ms__h">
              Commercial cleaning that sets <em>the standard.</em>
            </p>
            <p className="ms__p">Professional, reliable cleaning for businesses across the UK.</p>
            <div className="ms__btns">
              <span className="ms__btn">Book a site visit</span>
              <span className="ms__more">View our services →</span>
            </div>
          </div>
          <div className="ms__img">
            <span className="ms__tower" />
            <span className="ms__tower ms__tower--b" />
          </div>
        </div>
        <div className="ms__trust">
          <span>Trusted by businesses nationwide</span>
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

const CHAT = [
  ["in", "Hi 👋 How can we help today?", "10:30"],
  ["out", "Hi, I'd like to book a site visit please.", "10:30"],
  ["in", "No problem. What date works best for you?", "10:31"],
  ["out", "Thursday morning if possible.", "10:31"],
  ["in", "Great, you're booked in for Thursday at 10am. See you then!", "10:32"],
];

export function MockChat() {
  return (
    <div className="gw-mock gw-mock--chat" aria-hidden="true">
      <div className="mc">
        <div className="mc__head">
          <span className="mc__avatar" />
          <span>
            <b>{BUSINESS}</b>
            <small>Business account</small>
          </span>
        </div>
        <div className="mc__thread">
          {CHAT.map(([side, text, time], i) => (
            <p key={i} className={`mc__msg mc__msg--${side}`} style={{ "--i": i }}>
              {text}
              <small>
                {time}
                {side === "out" ? " ✓✓" : ""}
              </small>
            </p>
          ))}
        </div>
        <div className="mc__input">
          <span>Message</span>
          <i />
        </div>
      </div>
    </div>
  );
}

const BARS = [3, 5, 8, 6, 10, 14, 9, 12, 17, 13, 9, 15, 11, 7, 12, 16, 10, 6, 9, 13, 8, 5, 7, 4];

export function MockCall() {
  return (
    <div className="gw-mock gw-mock--call" aria-hidden="true">
      <div className="mv">
        <p className="mv__label">AI voice agent</p>
        <p className="mv__name">Northline booking line</p>
        <p className="mv__time">00:18</p>
        <div className="mv__wave">
          {BARS.map((h, i) => (
            <span key={i} style={{ "--h": h, "--i": i }} />
          ))}
        </div>
        <div className="mv__keys">
          <span>
            <i className="mv__mute" />
            Mute
          </span>
          <span>
            <i className="mv__pad" />
            Keypad
          </span>
          <span>
            <i className="mv__end" />
            End
          </span>
        </div>
      </div>
    </div>
  );
}

const POSTS = [
  ["a", "Behind every clean space is a great team.", "Instagram"],
  ["b", "3 ways a clean workspace boosts productivity.", "LinkedIn"],
  ["c", "Another great transformation in Manchester.", "Facebook"],
];

export function MockConsole() {
  return (
    <div className="gw-mock gw-mock--console" aria-hidden="true">
      <div className="mo">
        <p className="mo__title">Content Console</p>
        <div className="mo__tabs">
          <b>Drafts</b>
          <span>Scheduled</span>
          <span>Published</span>
        </div>
        {POSTS.map(([tone, text, where]) => (
          <div key={tone} className="mo__post">
            <span className={`mo__thumb mo__thumb--${tone}`} />
            <span className="mo__text">
              {text}
              <small>{where} post</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SWATCHES = [
  ["#111111", "Ink"],
  ["#3366ff", "Blue"],
  ["#7a5cff", "Violet"],
  ["#ff2db3", "Pink"],
  ["#ff6b5e", "Coral"],
];

export function MockBrand() {
  return (
    <div className="gw-mock gw-mock--brand" aria-hidden="true">
      <div className="mb">
        <p className="mb__title">Brand guidelines</p>
        <div className="mb__row">
          <span className="mb__aa">Aa</span>
          <span className="mb__type">
            <b>Display · Poppins Black</b>
            <small>Body · Poppins Regular</small>
          </span>
        </div>
        <div className="mb__swatches">
          {SWATCHES.map(([hex, name]) => (
            <span key={hex} style={{ "--c": hex }}>
              <i />
              <small>{name}</small>
            </span>
          ))}
        </div>
        <p className="mb__rule">Say it plainly. One idea per line.</p>
      </div>
    </div>
  );
}

const FLOW = [
  ["New enquiry", "Website form"],
  ["Qualified", "WhatsApp agent"],
  ["Visit booked", "Calendar"],
  ["Lead saved", "Embedded CRM"],
];

export function MockFlow() {
  return (
    <div className="gw-mock gw-mock--flow" aria-hidden="true">
      <div className="mf">
        <p className="mf__title">Automation · new enquiry</p>
        <ol className="mf__steps">
          {FLOW.map(([what, where], i) => (
            <li key={what} className={i === FLOW.length - 1 ? "is-last" : ""}>
              <b>{what}</b>
              <small>{where}</small>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
