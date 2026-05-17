/**
 * ValedeskLogo — renders the correct PNG logo based on context.
 * • variant="dark"  → white text logo  (for dark backgrounds)
 * • variant="light" → dark  text logo  (for light backgrounds)
 * • variant="auto"  → picks based on the `dark` CSS class on <html>
 *
 * Images live in /public/images/ so they work after Netlify deploy.
 */

interface ValedeskLogoProps {
  /** Which colour variant to show */
  variant?: 'dark' | 'light' | 'auto';
  /** Tailwind height class, e.g. "h-7", "h-10" */
  className?: string;
}

export default function ValedeskLogo({ variant = 'auto', className = 'h-7' }: ValedeskLogoProps) {
  if (variant === 'auto') {
    return (
      <>
        {/* Show dark-mode logo when .dark is on html */}
        <img
          src="/images/logo-dark.png"
          alt="Valedesk"
          className={`${className} w-auto object-contain hidden dark:block`}
          draggable={false}
        />
        {/* Show light-mode logo otherwise */}
        <img
          src="/images/logo-light.png"
          alt="Valedesk"
          className={`${className} w-auto object-contain block dark:hidden`}
          draggable={false}
        />
      </>
    );
  }

  const src = variant === 'dark' ? '/images/logo-dark.png' : '/images/logo-light.png';
  return (
    <img
      src={src}
      alt="Valedesk"
      className={`${className} w-auto object-contain`}
      draggable={false}
    />
  );
}
