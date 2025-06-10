export default () => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <base href="/" />
    <script src="/index${(process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `-${process.env.FREEDOM_BUILD_UUID}` : ''}.mjs" type="module" async defer></script>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=2, viewport-fit=cover, interactive-widget=resize-content" />

    <link rel="icon" href="/images/favicon-light.png" media="(prefers-color-scheme: light)" />
    <link rel="icon" href="/images/favicon-dark.png" media="(prefers-color-scheme: dark)" />
    <link rel="mask-icon" href="/images/mask-icon.svg" color="white" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="description" content="Reclaim Your Privacy" />
    <link rel="apple-touch-icon" href="/images/icons-192.png" />
    <link rel="icon" sizes="192x192" href="/images/icons-192.png">
    <link rel="manifest" href="/manifest.json" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Freedom Mail" />
    <meta property="og:title" content="Freedom Mail" />
    <meta name="twitter:title" content="Freedom Mail" />
    <meta property="og:description" content="Reclaim Your Privacy" />
    <meta name="twitter:description" content="Reclaim Your Privacy" />
    <meta property="og:image" content="/images/default-share.png" />
    <meta name="twitter:image" content="/images/default-share.png />
    <meta name="twitter:card" content="summary_large_image" />


    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <link href="./global${(process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `-${process.env.FREEDOM_BUILD_UUID}` : ''}.css" rel="stylesheet">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <div id="print-root"></div>
  </body>
</html>
`;
};
