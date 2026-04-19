const axios = require('axios');

async function testFetch() {
  try {
    const res = await axios.get(`http://localhost:1337/api/orders?sort=createdAt:desc&populate[items][populate][product][populate]=cover`);
    console.log(JSON.stringify(res.data.data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
testFetch();
