'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    AcademicCapIcon,
    EnvelopeIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import {
    EnvelopeIcon as EnvelopeSolidIcon,
    MapPinIcon as MapPinSolidIcon,
} from '@heroicons/react/24/solid';
import { Github, Linkedin } from 'lucide-react';
import VisitorMap from './VisitorMap';
import { SiteConfig } from '@/lib/config';

const OrcidIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z" />
    </svg>
);

interface ProfileProps {
    author: SiteConfig['author'];
    social: SiteConfig['social'];
    researchInterests?: string[];
}

type ContactKind = 'email' | 'location';

export default function Profile({ author, social, researchInterests }: ProfileProps) {
    const [hoveredContact, setHoveredContact] = useState<ContactKind | null>(null);
    const [pinnedContact, setPinnedContact] = useState<ContactKind | null>(null);
    const visibleContact = hoveredContact ?? pinnedContact;

    const socialLinks = [
        ...(social.email ? [{
            name: 'Email',
            href: `mailto:${social.email}`,
            icon: EnvelopeIcon,
            kind: 'email' as const,
        }] : []),
        ...(social.location || social.location_details ? [{
            name: 'Address',
            href: social.location_url || '#',
            icon: MapPinIcon,
            kind: 'location' as const,
        }] : []),
        ...(social.google_scholar ? [{
            name: 'Google Scholar',
            href: social.google_scholar,
            icon: AcademicCapIcon,
            kind: 'external' as const,
        }] : []),
        ...(social.orcid ? [{
            name: 'ORCID',
            href: social.orcid,
            icon: OrcidIcon,
            kind: 'external' as const,
        }] : []),
        ...(social.github ? [{
            name: 'GitHub',
            href: social.github,
            icon: Github,
            kind: 'external' as const,
        }] : []),
        ...(social.linkedin ? [{
            name: 'LinkedIn',
            href: social.linkedin,
            icon: Linkedin,
            kind: 'external' as const,
        }] : []),
    ];

    const toggleContact = (kind: ContactKind) => {
        setPinnedContact((current) => current === kind ? null : kind);
    };

    return (
        <div className="home-profile fade-in-up contents lg:sticky lg:top-28 lg:col-span-1 lg:block lg:w-full lg:self-start">
            <div className="home-profile-block order-1 lg:order-none">
                <div className="mx-auto mb-5 h-56 w-56 overflow-hidden rounded-lg bg-neutral-100 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md sm:h-64 sm:w-64">
                    <Image
                        src={author.avatar}
                        alt={author.name}
                        width={256}
                        height={256}
                        className="h-full w-full object-cover object-[32%_center]"
                        priority
                    />
                </div>

                <div className="mb-4 text-center">
                    <h1 className="mb-1 text-2xl font-semibold tracking-tight text-primary">
                        {author.name}
                    </h1>
                    <p className="mb-1 font-medium text-neutral-700">
                        {author.title}
                    </p>
                    <p className="text-sm text-neutral-500">
                        {author.institution}
                    </p>
                    {author.motto && (
                        <p className="mt-3 text-sm italic text-neutral-600">
                            {author.motto}
                        </p>
                    )}
                </div>

                <div className="relative flex flex-wrap justify-center gap-3 px-2 lg:mb-8">
                    {socialLinks.map((link) => {
                        const IconComponent = link.icon;

                        if (link.kind === 'email' || link.kind === 'location') {
                            const isPinned = pinnedContact === link.kind;
                            const isVisible = visibleContact === link.kind;
                            const ActiveIcon = link.kind === 'email' ? EnvelopeSolidIcon : MapPinSolidIcon;
                            const tooltipId = `profile-${link.kind}-tooltip`;

                            return (
                                <div
                                    key={link.name}
                                    className="relative"
                                    onMouseEnter={() => setHoveredContact(link.kind)}
                                    onMouseLeave={() => setHoveredContact(null)}
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleContact(link.kind)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Escape') setPinnedContact(null);
                                        }}
                                        className={`p-2 transition-colors duration-200 ${isPinned ? 'text-accent' : 'text-neutral-500 hover:text-accent'}`}
                                        aria-label={`Show ${link.name.toLowerCase()}`}
                                        aria-expanded={isVisible}
                                        aria-describedby={isVisible ? tooltipId : undefined}
                                    >
                                        {isPinned
                                            ? <ActiveIcon className="h-5 w-5" />
                                            : <IconComponent className="h-5 w-5" />
                                        }
                                    </button>

                                    {isVisible && (
                                        <div
                                            id={tooltipId}
                                            role="tooltip"
                                            className="absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-primary px-3 py-2 text-center text-xs leading-relaxed text-background shadow-lg"
                                        >
                                            {link.kind === 'email' ? (
                                                <>
                                                    <p className="mb-1 font-semibold">Email</p>
                                                    <p className="break-all">{social.email?.replace('@', ' (at) ')}</p>
                                                    <a
                                                        href={link.href}
                                                        className="mt-2 inline-flex items-center gap-1.5 rounded bg-accent px-2.5 py-1 font-medium text-white transition-colors hover:bg-accent-dark"
                                                    >
                                                        <EnvelopeIcon className="h-3.5 w-3.5" />
                                                        Send email
                                                    </a>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="mb-1 font-semibold">Work Address</p>
                                                    {(social.location_details?.length
                                                        ? social.location_details
                                                        : [social.location]
                                                    ).filter(Boolean).map((line, index) => (
                                                        <p key={index}>{line}</p>
                                                    ))}
                                                    {social.location_url && (
                                                        <a
                                                            href={social.location_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2 inline-flex items-center gap-1.5 rounded bg-accent px-2.5 py-1 font-medium text-white transition-colors hover:bg-accent-dark"
                                                        >
                                                            <MapPinIcon className="h-3.5 w-3.5" />
                                                            Google Maps
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                            <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-primary" />
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative p-2 text-neutral-500 transition-colors duration-200 hover:text-accent"
                                aria-label={link.name}
                            >
                                <IconComponent className="h-5 w-5" />
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-1 text-xs font-medium text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                                >
                                    {link.name}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </div>

            {researchInterests && researchInterests.length > 0 && (
                <div className="home-profile-block order-2 lg:order-none lg:mb-8">
                    <h3 className="mb-3 border-b border-neutral-200 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Research Interests
                    </h3>
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                        {researchInterests.map((interest, index) => (
                            <li key={index}>{interest}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="home-profile-block order-4 transition-transform duration-200 hover:scale-[1.02] lg:order-none">
                <h3 className="mb-3 border-b border-neutral-200 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Visitors
                </h3>
                <VisitorMap />
            </div>
        </div>
    );
}
