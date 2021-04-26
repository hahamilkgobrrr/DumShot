const app = require('express')();

app.get('/', (req, res) => res.send('Bot online'));

module.exports = () => {
  app.listen(3000);
}
