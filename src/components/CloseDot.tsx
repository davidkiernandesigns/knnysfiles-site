'use client';

import { BackLink } from './GrowProvider';
import { useSleep } from './Sleep';

/* The first dot. In a project it closes the folder back to work. In a popup window it closes that window. On the page it tries to close the tab, and when the browser
   refuses (it does for any tab it didn't open from a script) it puts the desktop to sleep instead. */
export function CloseDot({ onClose, back }: { onClose?: () => void; back?: boolean }) {
  const { setAsleep } = useSleep();
  if (back) return <BackLink className="dot-close" aria-label="close folder, back to work" />;
  return (
    <button
      type="button"
      aria-label={onClose ? 'close menu' : 'close tab'}
      onClick={() => {
        if (onClose) return onClose();
        window.close();
        setAsleep(true);
      }}
    />
  );
}
