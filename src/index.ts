
import Magister from "./magister";

(async () => {
	let client = await Magister.new({
		username: "jouw_id",
		password: "jouw_wachtwoord",
		hostname: "school.magister.net"
	});

	console.log(client.userId);

})();