require('source-map-support').install()
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
  process.exit(1)
})

const html = `
<!doctype html>
<html>
  <head>
    <title></title>
    <link href="/main.css" rel="stylesheet" />
  </head>
  <body>
    <app></app>
    <script src="/client.js"></script>
  </body>
</html>

  `.trim()

app.use(bodyParser.json())
app.use(bodyParser.text())

app.use(express.static("./build"))
app.use((req, res) => res.status(200).end(html))

app.listen(3000, ()=> console.log("listening on 3000"))
