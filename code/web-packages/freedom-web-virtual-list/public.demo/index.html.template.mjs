export default () => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="index${(process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `-${process.env.FREEDOM_BUILD_UUID}` : ''}.mjs" type="module" async defer></script>
    <meta charset="utf-8" />
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <div id="print-root"></div>
  </body>
</html>
`;
};
