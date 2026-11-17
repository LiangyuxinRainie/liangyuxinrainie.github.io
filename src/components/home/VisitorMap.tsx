'use client';

import { useState } from 'react';

const FLAG_COUNTER_ID = 'YXPZ';
const FLAG_COUNTER_URL = `https://s11.flagcounter.com/count2/${FLAG_COUNTER_ID}/bg_FEFFFE/txt_1E293B/border_E2E8F0/columns_2/maxflags_8/viewers_Visitors/labels_1/pageviews_1/flags_1/percent_0/`;
const FLAG_COUNTER_DETAILS = `https://info.flagcounter.com/${FLAG_COUNTER_ID}`;

export default function VisitorMap() {
  const [unavailable, setUnavailable] = useState(false);

  if (unavailable) {
    return (
      <p className="visitor-counter-note" role="status">
        Visitor statistics are temporarily unavailable.
      </p>
    );
  }

  return (
    <div className="visitor-counter-shell">
      <a
        className="visitor-counter-link"
        href={FLAG_COUNTER_DETAILS}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View detailed visitor statistics on FlagCounter"
      >
        {/* FlagCounter is a live third-party counter, so it must remain a plain remote image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="visitor-counter-image"
          src={FLAG_COUNTER_URL}
          alt="FlagCounter showing visitors by country and region"
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setUnavailable(true)}
        />
      </a>
    </div>
  );
}
