// src/app/careers/page.tsx
import { SEO } from '@/components/common/SEO';
import { Briefcase, Users, Code, HeartHandshake, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';

const careersSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Careers at Nimart",
  "description": "Join the Nimart team! We're looking for marketers, social media experts, developers and anyone interested in learning.",
  "url": "https://nimart.ng/careers",
  "mainEntity": {
    "@type": "Organization",
    "name": "Nimart",
    "url": "https://nimart.ng",
    "sameAs": [
      "https://www.tiktok.com/@nimart.ng",
      "https://www.instagram.com/nimartng",
      "https://x.com/nimartng",
      "https://web.facebook.com/people/Nimart/61551209078955/"
    ]
  }
};

const roles = [
  {
    icon: <Briefcase className="h-8 w-8 text-primary-600" />,
    title: 'Brand Marketer',
    description: 'Help us grow Nimart’s presence across Nigeria. You’ll promote the platform, build partnerships with local businesses, and drive user acquisition through on‑ground and digital campaigns.',
    location: 'Remote / Anywhere in Nigeria',
    type: 'Full‑time / Part‑time',
  },
  {
    icon: <Users className="h-8 w-8 text-primary-600" />,
    title: 'Social Media Expert',
    description: 'Create engaging content, manage our social media channels, and build a vibrant online community. You understand TikTok, Instagram, X, and Facebook trends.',
    location: 'Remote',
    type: 'Flexible hours',
  },
  {
    icon: <Code className="h-8 w-8 text-primary-600" />,
    title: 'Developer (or Aspiring Developer)',
    description: 'We’re looking for talented developers to improve the Nimart platform, and we welcome anyone eager to learn. Work on real features, learn from the team, and grow your skills.',
    location: 'Remote',
    type: 'Full‑time / Internship / Learning',
  },
];

export default function CareersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        title="Careers at Nimart"
        description="Join Nimart – we're hiring marketers, social media experts, and developers. Work remotely and help connect Nigerians with trusted local services."
        url="https://nimart.ng/careers"
        schema={careersSchema}
      />

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Join the <span className="text-primary-600">Nimart</span> Team
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We’re building Nigeria’s most trusted service marketplace, and we’re looking for passionate
          people to grow with us. Remote‑friendly, flexible, and open to learners.
        </p>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {roles.map((role) => (
          <div key={role.title} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="mb-4">{role.icon}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">{role.description}</p>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary-500" /> {role.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary-500" /> {role.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Why Join Us */}
      <div className="bg-gradient-to-r from-primary-50 to-green-50 rounded-2xl p-8 md:p-12 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <HeartHandshake className="h-10 w-10 text-primary-600" />
          <h2 className="text-3xl font-bold text-gray-900">Why Work With Us?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg mb-2">Fully Remote</h3>
            <p>Work from anywhere in Nigeria. All you need is a smartphone and internet connection.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Growth Opportunities</h3>
            <p>Learn new skills, take ownership of projects, and grow with a fast‑moving startup.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Real Impact</h3>
            <p>Help millions of Nigerians connect with trusted service providers every day.</p>
          </div>
        </div>
      </div>

      {/* Apply */}
      <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
        <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Join?</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-6">
          Send us an email with your name, the role you’re interested in, and a short introduction.
          If you don’t have a CV yet, just tell us why you’d be a great fit!
        </p>
        <a
          href="mailto:careers@nimart.ng?subject=Application%20for%20%5BRole%5D%20-%20%5BYour%20Name%5D"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20"
        >
          Apply via Email <ArrowRight className="h-5 w-5" />
        </a>
        <p className="text-sm text-gray-500 mt-4">careers@nimart.ng</p>
      </div>
    </div>
  );
}