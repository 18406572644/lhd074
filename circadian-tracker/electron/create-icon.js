const fs = require('fs')
const path = require('path')

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAaElEQVR4' +
  'A+3OsQEAAAjDsK2z9T8GQ7gA8NkfXx0BAQEBAQEBAQEBAQEBAQEBAQEB' +
  'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB' +
  'AQEBAQEBAQEBAQEBAQ0BOcgYBnE154mwAAAABJRU5ErkJggg==',
  'base64'
)

fs.writeFileSync(path.join(__dirname, 'icon.png'), png)
console.log('icon.png created')
