var axios = require("axios").default;

require('dotenv').config();

var options = {
    method: 'POST',
    url: 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: new URLSearchParams({
        grant_type: process.env.GRANT_TYPE,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        audience: process.env.AUDIENCE
    })
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});


console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");