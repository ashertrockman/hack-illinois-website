const express = require('express')
const app = express()
const mysql = require('mariasql')
const semver = require('semver');

const conn = new mysql({
	user: 'root',
	password: 'password',
	host: '127.0.0.1',
	db: 'deps',
	port: 3306
})


function sat(v, R) {
	try {
		let s = semver.satisfies(v, R);	
		return s;
	} catch(e) {
		return false;
	}
}

app.get('/api/:name/:version', (req, res) => {
	console.log(req.params.name);
	console.log(req.params.version);

	let name = req.params.name;
	let version = req.params.version;

	let query = 'select a.slug, dep, oldv, newv, a.commit, state from illinois_updates_2 a join illinois_builds b on a.commit = b.commit where dep = "' + name + '"';

	conn.query(query,
	(err, rows) => {
		if(version)
			rows = rows.filter(x => sat(x.newv, version));

		let total = rows.length;

		let cnt = rows.reduce( (acc, val) => acc + (val.state == 'failed' ? 1 : 0), 0);
		let avg =  cnt / rows.length;
		return res.send({total, cnt, avg, data: rows});
	});
});

conn.query('show databases', console.log);

app.use(express.static('public'))

app.listen(80, () => console.log('Example app listening on port 3000!'))
