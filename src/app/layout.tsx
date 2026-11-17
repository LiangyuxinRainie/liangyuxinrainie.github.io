import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { getConfig } from "@/lib/config";
import { getLastUpdated } from "@/lib/lastUpdated";


export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  return {
    metadataBase: new URL(config.site.url),
    title: {
      default: config.site.home_title ?? config.author.name,
      template: `%s | ${config.author.name}`
    },
    description: config.site.description,
    keywords: [config.author.name, "M.S. Student", "Edge Intelligence", "Mobile AIGC", config.author.institution],
    authors: [{ name: config.author.name }],
    creator: config.author.name,
    publisher: config.author.name,
    icons: {
      icon: config.site.favicon,
    },
    alternates: {
      canonical: '/',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getConfig();
  const sameAs = [
    config.social.google_scholar,
    config.social.github,
    config.social.linkedin,
    config.social.orcid,
  ].filter((url): url is string => typeof url === 'string');
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: config.author.name,
    url: config.site.url,
    image: `${config.site.url}${config.author.avatar}`,
    jobTitle: config.author.title,
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: 'Huazhong University of Science and Technology',
      url: 'https://english.hust.edu.cn/',
    },
    sameAs,
    knowsAbout: [
      'Mobile Edge Computing',
      'Edge Intelligence',
      'Diffusion Models',
      'Networking for AI',
      'Mobile AI-Generated Content Networks',
      'Distributed Inference',
    ],
  };
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema).replace(/</g, '\\u003c'),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme-storage');
                const parsed = theme ? JSON.parse(theme) : null;
                const setting = parsed?.state?.theme || 'system';
                const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                const effective = setting === 'dark' ? 'dark' : (setting === 'light' ? 'light' : (prefersDark ? 'dark' : 'light'));
                var root = document.documentElement;
                root.classList.add(effective);
                root.setAttribute('data-theme', effective);
              } catch (e) {
                var root = document.documentElement;
                root.classList.add('light');
                root.setAttribute('data-theme', 'light');
              }
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-primary focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <Navigation
            items={config.navigation}
            siteTitle={config.site.title}
          />
          <main id="main-content" className="min-h-screen pt-16 lg:pt-20">
            {children}
          </main>
          <Footer lastUpdated={getLastUpdated()} owner={config.author.name} />
        </ThemeProvider>
      </body>
    </html>
  );
}
