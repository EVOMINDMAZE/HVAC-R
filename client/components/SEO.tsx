import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    type?: 'website' | 'article';
    name?: string;
    image?: string;
}

export function SEO({
    title,
    description,
    canonical,
    type = 'website',
    name = 'ThermoNeural',
    image = '/og-image.jpg' // We should ensure this file exists or update it later
}: SEOProps) {
    const siteTitle = 'ThermoNeural';
    const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
    const currentUrl = window.location.href;
    const canonicalUrl = canonical || currentUrl.split('?')[0];

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* OpenGraph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:site_name" content={name} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
