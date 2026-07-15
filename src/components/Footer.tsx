interface FooterProps {
  variant?: 'dark' | 'light';
}

export default function Footer({ variant = 'dark' }: FooterProps) {
  const isLight = variant === 'light';

  return (
    <footer className={`w-full py-6 px-4 text-center ${isLight ? 'text-primary-400' : 'text-secondary-500'}`}>
      <p className="text-sm">
        Made by Sammit Basu and Aarav Nadig. Part of Vidyashilp Academy
      </p>
    </footer>
  );
}
