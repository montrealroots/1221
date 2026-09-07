/**
 * The phone workspace: a desk with a handset on it.
 *
 * Everything a phone does happens inside the phone rather than in a SLATE
 * panel, because the point of the thing is that it is a phone. The page around
 * it says only what a page has to say and then gets out of the way.
 */

import { Phone } from '@/ui/phone/Phone';
import { CHANNEL_NOTE } from '@/engine/content/channels';

export function PhoneWorkspace() {
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Phone</div>
        <h1>Your Phone</h1>
        <p className="muted">
          The clock on it is the world clock, and an hour spent in an app is an hour gone
          out of the day. Open YouTube the way you would open it.
        </p>
        <p className="xs dim">{CHANNEL_NOTE}</p>
      </div>
      <Phone />
    </>
  );
}
