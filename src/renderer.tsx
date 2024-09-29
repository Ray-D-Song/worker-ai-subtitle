export default `<html class="dark">
  <head>
    <link href="/static/style.css" rel="stylesheet" />
    ${import.meta.env.PROD ? (
      '<script type="module" src="/static/client.js"></script>'
    ) : (
      '<script type="module" src="/src/client.tsx"></script>'
    )}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
