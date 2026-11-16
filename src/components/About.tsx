'use client';

import { motion, useTransform } from 'motion/react';
import { useContent } from '@/content/context';
import { SiteImage } from './SiteImage';
import { TypeText, useWindowOpen } from './Motion';
import { useDrift } from './useDrift';
import { TitleBar } from './Window';

export function About() {
  const { about } = useContent();
  const { ref, drift } = useDrift<HTMLElement>();
  const onDesktop = () => window.innerWidth >= 1024;
  const photoY = useTransform(drift, (p) => (p && onDesktop() ? p * 46 : 0));
  const textY = useTransform(drift, (p) => (p && onDesktop() ? p * -84 : 0));
  const openPhoto = useWindowOpen();
  const openText = useWindowOpen(0.18);

  return (
    <section className="about" id="about" ref={ref}>
      <motion.div className="window photo-window" style={{ y: photoY }} {...openPhoto}>
        <TitleBar title={about.portraitFile} />
        <div className="portrait">
          <SiteImage src={about.portrait} alt={about.portraitAlt} sizes="(max-width: 1023px) 76vw, 560px" />
        </div>
      </motion.div>
      <motion.div className="window text-window" style={{ y: textY }} {...openText}>
        <TitleBar title="about.txt" />
        <div className="text-body">
          <TypeText className="statement" text={about.bioLead} />
          <p>{about.bioBody}</p>
          <a className="text-link" href={about.instagramUrl} target="_blank" rel="noopener">
            {about.instagramHandle} on instagram
          </a>
        </div>
      </motion.div>
    </section>
  );
}
