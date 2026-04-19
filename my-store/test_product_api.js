const axios = require('axios');

async function testFetch() {
  try {
    const slug = 'p0dr3wvuzur6k2oev1n52p6l';
    const qs = `/api/products?filters[$or][0][slug][$eq]=${slug}&filters[$or][1][documentId][$eq]=${slug}`;
    
    console.log("Fetching: " + qs);
    const res = await axios.get(`http://localhost:1337${qs}`);
    console.log("Success! Data length:", res.data.data.length);
  } catch (err) {
    if (err.response) {
      console.error("HTTP Error:", err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Network Error:", err.message);
    }
  }
}
testFetch();
