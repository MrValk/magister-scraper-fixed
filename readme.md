# magister-scraper

This is a fixed version of [JipFr's magister-scraper](https://github.com/JipFr/magister-scraper/).
Now also includes error messages that indicate incorrect username, password or hostname

---

This library handles login in and sending GET requests with the relevant cookies and such. The endpoints are the same as in the official client and you'll have to enter those yourself.

## Example

Getting your schedule would look something like this

```js
import { Magister } from "magister-scraper";

async function run() {
  let client = await Magister.new({
    username: "jouw_id",
    password: "jouw_wachtwoord",
    hostname: "school.magister.net",
  });

  let url = `https://${client.hostname}/api/personen/${client.userId}/afspraken`;
  let data = await client.get(url);

  console.info(data);
}
run();
```
