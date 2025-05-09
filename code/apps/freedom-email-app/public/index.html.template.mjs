export default () => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="index${(process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `-${process.env.FREEDOM_BUILD_UUID}` : ''}.mjs" type="module" async defer></script>
    <meta charset="utf-8" />
    <!-- <link rel="icon" href="/favicon-light.png" media="(prefers-color-scheme: light)" /> -->
    <!-- <link rel="icon" href="/favicon-dark.png" media="(prefers-color-scheme: dark)" /> -->
    <!-- <link rel="mask-icon" href="/mask-icon.svg" color="white" /> -->
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=overlays-content" /> -->
    <!-- <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> -->
    <!-- <meta name="description" content="TODO" /> -->
    <!-- <link rel="apple-touch-icon" href="/logo192.png" /> -->
    <!-- <link rel="icon" sizes="192x192" href="/logo192.png"> -->
    <!-- <link rel="manifest" href="/manifest.json" /> -->
    <!-- <meta property="og:site_name" content="Freedom Email" /> -->

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    />
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <div id="print-root"></div>
  </body>
</html>
`;
};
